import conn from '../../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        let result;
        if (req.body.update_block === 'a') {
            let query = 'update current_block_a set id = id - 1';
            result = await conn.query(query);
        } else if (req.body.update_block === 'b') {
            let query = 'update current_block_b set id = id - 1';
            result = await conn.query(query);
        } else {
            let query = 'update current_hokei_man set id = $1';
            let values = [req.body.id];
            result = await conn.query(query, values);
        }
        console.log(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
