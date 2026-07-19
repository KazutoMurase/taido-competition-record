import GetClient from "../../lib/db_client";
import {
  AdvanceCurrentPosition,
  CurrentGameConflictError,
  LockCurrentPosition,
} from "../../lib/current_position";
import { MarkResultUpdated } from "../../lib/result_cache";
import { TouchCacheVersion } from "../../lib/versioned_cache";

const Record = async (req, res) => {
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
    const type = event_name.includes("dantai") ? "group" : "player";
    let query =
      "update " + event_name + " set left_" + type + "_flag = $2 where id = $1";
    let values = [
      game_id,
      type === "group" ? req.body.left_group_flag : req.body.left_player_flag,
    ];
    await client.query(query, values);
    const count_query = "select count(*) from " + event_name;
    const count_result = await client.query(count_query);
    const count = count_result.rows[0]["count"];
    if (req.body.next_type === "left") {
      query =
        "update " + event_name + " set left_" + type + "_id = $1 where id = $2";
      values = [
        type === "group" ? req.body.next_group_id : req.body.next_player_id,
        req.body.next_id,
      ];
      await client.query(query, values);
      if (parseInt(req.body.next_id) === parseInt(count)) {
        values = [req.body.loser_id, req.body.next_id - 1];
        await client.query(query, values);
      }
    } else {
      query =
        "update " +
        event_name +
        " set right_" +
        type +
        "_id = $1 where id = $2";
      values = [
        type === "group" ? req.body.next_group_id : req.body.next_player_id,
        req.body.next_id,
      ];
      await client.query(query, values);
      if (parseInt(req.body.next_id) === parseInt(count)) {
        values = [req.body.loser_id, req.body.next_id - 1];
        await client.query(query, values);
      }
    }

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

export default Record;
