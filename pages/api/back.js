import { db } from '@vercel/postgres';
import { kv } from "@vercel/kv";

export default async (req, res) => {
    try {
        const client = await db.connect();
        const current_block_name = 'current_block_' + req.body.update_block
        let query = 'select game_id from ' + current_block_name;
        let result = await client.query(query);
        if (result.rows[0].game_id > 1) {
            query = 'update ' + current_block_name + ' set game_id = game_id - 1';
            result = await client.query(query);
            const key = 'update_game_id_for_' + current_block_name;
            const timestamp = Date.now();
            await kv.set(key, timestamp);
        }
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
