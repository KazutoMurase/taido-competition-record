// あるブロックの、試合のリストを返す
import { NextApiRequest, NextApiResponse } from "next";
import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

export interface StaticGameData {
  id: number;
  schedule_id: number;
  order_id: number;
  game_id: number;
}

interface GetStaticGamesOnBlockRequest extends NextApiRequest {
  query: {
    block_number: string;
  };
}

const GetFromDB = async (
  req: GetStaticGamesOnBlockRequest,
): Promise<StaticGameData[]> => {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const query =
    "select id, schedule_id, order_id, game_id FROM " + block_name + "_games";
  const result = await client.query(query);
  return result.rows.sort((a, b) => a.id - b.id);
};

const GetStaticGamesOnBlock = async (
  req: GetStaticGamesOnBlockRequest,
  res: NextApiResponse,
) => {
  try {
    const cacheKey = "get_static_games_on_block_" + req.query.block_number;
    const cachedData = await Get(cacheKey);

    // no update check because the data is static
    if (cachedData) {
      console.log(`using cache for ${cacheKey}`);
      return res.json(cachedData.data);
    }
    const data = await GetFromDB(req);
    if (data) {
      await Set(cacheKey, { data: data, timestamp: Date.now() });
    }
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetStaticGamesOnBlock;
