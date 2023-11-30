import { db } from '@vercel/postgres';
import { kv } from "@vercel/kv";

export default async (req, res) => {
    try {
        const client = await db.connect();
        const current_block_name = 'current_block_' + req.body.update_block;
        const query = 'update ' + current_block_name + ' set id = id + 1, game_id = 1';
        const result = await client.query(query);
        const timestamp = Date.now();
        const update_game_id_key = 'update_game_id_for_' + current_block_name;
        const update_id_key = 'update_id_for_' + current_block_name;
        await kv.set(update_game_id_key, timestamp);
        await kv.set(update_id_key, timestamp);
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
