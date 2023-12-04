import { kv } from "@vercel/kv";
import GetClient from '../../lib/db_client';

export default async (req, res) => {
    try {
        const client = await GetClient();
        const notification_request_name = (req.body.is_test === true) ? 'test_notification_request' : 'notification_request';
        if (req.body.player_id !== undefined) {
            const query = 'DELETE FROM ' + notification_request_name + ' WHERE player_id = $1';
            const values = [req.body.player_id]
            const result = await client.query(query, values);
            console.log(result);
        }
        else if (req.body.group_id !== undefined) {
            const query = 'DELETE FROM ' + notification_request_name + ' WHERE group_id = $1 and event_id = $2';
            const values = [req.body.group_id, req.body.event_id]
            const result = await client.query(query, values);
            console.log(result);
        } else {
            const query = 'DELETE FROM ' + notification_request_name + ' WHERE 1 = 1'
            const result = await client.query(query);
            console.log(result);
        }
        const key = 'latest_update_for_' + notification_request_name;
        kv.set(key, Date.now());
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
