import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const block_name = 'block_' + req.body.block_number;
        const schedule_id = req.body.schedule_id;
        let query = 'update ' + block_name + ' set players_checked = 1 where id = ' + schedule_id;
        let result = await conn.query(query);
        query = 'select event_id from ' + block_name + ' where id = ' + schedule_id;
        result = await conn.query(query);
        let game_type_name;
        // TODO: set from database
        if (result.rows[0].event_id === 1) {
            game_type_name = 'zissen_man';
        } else if (result.rows[0].event_id === 2) {
            game_type_name = 'hokei_man';
        } else if (result.rows[0].event_id === 3) {
            game_type_name = 'zissen_woman';
        } else if (result.rows[0].event_id === 4) {
            game_type_name = 'hokei_woman';
        } else if (result.rows[0].event_id === 5) {
            game_type_name = 'hokei_sonen';
        }
        for (let i = 0; i < req.body.left_retire_array.length; i++) {
            let item = req.body.left_retire_array[i];
            query = 'update ' + game_type_name + ' set left_retire = ' + (item.is_retired ? 1 : 0) + ' where id = ' + item.id;
            result = await conn.query(query);
        }
        for (let i = 0; i < req.body.right_retire_array.length; i++) {
            let item = req.body.right_retire_array[i];
            query = 'update ' + game_type_name + ' set right_retire = ' + (item.is_retired ? 1 : 0) + ' where id = ' + item.id;
            result = await conn.query(query);
        }
        res.json({});
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
