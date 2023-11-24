import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const event_name = req.body.event_name;
        let query = 'update ' + event_name + ' set left_player_flag = $2 where id = $1';
        let values = [req.body.id, req.body.left_player_flag];
        let result = await conn.query(query, values);
        let count_query = 'select count(*) from ' + event_name;
        let count_result = await conn.query(count_query);
        const count = count_result.rows[0]['count'];
        if (req.body.next_type === 'left') {
            query = 'update ' + event_name + ' set left_player_id = $1 where id = $2';
            values = [req.body.next_player_id, req.body.next_id];
            result = await conn.query(query, values);
            if (parseInt(req.body.next_id) === parseInt(count)) {
                values = [req.body.loser_id, req.body.next_id - 1];
                result = await conn.query(query, values);
            }
        } else {
            query = 'update ' + event_name + ' set right_player_id = $1 where id = $2';
            values = [req.body.next_player_id, req.body.next_id];
            result = await conn.query(query, values);
            if (parseInt(req.body.next_id) === parseInt(count)) {
                values = [req.body.loser_id, req.body.next_id - 1];
                result = await conn.query(query, values);
            }
        }
        const block_name = 'current_block_' + req.body.update_block;
        query = 'update ' + block_name + ' set game_id = game_id + 1';
        result = await conn.query(query);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
