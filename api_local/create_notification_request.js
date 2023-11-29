import conn from '../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        let query, values, result;
        if ('player_id' in req.body) {
            query = `INSERT INTO notification_request(event_id, player_id, court_id) values ($1, $2, $3)`;
            values = [req.body.event_id, req.body.player_id, req.body.court_id];
            result = await conn.query(query, values);
        } else if ('group_id' in req.body) {
            query = `INSERT INTO notification_request(event_id, group_id, court_id) values ($1, $2, $3)`;
            values = [req.body.event_id, req.body.group_id, req.body.court_id];
            result = await conn.query(query, values);
        }
        console.log(result);
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
