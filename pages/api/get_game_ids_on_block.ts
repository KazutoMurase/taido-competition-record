// あるブロックの、試合のリストを返す
import { NextApiRequest, NextApiResponse } from "next";
import GetClient from "../../lib/db_client";
import { GetVersionedCache } from "../../lib/versioned_cache";

export interface GameIdsData {
  id: number;
  schedule_id: number;
  order_id: number;
  game_id: number;
}

interface GetGameIdsOnBlockRequest extends NextApiRequest {
  query: {
    block_number: string;
  };
}

const GetFromDB = async (
  req: GetGameIdsOnBlockRequest,
): Promise<GameIdsData[]> => {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const query =
    "select id, schedule_id, order_id, game_id FROM " + block_name + "_games";
  const result = await client.query(query);
  return result.rows.sort((a, b) => a.id - b.id);
};

const GetGameIdsOnBlock = async (
  req: GetGameIdsOnBlockRequest,
  res: NextApiResponse,
) => {
  try {
    const block_name = "block_" + req.query.block_number;
    const cache_key = "get_game_ids_on_" + block_name;
    const change_event_order_cache_key = "change_event_order_for_" + block_name;
    const data = await GetVersionedCache(
      cache_key,
      [change_event_order_cache_key],
      () => GetFromDB(req),
      Boolean,
    );
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetGameIdsOnBlock;
