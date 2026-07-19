import GetClient from "../../lib/db_client";
import {
  AdvanceCurrentPosition,
  CurrentGameConflictError,
  LockCurrentPosition,
} from "../../lib/current_position";
import { MarkResultUpdated } from "../../lib/result_cache";
import { TouchCacheVersion } from "../../lib/versioned_cache";

const RecordTable = async (req, res) => {
  let client;
  let transactionOpen = false;
  try {
    const event_name = req.body.event_name;
    const game_id = Number(req.body.id);
    const block = req.body.update_block;
    if (
      !Number.isInteger(game_id) ||
      game_id < 1 ||
      typeof event_name !== "string" ||
      !/^[a-z0-9_]+$/.test(event_name) ||
      (block != null && (typeof block !== "string" || !/^[a-z]$/.test(block)))
    ) {
      res.status(400).json({ error: "Invalid request" });
      return;
    }

    const pool = GetClient();
    client = await pool.connect();
    await client.query("BEGIN");
    transactionOpen = true;

    const position =
      block == null
        ? null
        : await LockCurrentPosition(client, block, event_name, game_id);
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
    if (
      req.body.start_penalty !== undefined &&
      req.body.start_penalty !== null
    ) {
      query +=
        (initial_value_is_set ? "," : " ") +
        "start_penalty=" +
        req.body.start_penalty;
      initial_value_is_set = true;
    }
    query += " where id = $1";
    await client.query(query, [game_id]);

    const scheduleChanged = position
      ? await AdvanceCurrentPosition(client, block, position)
      : false;
    await client.query("COMMIT");
    transactionOpen = false;

    const cacheUpdates = [MarkResultUpdated(event_name)];
    if (position) {
      const currentBlockName = `current_block_${block}`;
      cacheUpdates.push(
        TouchCacheVersion(`update_game_id_for_${currentBlockName}`),
      );
      if (scheduleChanged) {
        cacheUpdates.push(
          TouchCacheVersion(`update_id_for_${currentBlockName}`),
        );
      }
    }
    await Promise.all(cacheUpdates);
    res.json({});
  } catch (error) {
    if (transactionOpen && client) {
      await client.query("ROLLBACK");
    }
    if (error instanceof CurrentGameConflictError) {
      res.status(409).json({ error: error.message });
      return;
    }
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

export default RecordTable;
