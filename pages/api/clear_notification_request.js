import { db } from '@vercel/postgres';
import { kv } from "@vercel/kv";

export default async (req, res) => {
    try {
        const client = await db.connect();
        if (req.body.player_id !== undefined) {
            const query = `DELETE FROM notification_request WHERE player_id = $1`
            const values = [req.body.player_id]
            const result = await client.query(query, values);
            console.log(result);
        }
        else if (req.body.group_id !== undefined) {
            const query = `DELETE FROM notification_request WHERE group_id = $1 and event_id = $2`
            const values = [req.body.group_id, req.body.event_id]
            const result = await client.query(query, values);
            console.log(result);
        } else {
            const query = `DELETE FROM notification_request WHERE 1 = 1`
            const result = await client.query(query);
            console.log(result);
        }
        const key = 'latest_update_for_notification_request';
        kv.set(key, Date.now());
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
