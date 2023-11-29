import conn from '../../lib/db'

export default async (req, res) => {
    try {
        let query = `SELECT t2.id, t3.name AS event_name, t2.name, t2.name_kana, t4.name AS court_name, t5.name AS group_name FROM notification_request AS t1 LEFT JOIN players AS t2 ON t1.player_id = t2.id LEFT JOIN event_type AS t3 ON t1.event_id = t3.id LEFT JOIN court_type AS t4 ON t1.court_id = t4.id LEFT JOIN groups AS t5 ON t2.group_id = t5.id WHERE t1.player_id is not null`;
        const result = await conn.query(query);
        query = `SELECT t1.event_id, t1.group_id, t3.name AS event_name, t4.name AS court_name, t5.name AS group_name FROM notification_request AS t1 LEFT JOIN event_type AS t3 ON t1.event_id = t3.id LEFT JOIN court_type AS t4 ON t1.court_id = t4.id LEFT JOIN groups AS t5 ON t1.group_id = t5.id WHERE t1.group_id is not null`;
        const result_group = await conn.query(query);
        res.json([...result.rows, ...result_group.rows]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
