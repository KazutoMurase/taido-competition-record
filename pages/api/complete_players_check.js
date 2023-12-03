import { db } from '@vercel/postgres';
import { kv } from "@vercel/kv";
import { GetEventName } from '../../lib/get_event_name';

export default async (req, res) => {
    try {
        const client = await db.connect();
        const block_name = 'block_' + req.body.block_number;
        const schedule_id = req.body.schedule_id;
        const is_test = req.body.is_test;
        let query = 'update ' + block_name + ' set players_checked = 1 where id = ' + schedule_id;
        let result = await client.query(query);
        query = 'select event_id from ' + block_name + ' where id = ' + schedule_id;
        result = await client.query(query);
        const event_name = (is_test ? "test_" : "") + GetEventName(result.rows[0].event_id);
        if ('left_retire_array' in req.body){
            for (let i = 0; i < req.body.left_retire_array.length; i++) {
                let item = req.body.left_retire_array[i];
                query = 'update ' + event_name + ' set left_retire = ' + (item.is_retired ? 1 : 0) + ' where id = ' + item.id;
                result = await client.query(query);
            }
        }
        if ('right_retire_array' in req.body) {
            for (let i = 0; i < req.body.right_retire_array.length; i++) {
                let item = req.body.right_retire_array[i];
                query = 'update ' + event_name + ' set right_retire = ' + (item.is_retired ? 1 : 0) + ' where id = ' + item.id;
                result = await client.query(query);
            }
        }
        const key = 'update_complete_players_for_block_' + req.body.block_number;
        const timestamp = Date.now();
        await kv.set(key, timestamp);
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
