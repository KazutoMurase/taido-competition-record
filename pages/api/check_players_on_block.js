import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";
import { GetEventName } from "../../lib/get_event_name";

async function GetFromDB(
  req,
  res,
  event_name,
  players_name,
  notification_request_name,
) {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const schedule_id = req.query.schedule_id;
  let query =
    "SELECT t1.id, t2.id AS left_player_id, t3.id AS right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name, t2.name_kana AS left_name_kana, t3.name_kana AS right_name_kana FROM " +
    block_name +
    "_games AS t0 LEFT JOIN " +
    event_name +
    " AS t1 ON t0.game_id = t1.id LEFT JOIN " +
    players_name +
    " AS t2 ON t1.left_player_id = t2." +
    event_name +
    "_player_id LEFT JOIN " +
    players_name +
    " AS t3 ON t1.right_player_id = t3." +
    event_name +
    "_player_id where t0.schedule_id = $1";
  const result = await client.query(query, [schedule_id]);
  const data = result.rows.sort((a, b) => a.id - b.id);

  query =
    "SELECT t1.id, t1.next_left_id, t1.next_right_id, t1.left_retire, t1.right_retire FROM " +
    event_name +
    " AS t1";
  const result_schedule = await client.query(query);
  const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
  // set round 0, 1,...until (without final and before final)
  let round_num = {};
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
  for (let i = 0; i < sorted_data.length; i++) {
    if (round_num[sorted_data[i]["round"]] === undefined) {
      round_num[sorted_data[i]["round"]] = 1;
    } else {
      round_num[sorted_data[i]["round"]] += 1;
    }
  }
  query = "SELECT player_id FROM " + notification_request_name;
  const result_requested = await client.query(query);
  const requested_data = result_requested.rows;
  // select item
  let result_array = [];
  for (let i = 0; i < data.length; i++) {
    for (let j = 0; j < sorted_data.length; j++) {
      if (data[i].id === sorted_data[j].id) {
        let game_id;
        let block_pos;
        if (j === sorted_data.length - 1) {
          block_pos = "center";
          game_id = 1;
        } else if ("round" in sorted_data[j]) {
          const round = sorted_data[j]["round"];
          game_id = sorted_data[j]["id"];
          for (let k = 0; k < round - 1; k++) {
            game_id -= round_num[k + 1];
          }
          block_pos = game_id <= round_num[round] / 2 ? "left" : "right";
        } else {
          block_pos = "center";
          game_id = 1;
        }
        if (data[i].left_player_id !== null) {
          let duplicated = false;
          for (let k = 0; k < result_array.length; k++) {
            if (result_array[k]["id"] == data[i].left_player_id) {
              duplicated = true;
              if (result_array[k]["retire"] === null) {
                result_array[k]["retire"] = data[i].left_retire;
              }
              break;
            }
          }
          if (!duplicated) {
            let requested = false;
            for (let k = 0; k < requested_data.length; k++) {
              if (requested_data[k]["player_id"] === data[i].left_player_id) {
                requested = true;
                break;
              }
            }
            result_array.push({
              id: data[i].left_player_id,
              game_id: sorted_data[j].id,
              is_left: true,
              retire: sorted_data[j].left_retire,
              name: data[i].left_name,
              name_kana: data[i].left_name_kana,
              requested: requested,
              color:
                block_pos === "left" || block_pos === "center"
                  ? "red"
                  : "white",
            });
          }
        }
        if (data[i].right_player_id !== null) {
          let duplicated = false;
          for (let k = 0; k < result_array.length; k++) {
            if (result_array[k]["id"] == data[i].right_player_id) {
              duplicated = true;
              if (result_array[k]["retire"] === null) {
                result_array[k]["retire"] = data[i].right_retire;
              }
              break;
            }
          }
          if (!duplicated) {
            let requested = false;
            for (let k = 0; k < requested_data.length; k++) {
              if (requested_data[k]["player_id"] === data[i].right_player_id) {
                requested = true;
                break;
              }
            }
            result_array.push({
              id: data[i].right_player_id,
              game_id: sorted_data[j].id,
              is_left: false,
              retire: sorted_data[j].right_retire,
              name: data[i].right_name,
              name_kana: data[i].right_name_kana,
              requested: requested,
              color:
                block_pos === "left" || block_pos === "center"
                  ? "white"
                  : "red",
            });
          }
        }
      }
    }
  }
  return result_array;
}

