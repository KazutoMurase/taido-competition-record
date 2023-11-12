import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const query = `SELECT t2.id, t3.name AS event_name, t2.name, t2.name_kana, t4.name AS court_name FROM notification_request AS t1 LEFT JOIN players AS t2 ON t1.player_id = t2.id LEFT JOIN event_type AS t3 ON t1.event_id = t3.id LEFT JOIN court_type AS t4 ON t1.court_id = t4.id`;
        const result = await conn.query(query);
        //console.log(result.rows);
        res.json(result.rows);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
