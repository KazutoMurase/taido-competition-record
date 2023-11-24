import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const block_number = req.query.block_number;
        let query = 'select id, game_id from current_block_' + block_number;
        let result = await conn.query(query);
        res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
