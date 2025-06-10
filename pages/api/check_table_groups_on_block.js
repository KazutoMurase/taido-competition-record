import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";
import { GetEventName } from "../../lib/get_event_name";

async function GetFromDB(
  req,
  res,
  event_id,
  event_name,
  notification_request_name,
) {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const groups_name = event_name + "_groups";
  const schedule_id = req.query.schedule_id;
  let query =
    "SELECT t1.id, t2.id AS group_id, t2.name, t1.retire FROM " +
    block_name +
    "_games AS t0 LEFT JOIN " +
    event_name +
    " AS t1 ON t0.game_id = t1.id LEFT JOIN " +
    groups_name +
    " AS t2 ON t1.group_id = t2.id" +
    " where t0.schedule_id = $1 and t2.id is not null";
  const result = await client.query(query, [schedule_id]);
  const sorted_data = result.rows.sort((a, b) => a.id - b.id);
  query =
    "SELECT group_id, event_id, court_id FROM " + notification_request_name;
  const result_requested = await client.query(query);
  const requested_data = result_requested.rows;
  // select item
  for (let i = 0; i < sorted_data.length; i++) {
    for (let j = 0; j < requested_data.length; j++) {
      if (
        requested_data[j]["group_id"] === sorted_data[i].id &&
        requested_data[j]["event_id"] === event_id
      ) {
        sorted_data[i]["requested"] = true;
        break;
      }
    }
  }
  // check if all requested
  let all_requested_array = [];
  for (let i = 0; i < requested_data.length; i++) {
    if (!requested_data[i]["group_id"] && !requested_data[i]["player_id"]) {
      all_requested_array.push({
        court_id: requested_data[i]["court_id"],
        event_id: requested_data[i]["event_id"],
      });
    }
  }
  return { items: sorted_data, all_requested: all_requested_array };
}

const CheckTableGroupsOnBlock = async (req, res) => {
  try {
    const is_test = req.query.is_test === "true";
    const event_id = parseInt(req.query.event_id);
    const block_name = "block_" + req.query.block_number;
    const cacheKey =
      "check_table_groups_on_" + block_name + "_for_" + req.query.schedule_id;
    const cachedData = await Get(cacheKey);
    const notification_request_name = is_test
      ? "test_notification_request"
      : "notification_request";
    const latestNotificationUpdateKey =
      "latest_update_for_" + notification_request_name;
    const latestNotificationUpdateTimestamp =
      (await Get(latestNotificationUpdateKey)) || 0;
    const latestCompleteTableGroupsKey =
      "update_complete_players_for_" + block_name;
    const latestCompleteTableGroupsTimestamp =
      (await Get(latestCompleteTableGroupsKey)) || 0;
    const event_name = (is_test ? "test_" : "") + GetEventName(event_id);
    const latestResultUpdateKey =
      "latest_update_result_for_" + event_name + "_timestamp";
    const latestResultUpdateTimestamp = (await Get(latestResultUpdateKey)) || 0;
    if (
      cachedData &&
      latestResultUpdateTimestamp < cachedData.timestamp &&
      latestNotificationUpdateTimestamp < cachedData.timestamp &&
      latestCompleteTableGroupsTimestamp < cachedData.timestamp
    ) {
      console.log("using cache");
      return res.json(cachedData.data);
    }
    console.log("get new data");
    const data = await GetFromDB(
      req,
      res,
      event_id,
      event_name,
      notification_request_name,
    );
    await Set(cacheKey, { data: data, timestamp: Date.now() });
    return res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default CheckTableGroupsOnBlock;
