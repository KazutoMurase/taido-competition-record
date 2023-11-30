import { db } from '@vercel/postgres';
import { kv } from "@vercel/kv";

async function GetFromDB(req, res) {
    const client = await db.connect();
    const block_number = req.query.block_number;
    let query = 'select id, game_id from current_block_' + block_number;
    let result = await client.query(query);
    return result.rows[0];
}

export default async (req, res) => {
    try {
        const block_name = 'block_' + req.query.block_number;
        const current_block_name = 'current_' + block_name;
        const latest_update_id_key = 'update_id_for_' + current_block_name;
        const cache_key = 'current_schedule_for_' + block_name;
        const latest_update_timestamp = await kv.get(latest_update_id_key) || 0;
        const cached_data = await kv.get(cache_key);
        if (cached_data &&
            latest_update_timestamp < cached_data.timestamp) {
            console.log("using cache");
            return res.json(cached_data.data);
        }
        console.log("get new data");
        const data = await GetFromDB(req, res);
        console.log(data);
        await kv.set(cache_key, {data: data, timestamp: Date.now()});
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
