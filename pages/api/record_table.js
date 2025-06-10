import GetClient from "../../lib/db_client";
import { Set } from "../../lib/redis_client";

const RecordTable = async (req, res) => {
  try {
    const client = await GetClient();
    const event_name = req.body.event_name;
    let query = "update " + event_name + " set ";
    let initial_value_is_set = false;
    if (req.body.main_score || req.body.retire) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "main_score=" +
        req.body.main_score;
      initial_value_is_set = true;
    }
    if (req.body.sub1_score || req.body.retire) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "sub1_score=" +
        req.body.sub1_score;
      initial_value_is_set = true;
    }
    if (req.body.sub2_score || req.body.retire) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "sub2_score=" +
        req.body.sub2_score;
      initial_value_is_set = true;
    }
    if (
      event_name.includes("tenkai") &&
      (req.body.sub3_score || req.body.retire)
    ) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "sub3_score=" +
        req.body.sub3_score;
      initial_value_is_set = true;
    }
    if (
      event_name.includes("tenkai") &&
      (req.body.sub4_score || req.body.retire)
    ) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "sub4_score=" +
        req.body.sub4_score;
      initial_value_is_set = true;
    }
    if (
      event_name.includes("tenkai") &&
      (req.body.sub5_score || req.body.retire)
    ) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "sub5_score=" +
        req.body.sub5_score;
      initial_value_is_set = true;
    }
    if (
      event_name.includes("tenkai") &&
      (req.body.elapsed_time || req.body.retire)
    ) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "elapsed_time=" +
        req.body.elapsed_time;
      initial_value_is_set = true;
    }
    if (req.body.retire) {
      query += ",retire=1";
    } else {
      query += (initial_value_is_set ? "," : " ") + "retire=0";
      initial_value_is_set = true;
    }
    if (req.body.penalty !== undefined) {
      query +=
        (initial_value_is_set ? "," : " ") + "penalty=" + req.body.penalty;
      initial_value_is_set = true;
    }
    query += " where id = $1";
    let result = await client.query(query, [req.body.id]);
    const key = "latest_update_result_for_" + event_name + "_timestamp";
    const timestamp = Date.now();
    await Set(key, timestamp);
    // update current block if necessary
    if (req.body.update_block === undefined || req.body.update_block === null) {
      res.json({});
      return;
    }
    const current_block_name = "current_block_" + req.body.update_block;
    query = "select id, game_id from " + current_block_name;
    result = await client.query(query);
    const next_game_id = result.rows[0].game_id + 1;
    const schedule_id = result.rows[0].id;
    query =
      "select id from block_" +
      req.body.update_block +
      "_games where order_id = " +
      next_game_id +
      " and schedule_id = " +
      schedule_id;
    result = await client.query(query);
    console.log(result.rows);
    const update_game_id_key = "update_game_id_for_" + current_block_name;
    await Set(update_game_id_key, timestamp);
    if (result.rows.length === 0) {
      query = "update " + current_block_name + " set id = id + 1, game_id = 1";
      result = await client.query(query);
      const update_id_key = "update_id_for_" + current_block_name;
      await Set(update_id_key, timestamp);
    } else {
      query = "update " + current_block_name + " set game_id = " + next_game_id;
      result = await client.query(query);
    }
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default RecordTable;
