import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const block_name = 'block_' + req.body.block_number;
        const schedule_id = req.body.schedule_id;
        let query = 'update ' + block_name + ' set players_checked = 1 where id = ' + schedule_id;
        const result = await conn.query(query);
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
