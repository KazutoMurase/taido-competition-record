import conn from '../../lib/db'

export default async (req, res) => {
    try {
        let query = `SELECT t1.id, t1.next_left_id, t1.next_right_id FROM hokei_man AS t1`;
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
        console.log(sorted_data);
        //query = `SELECT t1.id, t1.left_player_id, t1.right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name, t2.name_kana AS left_name_kana, t3.name_kana AS right_name_kana FROM block_a AS t0 LEFT JOIN hokei_man AS t1 ON t0.hokei_man_id = t1.id  LEFT JOIN players AS t2 ON t1.left_player_id = t2.hokei_man_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.hokei_man_player_id`;
        query = `SELECT t1.id, t2.id AS left_player_id, t3.id AS right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name, t2.name_kana AS left_name_kana, t3.name_kana AS right_name_kana FROM block_a AS t0 LEFT JOIN hokei_man AS t1 ON t0.hokei_man_id = t1.id  LEFT JOIN players AS t2 ON t1.left_player_id = t2.hokei_man_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.hokei_man_player_id`;
        const result = await conn.query(query);
        const data = result.rows;
        console.log(result.rows);
        query = `SELECT player_id FROM notification_request`;
        const result_requested = await conn.query(query);
        const requested_data = result_requested.rows;
        // select item
        let result_array = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < sorted_data.length; j++) {
                if ('round' in sorted_data[j] &&
                   data[i].id === sorted_data[j].id) {
                    const round = sorted_data[i]['round'];
                    let game_id = sorted_data[i]['id'];
                    for (let k = 0; k < round - 1; k++) {
                        game_id -= round_num[k+1];
                    }
                    const block_pos = (game_id <= round_num[round] / 2 ? 'left' : 'right');
                    if (data[i].left_player_id !== null) {
                        let duplicated = false;
                        for (let k = 0; k < result_array.length; k++) {
                            if (result_array[k]['id'] == data[i].left_player_id) {
                                duplicated = true;
                                break;
                            }
                        }
                        if (!duplicated) {
                            let requested = false;
                            for (let k = 0; k < requested_data.length; k++) {
                                if (requested_data[k]['player_id'] === data[i].left_player_id) {
                                    requested = true;
                                    break;
                                }
                            }
                            result_array.push({'id': data[i].left_player_id,
                                               'name': data[i].left_name,
                                               'name_kana': data[i].left_name_kana,
                                               'requested': requested,
                                               'color': (block_pos === 'left' ? 'red' : 'white')});
                        }
                    }
                    if (data[i].right_player_id !== null) {
                        let duplicated = false;
                        for (let k = 0; k < result_array.length; k++) {
                            if (result_array[k]['id'] == data[i].right_player_id) {
                                duplicated = true;
                                break;
                            }
                        }
                        if (!duplicated) {
                            let requested = false;
                            for (let k = 0; k < requested_data.length; k++) {
                                if (requested_data[k]['player_id'] === data[i].right_player_id) {
                                    requested = true;
                                    break;
                                }
                            }
                            result_array.push({'id': data[i].right_player_id,
                                               'name': data[i].right_name,
                                               'name_kana': data[i].right_name_kana,
                                               'requested': requested,
                                               'color': (block_pos === 'left' ? 'white' : 'red')});
                        }
                    }
                }
            }
        }
        console.log(result_array);
        res.json(result_array);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
