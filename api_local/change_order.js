import conn from '../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        const block_name = 'block_' + req.body.update_block;
        let query = 'update ' + block_name + '_games t1 set order_id = t2.order_id from ' + block_name + '_games t2 where t1.order_id in ($1,$2) and t2.order_id in ($2,$1) and t1.order_id <> t2.order_id';
        let values = [req.body.target_order_id, req.body.target_order_id+1];
        const result = await conn.query(query, values);
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
