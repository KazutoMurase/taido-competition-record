import GetClient from "../../lib/db_client";
import { Set } from "../../lib/redis_client";

const ResetResult = async (req, res) => {
  let client;
  try {
    const pool = GetClient();
    client = await pool.connect();
    const eventName = req.body.event_name;
    const id = parseInt(req.body.id);
    if (
      !Number.isInteger(id) ||
      typeof eventName !== "string" ||
      !/^[a-z0-9_]+$/.test(eventName)
    ) {
      res.status(400).json({ error: "invalid request" });
      return;
    }
    if (eventName.includes("dantai_hokei") || eventName.includes("tenkai")) {
      res.status(400).json({ error: "unsupported event" });
      return;
    }

    const isDantai = eventName.includes("dantai");
    const type = isDantai ? "group" : "player";

    await client.query("BEGIN");
    const result = await client.query(
      "select id, next_left_id, next_right_id from " +
        eventName +
        " where id = $1",
      [id],
    );
    if (result.rows.length === 0) {
      res.status(404).json({ error: "game not found" });
      return;
    }

    const game = result.rows[0];
    const flagColumn = "left_" + type + "_flag";
    const playerColumn = type + "_id";
    await client.query(
      "update " + eventName + " set " + flagColumn + " = null where id = $1",
      [id],
    );

    let nextId = game.next_left_id;
    let nextColumn = "left_" + playerColumn;
    if (nextId === null) {
      nextId = game.next_right_id;
      nextColumn = "right_" + playerColumn;
    }

    if (nextId !== null) {
      await client.query(
        "update " + eventName + " set " + nextColumn + " = null where id = $1",
        [nextId],
      );

      const countResult = await client.query(
        "select count(*) from " + eventName,
      );
      const count = parseInt(countResult.rows[0].count);
      if (parseInt(nextId) === count) {
        await client.query(
          "update " +
            eventName +
            " set " +
            nextColumn +
            " = null where id = $1",
          [nextId - 1],
        );
      }
    }

    const key = "latest_update_result_for_" + eventName + "_timestamp";
    await Set(key, Date.now());
    await client.query("COMMIT");
    res.json({});
  } catch (error) {
    if (client) {
      await client.query("ROLLBACK");
    }
    console.log(error);
    res.status(500).json({ error: "Error resetting result" });
  } finally {
    if (client) {
      client.release();
    }
  }
};

export default ResetResult;
