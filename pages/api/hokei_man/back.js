import conn from '../../../lib/db'

export default async (req, res) => {
    try {
        console.log("req nom", req.body);
        let query = 'update current_hokei_man set id = $1';
        let values = [req.body.id];
        let result = await conn.query(query, values);
        console.log(result);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