async function GetDantaiFromDB(
  req,
  res,
  event_id,
  is_test,
  notification_request_name,
) {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const event_name = is_test ? "test_dantai" : "dantai";
  const schedule_id = req.query.schedule_id;
  let query =
    "SELECT game_id FROM " +
    block_name +
    "_games WHERE schedule_id = " +
    schedule_id;
  let result_dantai = await client.query(query);
  console.log(result_dantai.rows);
  const sorted_dantai = result_dantai.rows.sort(
    (a, b) => a.game_id - b.game_id,
  );
  const game_id = sorted_dantai[0].game_id;
  console.log(game_id);
  query =
    "SELECT t1.name, t0.group_id, t0.event_id FROM " +
    event_name +
    " as t0 LEFT JOIN groups AS t1 ON t0.group_id = t1.id WHERE t0.event_id = " +
    event_id +
    " and game_id = " +
    game_id;
  result_dantai = await client.query(query);
  if (result_dantai.rows.length === 0) {
    query =
      "SELECT t1.name, t0.group_id, t0.event_id FROM " +
      event_name +
      " as t0 LEFT JOIN groups AS t1 ON t0.group_id = t1.id WHERE t0.event_id = " +
      event_id;
    result_dantai = await client.query(query);
    for (let i = 0; i < result_dantai.rows.length; i++) {
      result_dantai.rows[i]["all"] = true;
    }
  }
  query =
    "SELECT group_id, event_id FROM " +
    notification_request_name +
    " WHERE group_id is not null";
  const result_requested = await client.query(query);
  const requested_data = result_requested.rows;
  for (let i = 0; i < result_dantai.rows.length; i++) {
    for (let j = 0; j < requested_data.length; j++) {
      if (
        result_dantai.rows[i].group_id === requested_data[j].group_id &&
        result_dantai.rows[i].event_id === requested_data[j].event_id
      ) {
        result_dantai.rows[i]["requested"] = true;
        break;
      }
    }
  }
  return result_dantai.rows;
}

export default async (req, res) => {
  try {
    const is_test = req.query.is_test === "true";
    const event_id = parseInt(req.query.event_id);
    const block_name = "block_" + req.query.block_number;
    const cacheKey =
      "check_players_on_" + block_name + "_for_" + req.query.schedule_id;
    const cachedData = await Get(cacheKey);
    const notification_request_name = is_test
      ? "test_notification_request"
      : "notification_request";
    const latestNotificationUpdateKey =
      "latest_update_for_" + notification_request_name;
    const latestNotificationUpdateTimestamp =
      (await Get(latestNotificationUpdateKey)) || 0;
    const latestCompletePlayersKey =
      "update_complete_players_for_" + block_name;
    const latestCompletePlayersTimestamp =
      (await Get(latestCompletePlayersKey)) || 0;
    if (event_id > 5) {
      if (
        cachedData &&
        latestNotificationUpdateTimestamp < cachedData.timestamp &&
        latestCompletePlayersTimestamp < cachedData.timestamp
      ) {
        console.log("using cache");
        return res.json(cachedData.data);
      }
      console.log("get new data");
      const data = await GetDantaiFromDB(
        req,
        res,
        event_id,
        is_test,
        notification_request_name,
      );
      await Set(cacheKey, { data: data, timestamp: Date.now() });
      return res.json(data);
    }
    const event_name = (is_test ? "test_" : "") + GetEventName(event_id);
    const players_name = is_test ? "test_players" : "players";
    const latestResultUpdateKey =
      "latest_update_result_for_" + event_name + "_timestamp";
    const latestResultUpdateTimestamp = (await Get(latestResultUpdateKey)) || 0;
    if (
      cachedData &&
      latestResultUpdateTimestamp < cachedData.timestamp &&
      latestNotificationUpdateTimestamp < cachedData.timestamp &&
      latestCompletePlayersTimestamp < cachedData.timestamp
    ) {
      console.log("using cache");
      return res.json(cachedData.data);
    }
    console.log("get new data");
    const data = await GetFromDB(
      req,
      res,
      event_name,
      players_name,
      notification_request_name,
    );
    await Set(cacheKey, { data: data, timestamp: Date.now() });
    return res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};
