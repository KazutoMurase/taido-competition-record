import conn from '../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        const query = `INSERT INTO notification_request(event_id, player_id, court_id) values ($1, $2, $3)`;
        const values = [req.body.event_id, req.body.player_id, req.body.court_id];
        const result = await conn.query(query, values);
        console.log(result);
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
