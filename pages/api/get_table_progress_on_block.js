import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";
import { GetEventName } from "../../lib/get_event_name";

async function GetFromDB(req, res, event_name) {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const current_block_name = "current_" + block_name;
  let query =
    "SELECT t0.id, t0.game_id from " +
    current_block_name +
    " AS t0 LEFT JOIN " +
    block_name +
    " AS t1 ON t0.id = t1.id";
  let result = await client.query(query);
  if (
    req.query.schedule_id !== undefined &&
    parseInt(req.query.schedule_id) !== result.rows[0].id
  ) {
    return [];
  }
  let schedule_id = result.rows[0].id;
  query =
    "SELECT game_id from " +
    block_name +
    "_games where order_id = $1 and schedule_id = $2";
  let values = [result.rows[0].game_id, result.rows[0].id];
  result = await client.query(query, values);
  const current_id = result.rows.length === 0 ? -1 : result.rows[0].game_id;
  const groups_name = event_name + "_groups";
  query =
    "SELECT t0.order_id, t1.id, t1.retire, t2.name FROM " +
    block_name +
    "_games AS t0 LEFT JOIN " +
    event_name +
    " AS t1 ON t0.game_id = t1.id LEFT JOIN " +
    groups_name +
    " AS t2 ON t1.group_id = t2.id" +
    " where t0.schedule_id = $1";
  const result_block = await client.query(query, [schedule_id]);
  let sorted_block_data = result_block.rows.sort(
    (a, b) => a.order_id - b.order_id,
  );
  for (let i = 0; i < sorted_block_data.length; i++) {
    let id = parseInt(sorted_block_data[i]["id"]);
    if (sorted_block_data[i]["id"] === current_id) {
      sorted_block_data[i]["current"] = true;
    }
  }
  return sorted_block_data;
}

const GetTableProgressOnBlock = async (req, res) => {
  try {
    const block_name = "block_" + req.query.block_number;
    const current_block_name = "current_" + block_name;
    const event_name = req.query.event_name;
    const cacheKey = "get_games_on_" + block_name;
    const cachedData = await Get(cacheKey);

    // 'update_id_for_' +current_block_name can be checked,
    // but only game id should be enough in the current logic
    const latestGameIdUpdateKey = "update_game_id_for_" + current_block_name;
    const latestChangeOrderKey = "change_order_for_" + block_name;
    const latestUpdateResultKey =
      "latest_update_result_for_" + event_name + "_timestamp";
    const latestCompletePlayersKey =
      "update_complete_players_for_" + block_name;

    const latestGameIdUpdateTimestamp = (await Get(latestGameIdUpdateKey)) || 0;
    const latestChangeOrderTimestamp = (await Get(latestChangeOrderKey)) || 0;
    const latestUpdateResultTimestamp = (await Get(latestUpdateResultKey)) || 0;
    const latestCompletePlayersTimestamp =
      (await Get(latestCompletePlayersKey)) || 0;
    if (
      cachedData &&
      latestGameIdUpdateTimestamp < cachedData.timestamp &&
      latestChangeOrderTimestamp < cachedData.timestamp &&
      latestUpdateResultTimestamp < cachedData.timestamp &&
      latestCompletePlayersTimestamp < cachedData.timestamp
    ) {
      console.log("using cache");
      return res.json(cachedData.data);
    }
    console.log("get new data");
    const data = await GetFromDB(req, res, event_name);
    if (data.length !== 0) {
      await Set(cacheKey, { data: data, timestamp: Date.now() });
    }
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetTableProgressOnBlock;
