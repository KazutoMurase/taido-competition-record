import conn from '../../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        let query = 'update hokei_man set left_player_flag = $2 where id = $1';
        let values = [req.body.id, req.body.left_player_flag];
        let result = await conn.query(query, values);
        console.log(result);
        let count_query = 'select count(*) from hokei_man';
        let count_result = await conn.query(count_query);
        const count = count_result.rows[0]['count'];
        if (req.body.next_type === 'left') {
            query = 'update hokei_man set left_player_id = $1 where id = $2';
            values = [req.body.next_player_id, req.body.next_id];
            result = await conn.query(query, values);
            if (parseInt(req.body.next_id) === parseInt(count)) {
                values = [req.body.loser_id, req.body.next_id - 1];
                result = await conn.query(query, values);
            }
        } else {
            query = 'update hokei_man set right_player_id = $1 where id = $2';
            values = [req.body.next_player_id, req.body.next_id];
            result = await conn.query(query, values);
            if (parseInt(req.body.next_id) === parseInt(count)) {
                values = [req.body.loser_id, req.body.next_id - 1];
                result = await conn.query(query, values);
            }
        }
        if (req.body.update_block === 'a') {
            query = 'update current_block_a set id = id + 1'
            result = await conn.query(query);
        } else if (req.body.update_block === 'b') {
            query = 'update current_block_b set id = id + 1'
            result = await conn.query(query);
        } else {
            //const next_id = req.body.id + 1;
            //query = 'update current_hokei_man set id = $1';
            //result = await conn.query(query, [next_id]);
            res.status(200).end();
        }
        console.log(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
