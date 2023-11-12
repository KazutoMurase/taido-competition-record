import conn from '../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        if (req.body.player_id === undefined) {
            const query = `DELETE FROM notification_request WHERE 1 = 1`
            const result = await conn.query(query);
            console.log(result);
            res.status(200).end();
        } else {
            const query = `DELETE FROM notification_request WHERE player_id = $1`
            const values = [req.body.player_id]
            const result = await conn.query(query, values);
            console.log(result);
            res.status(200).end();
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
