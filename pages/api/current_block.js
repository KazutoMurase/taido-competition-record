import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";
import { GetEventName } from "../../lib/get_event_name";

function update(sorted_data, item, block_indices, value, round) {
  if ("prev_left_id" in item) {
    update(
      sorted_data,
      sorted_data[item["prev_left_id"]],
      block_indices,
      value,
      round - 1,
    );
  }
  if (!("prev_left_id" in item) || !("prev_right_id" in item)) {
    if (value === "left") {
      block_indices.push(item["id"]);
    } else {
      block_indices.splice(0, 0, item["id"]);
    }
  }
  if ("prev_right_id" in item) {
    update(
      sorted_data,
      sorted_data[item["prev_right_id"]],
      block_indices,
      value,
      round - 1,
    );
  }
  item["round"] = round;
  item["block_pos"] = value;
}

async function GetFromDB(req, res) {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const current_block_name = "current_" + block_name;
  let query =
    "SELECT t0.id, t0.game_id, t2.name_en AS event_name from " +
    current_block_name +
    " AS t0 LEFT JOIN " +
    block_name +
    " AS t1 ON t0.id = t1.id" +
    " LEFT JOIN event_type AS t2 ON t1.event_id = t2.id";
  let result = await client.query(query);
  let event_name = result.rows[0].event_name;
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
  if (event_name.includes("dantai")) {
    const groups_name = event_name + "_groups";
    const groups = event_name.includes("test") ? "test_groups" : "groups";
    query =
      "SELECT t1.id, t1.left_group_flag, t1.left_group_id, t1.right_group_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name, t1.left_retire, t1.right_retire FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      groups_name +
      " AS t2 ON t1.left_group_id = t2.id" +
      " LEFT JOIN " +
      groups_name +
      " AS t3 ON t1.right_group_id = t3.id" +
      " LEFT JOIN " +
      groups +
      " AS t4 ON t2.group_id = t4.id LEFT JOIN " +
      groups +
      " AS t5 ON t3.group_id = t5.id";
  } else {
    const players_name = event_name.includes("test")
      ? "test_players"
      : "players";
    const groups = event_name.includes("test") ? "test_groups" : "groups";
    query =
      "SELECT t1.id, t1.left_player_flag, t1.left_player_id, t1.right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name, t4.name AS left_group_name, t5.name AS right_group_name, t1.left_retire, t1.right_retire FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      players_name +
      " AS t2 ON t1.left_player_id = t2." +
      event_name +
      "_player_id LEFT JOIN " +
      players_name +
      " AS t3 ON t1.right_player_id = t3." +
      event_name +
      "_player_id LEFT JOIN " +
      groups +
      " AS t4 ON t2.group_id = t4.id LEFT JOIN " +
      groups +
      " AS t5 ON t3.group_id = t5.id";
  }
  const result_schedule = await client.query(query);
  const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
  // set round 0, 1,...until (without final and before final)
  for (let i = 0; i < sorted_data.length; i++) {
    if (i == sorted_data.length - 2) {
      sorted_data[i]["fake_round"] = sorted_data[i - 1]["round"] + 1;
    } else if (!("round" in sorted_data[i])) {
      if (i === 0 || sorted_data[i - 1]["round"] === 1) {
        sorted_data[i]["round"] = 1;
      } else {
        sorted_data[i]["round"] = 2;
      }
    }
    const next_left_id = sorted_data[i]["next_left_id"];
    if (
      next_left_id !== null &&
      sorted_data[parseInt(next_left_id) - 1] !== undefined
    ) {
      sorted_data[parseInt(next_left_id) - 1]["has_left"] = true;
      let update_round = sorted_data[i]["round"] + 1;
      if (
        "round" in sorted_data[parseInt(next_left_id) - 1] &&
        sorted_data[parseInt(next_left_id) - 1]["round"] !== update_round
      ) {
        if (sorted_data[parseInt(next_left_id) - 1]["round"] < update_round) {
          if ("prev_left_id" in sorted_data[parseInt(next_left_id) - 1]) {
            sorted_data[
              sorted_data[parseInt(next_left_id) - 1]["prev_left_id"]
            ]["round"] = update_round - 1;
          } else if (
            "prev_right_id" in sorted_data[parseInt(next_left_id) - 1]
          ) {
            sorted_data[
              sorted_data[parseInt(next_left_id) - 1]["prev_right_id"]
            ]["round"] = update_round - 1;
          }
        } else {
          update_round = sorted_data[parseInt(next_left_id) - 1]["round"];
          if ("prev_left_id" in sorted_data[parseInt(next_left_id) - 1]) {
            sorted_data[i]["round"] = update_round - 1;
          } else if (
            "prev_right_id" in sorted_data[parseInt(next_left_id) - 1]
          ) {
            sorted_data[i]["round"] = update_round - 1;
          }
        }
      }
      sorted_data[parseInt(next_left_id) - 1]["round"] = update_round;
      sorted_data[parseInt(next_left_id) - 1]["prev_left_id"] = i;
    }
    const next_right_id = sorted_data[i]["next_right_id"];
    if (
      next_right_id !== null &&
      sorted_data[parseInt(next_right_id) - 1] !== undefined
    ) {
      sorted_data[parseInt(next_right_id) - 1]["has_right"] = true;
      let update_round = sorted_data[i]["round"] + 1;
      if (
        "round" in sorted_data[parseInt(next_right_id) - 1] &&
        sorted_data[parseInt(next_right_id) - 1]["round"] !== update_round
      ) {
        if (sorted_data[parseInt(next_right_id) - 1]["round"] < update_round) {
          if ("prev_left_id" in sorted_data[parseInt(next_right_id) - 1]) {
            sorted_data[
              sorted_data[parseInt(next_right_id) - 1]["prev_left_id"]
            ]["round"] = update_round - 1;
          } else if (
            "prev_right_id" in sorted_data[parseInt(next_right_id) - 1]
          ) {
            sorted_data[
              sorted_data[parseInt(next_right_id) - 1]["prev_right_id"]
            ]["round"] = update_round - 1;
          }
        } else {
          update_round = sorted_data[parseInt(next_right_id) - 1]["round"];
          if ("prev_left_id" in sorted_data[parseInt(next_right_id) - 1]) {
            sorted_data[i]["round"] = update_round - 1;
          } else if (
            "prev_right_id" in sorted_data[parseInt(next_right_id) - 1]
          ) {
            sorted_data[i]["round"] = update_round - 1;
          }
        }
      }
      sorted_data[parseInt(next_right_id) - 1]["round"] = update_round;
      sorted_data[parseInt(next_right_id) - 1]["prev_right_id"] = i;
    }
  }
  // set block pos
  let left_block_indices = [];
  let right_block_indices = [];
  if (
    sorted_data.length > 3 &&
    "prev_left_id" in sorted_data[sorted_data.length - 1] &&
    "prev_right_id" in sorted_data[sorted_data.length - 1]
  ) {
    sorted_data[sorted_data.length - 1]["block_pos"] = "center";
    sorted_data[sorted_data.length - 2]["block_pos"] = "center";
    const left_block_id = sorted_data[sorted_data.length - 1]["prev_left_id"];
    const right_block_id = sorted_data[sorted_data.length - 1]["prev_right_id"];
    update(
      sorted_data,
      sorted_data[left_block_id],
      left_block_indices,
      "left",
      sorted_data[left_block_id]["round"],
    );
    update(
      sorted_data,
      sorted_data[right_block_id],
      right_block_indices,
      "right",
      sorted_data[right_block_id]["round"],
    );
  }
  // select item
  for (let i = 0; i < sorted_data.length; i++) {
    if (sorted_data[i]["left_group_name"] !== null) {
      sorted_data[i]["left_group_name"] = sorted_data[i]["left_group_name"]
        ?.replace("'", "")
        .replace("'", "");
    }
    if (sorted_data[i]["right_group_name"] !== null) {
      sorted_data[i]["right_group_name"] = sorted_data[i]["right_group_name"]
        ?.replace("'", "")
        .replace("'", "");
    }
    if (sorted_data[i]["id"] === current_id) {
      sorted_data[i].left_color =
        sorted_data[i].block_pos == "left" ||
        sorted_data[i].block_pos == "center"
          ? "red"
          : "white";
      sorted_data[i]["event_name"] = event_name;
      return sorted_data[i];
    }
  }
  return [];
}

const CurrentBlock = async (req, res) => {
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

export default CurrentBlock;
