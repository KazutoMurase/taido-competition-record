import conn from '../../../lib/db'

export default async (req, res) => {
    try {
        let query = 'SELECT id from current_hokei_man';
        let result = await conn.query(query);
        const current_id = result.rows[0].id;
        query = `SELECT t1.id, t1.left_player_id, t1.right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name FROM hokei_man AS t1 LEFT JOIN players AS t2 ON t1.left_player_id = t2.hokei_man_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.hokei_man_player_id where t1.id = ${current_id}`;
        result = await conn.query(query);
        let result_json = result.rows[0];
        console.log(result.rows);
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
