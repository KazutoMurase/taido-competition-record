import GetClient from "../../lib/db_client";
import { GetVersionedCache } from "../../lib/versioned_cache";

async function GetFromDB(req, res) {
  const client = await GetClient();
  const block_number = req.query.block_number;
  let query = "select id, game_id from current_block_" + block_number;
  let result = await client.query(query);
  return result.rows[0];
}

const CurrentSchedule = async (req, res) => {
  try {
    const block_name = "block_" + req.query.block_number;
    const current_block_name = "current_" + block_name;
    const latest_update_id_key = "update_id_for_" + current_block_name;
    const latest_game_id_update_key =
      "update_game_id_for_" + current_block_name;
    const cache_key = "current_schedule_for_" + block_name;
    const data = await GetVersionedCache(
      cache_key,
      [latest_update_id_key, latest_game_id_update_key],
      () => GetFromDB(req, res),
    );
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default CurrentSchedule;
