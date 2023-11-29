import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const query = 'update current_block_' + req.body.update_block + ' set id = id + 1, game_id = 1';
        const result = await conn.query(query);
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
