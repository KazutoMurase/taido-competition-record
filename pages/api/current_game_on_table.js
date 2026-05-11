import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";
import { GetEventName } from "../../lib/get_event_name";

async function GetFromDB(req, res) {
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
  const event_name = req.query.event_name;
  if (
    req.query.schedule_id !== undefined &&
    parseInt(req.query.schedule_id) !== result.rows[0].id
  ) {
    return [];
  }
  query =
    "SELECT game_id from " +
    block_name +
    "_games where order_id = $1 and schedule_id = $2";
  let values = [result.rows[0].game_id, result.rows[0].id];
  result = await client.query(query, values);
  let current_id = result.rows[0].game_id;
  const groups_name = event_name + "_groups";
  const groups = event_name.includes("test") ? "test_groups" : "groups";
  if (event_name.includes("tenkai")) {
    query =
      "SELECT t1.id, t2.name, t1.main_score, t1.sub1_score, t1.sub2_score, t1.sub3_score, t1.sub4_score, t1.sub5_score, t1.elapsed_time, t1.penalty, t1.start_penalty, t1.retire FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      groups_name +
      " AS t2 ON t1.group_id = t2.id WHERE t1.id = " +
      current_id;
  } else {
    query =
      "SELECT t1.id, t2.name, t1.main_score, t1.sub1_score, t1.sub2_score, t1.penalty, t1.retire FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      groups_name +
      " AS t2 ON t1.group_id = t2.id WHERE t1.id = " +
      current_id;
  }
  const result_schedule = await client.query(query);
  if (result_schedule.rows.length === 0) {
    return [];
  }
  return result_schedule.rows[0];
}

const CurrentGameOnTable = async (req, res) => {
  try {
    const block_name = "block_" + req.query.block_number;
    const current_block_name = "current_" + block_name;
    const event_name = req.query.event_name;
    const cacheKey = "current_" + block_name;
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
    const data = await GetFromDB(req, res);
    if (data.length !== 0) {
      await Set(cacheKey, { data: data, timestamp: Date.now() });
    }
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default CurrentGameOnTable;
