import GetClient from "../../lib/db_client";
import { Set } from "../../lib/redis_client";

const UpdateCurrentGameId = async (req, res) => {
  try {
    const client = await GetClient();
    const block = req.query.block;
    const schedule_id = parseInt(req.query.schedule_id);
    const game_id = parseInt(req.query.game_id);
    if (
      !block ||
      !Number.isInteger(schedule_id) ||
      !Number.isInteger(game_id)
    ) {
      res.status(400).json({ error: "invalid query" });
      return;
    }
    const block_name = "block_" + block;
    const current_block_name = "current_" + block_name;
    let query =
      "select order_id from " +
      block_name +
      "_games where schedule_id = $1 and game_id = $2";
    let result = await client.query(query, [schedule_id, game_id]);
    if (result.rows.length === 0) {
      res.status(400).json({ error: "game_id is out of range" });
      return;
    }
    const order_id = result.rows[0].order_id;
    query = "update " + current_block_name + " set id = $1, game_id = $2";
    result = await client.query(query, [schedule_id, order_id]);
    const timestamp = Date.now();
    await Set("update_id_for_" + current_block_name, timestamp);
    await Set("update_game_id_for_" + current_block_name, timestamp);
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default UpdateCurrentGameId;
