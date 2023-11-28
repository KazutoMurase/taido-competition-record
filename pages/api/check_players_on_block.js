import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const block_name = 'block_' + req.query.block_number;
        const schedule_id = req.query.schedule_id;
        let query = 'SELECT event_id FROM ' + block_name + ' WHERE id = $1';
        const block_result = await conn.query(query, [schedule_id]);
        let event_name;
        // TODO: set from database
        if (block_result.rows[0].event_id === 1) {
            event_name = 'zissen_man';
        } else if (block_result.rows[0].event_id === 2) {
            event_name = 'hokei_man';
        } else if (block_result.rows[0].event_id === 3) {
            event_name = 'zissen_woman';
        } else if (block_result.rows[0].event_id === 4) {
            event_name = 'hokei_woman';
        } else if (block_result.rows[0].event_id === 5) {
            event_name = 'hokei_sonen';
        } else {
            query = 'SELECT game_id FROM ' + block_name + '_games WHERE schedule_id = ' + schedule_id;
            let result_dantai = await conn.query(query);
            const game_id = result_dantai.rows[0].game_id;
            query = 'SELECT t1.name, t0.group_id, t0.event_id FROM dantai as t0 LEFT JOIN groups AS t1 ON t0.group_id = t1.id WHERE t0.event_id = ' + block_result.rows[0].event_id + ' and game_id = ' + game_id;
            result_dantai = await conn.query(query);
            if (result_dantai.rows.length === 0) {
                query = 'SELECT t1.name, t0.group_id, t0.event_id FROM dantai as t0 LEFT JOIN groups AS t1 ON t0.group_id = t1.id WHERE t0.event_id = ' + block_result.rows[0].event_id;
                result_dantai = await conn.query(query);
                for (let i = 0; i < result_dantai.rows.length; i++) {
                    result_dantai.rows[i]['all'] = true;
                }
            }
            query = `SELECT group_id, event_id FROM notification_request WHERE group_id is not null`;
            const result_requested = await conn.query(query);
            const requested_data = result_requested.rows;
            for (let i = 0; i < result_dantai.rows.length; i++) {
                for (let j = 0; j < requested_data.length; j++) {
                    if (result_dantai.rows[i].group_id === requested_data[j].group_id &&
                        result_dantai.rows[i].event_id === requested_data[j].event_id) {
                        result_dantai.rows[i]['requested'] = true;
                        break;
                    }
                }
            }
            res.json(result_dantai.rows);
            return;
        }
        query = 'SELECT t1.id, t2.id AS left_player_id, t3.id AS right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name, t2.name_kana AS left_name_kana, t3.name_kana AS right_name_kana FROM ' + block_name + '_games AS t0 LEFT JOIN ' + event_name + ' AS t1 ON t0.game_id = t1.id LEFT JOIN players AS t2 ON t1.left_player_id = t2.' + event_name + '_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.' + event_name + '_player_id where t0.schedule_id = $1';
        const result = await conn.query(query, [schedule_id]);
        const data = result.rows;
        console.log(result.rows);

        query = 'SELECT t1.id, t1.next_left_id, t1.next_right_id, t1.left_retire, t1.right_retire FROM ' + event_name + ' AS t1';
        const result_schedule = await conn.query(query);
        const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
        // set round 0, 1,...until (without final and before final)
        let round_num = {};
        for (let i = 0; i < sorted_data.length; i++) {
            if (i == sorted_data.length - 2) {
                sorted_data[i]['fake_round'] = sorted_data[i-1]['round'] + 1;
            } else if (!('round' in sorted_data[i])) {
                if (i === 0 || sorted_data[i-1]['round'] === 1) {
                    sorted_data[i]['round'] = 1;
                } else {
                    sorted_data[i]['round'] = 2;
                }
            }
            const next_left_id = sorted_data[i]['next_left_id'];
            if (next_left_id !== null && sorted_data[parseInt(next_left_id)-1] !== undefined) {
                sorted_data[parseInt(next_left_id)-1]['has_left'] = true;
                let update_round = sorted_data[i]['round'] + 1;
                if ('round' in sorted_data[parseInt(next_left_id)-1] &&
                    sorted_data[parseInt(next_left_id)-1]['round'] !== update_round) {
                    if (sorted_data[parseInt(next_left_id)-1]['round'] < update_round) {
                        if ('prev_left_id' in sorted_data[parseInt(next_left_id)-1]) {
                            sorted_data[sorted_data[parseInt(next_left_id)-1]['prev_left_id']]['round'] = update_round - 1;
                        } else if ('prev_right_id' in sorted_data[parseInt(next_left_id)-1]) {
                            sorted_data[sorted_data[parseInt(next_left_id)-1]['prev_right_id']]['round'] = update_round - 1;
                        }
                    } else {
                        update_round = sorted_data[parseInt(next_left_id)-1]['round'];
                        if ('prev_left_id' in sorted_data[parseInt(next_left_id)-1]) {
                            sorted_data[i]['round'] = update_round - 1;
                        } else if ('prev_right_id' in sorted_data[parseInt(next_left_id)-1]) {
                            sorted_data[i]['round'] = update_round - 1;
                        }
                    }
                }
                sorted_data[parseInt(next_left_id)-1]['round'] = update_round;
                sorted_data[parseInt(next_left_id)-1]['prev_left_id'] = i;
            }
            const next_right_id = sorted_data[i]['next_right_id'];
            if (next_right_id !== null && sorted_data[parseInt(next_right_id)-1] !== undefined) {
                sorted_data[parseInt(next_right_id)-1]['has_right'] = true;
                let update_round = sorted_data[i]['round'] + 1;
                if ('round' in sorted_data[parseInt(next_right_id)-1] &&
                    sorted_data[parseInt(next_right_id)-1]['round'] !== update_round) {
                    if (sorted_data[parseInt(next_right_id)-1]['round'] < update_round) {
                        if ('prev_left_id' in sorted_data[parseInt(next_right_id)-1]) {
                            sorted_data[sorted_data[parseInt(next_right_id)-1]['prev_left_id']]['round'] = update_round - 1;
                        } else if ('prev_right_id' in sorted_data[parseInt(next_right_id)-1]) {
                            sorted_data[sorted_data[parseInt(next_right_id)-1]['prev_right_id']]['round'] = update_round - 1;
                        }
                    } else {
                        update_round = sorted_data[parseInt(next_right_id)-1]['round'];
                        if ('prev_left_id' in sorted_data[parseInt(next_right_id)-1]) {
                            sorted_data[i]['round'] = update_round - 1;
                        } else if ('prev_right_id' in sorted_data[parseInt(next_right_id)-1]) {
                            sorted_data[i]['round'] = update_round - 1;
                        }
                    }
                }
                sorted_data[parseInt(next_right_id)-1]['round'] = update_round;
                sorted_data[parseInt(next_right_id)-1]['prev_right_id'] = i;
            }
        }
        for (let i = 0; i < sorted_data.length; i++) {
            if (round_num[sorted_data[i]['round']] === undefined) {
                round_num[sorted_data[i]['round']] = 1;
            } else {
                round_num[sorted_data[i]['round']] += 1;
            }
        }
        query = `SELECT player_id FROM notification_request`;
        const result_requested = await conn.query(query);
        const requested_data = result_requested.rows;
        // select item
        let result_array = [];
        for (let i = 0; i < data.length; i++) {
            for (let j = 0; j < sorted_data.length; j++) {
                if ('round' in sorted_data[j] &&
                   data[i].id === sorted_data[j].id) {
                    const round = sorted_data[j]['round'];
                    let game_id = sorted_data[j]['id'];
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
                                               'game_id': sorted_data[j].id,
                                               'is_left': true,
                                               'retire': sorted_data[j].left_retire,
                                               'event_id': block_result.rows[0].event_id,
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
                                               'game_id': sorted_data[j].id,
                                               'is_left': false,
                                               'retire': sorted_data[j].right_retire,
                                               'event_id': block_result.rows[0].event_id,
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
