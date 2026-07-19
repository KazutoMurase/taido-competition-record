import GetClient from "../../lib/db_client";
import { TouchCacheVersion } from "../../lib/versioned_cache";

const CompleteSchedule = async (req, res) => {
  try {
    const client = await GetClient();
    const next_id = req.body.id + 1;
    const current_block_name = "current_block_" + req.body.update_block;
    const query =
      "update " + current_block_name + " set id = " + next_id + ", game_id = 1";
    const result = await client.query(query);
    const update_game_id_key = "update_game_id_for_" + current_block_name;
    const update_id_key = "update_id_for_" + current_block_name;
    await Promise.all([
      TouchCacheVersion(update_game_id_key),
      TouchCacheVersion(update_id_key),
    ]);
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default CompleteSchedule;
