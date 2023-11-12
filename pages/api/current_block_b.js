import conn from '../../lib/db'

export default async (req, res) => {
    try {
        let query = 'SELECT id from current_block_b';
        let result = await conn.query(query);
        query = 'SELECT hokei_man_id from block_b where id = $1';
        let values = [result.rows[0].id];
        result = await conn.query(query, values);
        const current_id = result.rows[0].hokei_man_id;
        query = `SELECT t1.id, t1.left_player_id, t1.right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name FROM hokei_man AS t1 LEFT JOIN players AS t2 ON t1.left_player_id = t2.hokei_man_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.hokei_man_player_id`;
        const result_schedule = await conn.query(query);
        const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
        // set round 0, 1,...until (without final and before final)
        let round_num = {};
        for (let i = 0; i < sorted_data.length - 2; i++) {
            if (!('round' in sorted_data[i])) {
                sorted_data[i]['round'] = 1;
            }
            const next_left_id = sorted_data[i]['next_left_id'];
            if (next_left_id !== null && sorted_data[parseInt(next_left_id)-1] !== undefined) {
                sorted_data[parseInt(next_left_id)-1]['round'] = sorted_data[i]['round'] + 1;
            }
            const next_right_id = sorted_data[i]['next_right_id'];
            if (next_right_id !== null && sorted_data[parseInt(next_right_id)-1] !== undefined) {
                sorted_data[parseInt(next_right_id)-1]['round'] = sorted_data[i]['round'] + 1;
            }
            if (round_num[sorted_data[i]['round']] === undefined) {
                round_num[sorted_data[i]['round']] = 1;
            } else {
                round_num[sorted_data[i]['round']] += 1;
            }
        }
        // select item
        for (let i = 0; i < sorted_data.length; i++) {
            if (sorted_data[i]['id'] === current_id) {
                if ('round' in sorted_data[i]) {
                    const round = sorted_data[i]['round'];
                    let game_id = sorted_data[i]['id'];
                    for (let j = 0; j < round - 1; j++) {
                        game_id -= round_num[j+1];
                    }
                    if (game_id <= round_num[round] / 2) {
                        //sorted_data[i]['block_pos'] = 'left';
                        sorted_data[i]['left_color'] = 'red';
                    } else {
                        //sorted_data[i]['block_pos'] = 'right';
                        sorted_data[i]['left_color'] = 'white';
                    }
                } else {
                    sorted_data[i]['block_pos'] = 'center';
                }
                console.log(sorted_data[i]);
                res.json(sorted_data[i]);
                return;
            }
        }
        //console.log(result_schedule.rows);
        res.status(500).json({ error: 'Error fetching data'});
        //let result_json = result.rows[0];
        //res.json(result.rows[0]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
