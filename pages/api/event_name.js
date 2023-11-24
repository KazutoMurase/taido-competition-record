import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const block_number = req.query.block_number;
        let query;
        if (req.query.schedule_id !== undefined &&
            req.query.schedule_id !== null) {
            query = 'SELECT event_id FROM block_' + block_number + ' WHERE id = ' + req.query.schedule_id;
        } else {
            query = 'SELECT t1.event_id FROM current_block_' + block_number + ' AS t0 LEFT JOIN block_' + block_number + ' AS t1 ON t0.id = t1.id';
        }
        const result = await conn.query(query);
        const event_id = result.rows[0].event_id;
        if (event_id === 1) {
            res.json(['zissen_man']);
        } else if (event_id === 2) {
            res.json(['hokei_man']);
        } else if (event_id === 3) {
            res.json(['zissen_woman']);
        } else if (event_id === 4) {
            res.json(['hokei_woman']);
        } else if (event_id === 5) {
            res.json(['hokei_sonen']);
        }
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
