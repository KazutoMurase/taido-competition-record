import GetClient from "../../lib/db_client";
import { SingleFlight } from "../../lib/single_flight";
import { GetVersionedCache } from "../../lib/versioned_cache";

async function GetFromDB(blockNumber) {
  const client = await GetClient();
  let query = "select id, game_id from current_block_" + blockNumber;
  let result = await client.query(query);
  return result.rows[0];
}

export async function GetCurrentScheduleData(blockNumber) {
  const blockName = "block_" + blockNumber;
  const currentBlockName = "current_" + blockName;
  const latestUpdateIdKey = "update_id_for_" + currentBlockName;
  const latestGameIdUpdateKey = "update_game_id_for_" + currentBlockName;
  const cacheKey = "current_schedule_for_" + blockName;
  return SingleFlight(cacheKey, () =>
    GetVersionedCache(
      cacheKey,
      [latestUpdateIdKey, latestGameIdUpdateKey],
      () => GetFromDB(blockNumber),
    ),
  );
}

const CurrentSchedule = async (req, res) => {
  try {
    const data = await GetCurrentScheduleData(req.query.block_number);
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default CurrentSchedule;
