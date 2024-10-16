import GetClient from "../../lib/db_client";
import { Set } from "../../lib/redis_client";

const UpdateCurrentSchedule = async (req, res) => {
  try {
    const client = await GetClient();
    const current_block_name = "current_block_" + req.query.block;
    const schedule_id = parseInt(req.query.schedule_id);
    const query = "update " + current_block_name + " set id = $1, game_id = 1";
    const values = [schedule_id];
    const result = await client.query(query, values);
    const timestamp = Date.now();
    const update_id_key = "update_id_for_" + current_block_name;
    await Set(update_id_key, timestamp);
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default UpdateCurrentSchedule;
