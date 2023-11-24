import conn from '../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        let query = 'select game_id from ' + block_name;
        let result = await conn.query(query);
        if (result.rows[0].game_id > 1) {
            query = 'update current_block_' + req.body.update_block + ' set game_id = game_id - 1';
            result = await conn.query(query);
            console.log(result);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
