import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const event_name = req.query.event_name;
        const query = 'SELECT t1.id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t2.name_kana AS left_name_kana, t4.name AS left_group_name, t3.name AS right_name, t3.name_kana AS right_name_kana, t5.name AS right_group_name, t1.left_player_flag FROM ' + event_name + ' AS t1 LEFT JOIN players AS t2 ON t1.left_player_id = t2.' + event_name + '_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.' + event_name + '_player_id LEFT JOIN groups AS t4 ON t2.group_id = t4.id LEFT JOIN groups AS t5 ON t3.group_id = t5.id';
        const result_schedule = await conn.query(query);
        const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
        // set round 0, 1, ...
        let round_num = {};
        for (let i = 0; i < sorted_data.length; i++) {
            // TODO: fix round 1 or 2 when next_round is different for round 3?
            let set_position_y_by_next = false;
            if (i == sorted_data.length - 2) {
                sorted_data[i]['fake_round'] = sorted_data[i-1]['round'] + 1;
            } else if (!('round' in sorted_data[i])) {
                if (i === 0 || sorted_data[i-1]['round'] === 1) {
                    sorted_data[i]['round'] = 1;
                } else {
                    sorted_data[i]['round'] = 2;
                    set_position_y_by_next = true;
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
                            sorted_data[parseInt(next_left_id)-1]['set_prev_left_position_y'] = true;
                        } else if ('prev_right_id' in sorted_data[parseInt(next_left_id)-1]) {
                            sorted_data[sorted_data[parseInt(next_left_id)-1]['prev_right_id']]['round'] = update_round - 1;
                            sorted_data[parseInt(next_left_id)-1]['set_prev_right_position_y'] = true;
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
                if (set_position_y_by_next) {
                    sorted_data[parseInt(next_left_id)-1]['set_prev_left_position_y'] = true;
                }
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
                            sorted_data[parseInt(next_right_id)-1]['set_prev_left_position_y'] = true;
                        } else if ('prev_right_id' in sorted_data[parseInt(next_right_id)-1]) {
                            sorted_data[sorted_data[parseInt(next_right_id)-1]['prev_right_id']]['round'] = update_round - 1;
                            sorted_data[parseInt(next_right_id)-1]['set_prev_right_position_y'] = true;
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
                if (set_position_y_by_next) {
                    sorted_data[parseInt(next_right_id)-1]['set_prev_right_position_y'] = true;
                }
            }
            if (round_num[sorted_data[i]['round']] === undefined) {
                round_num[sorted_data[i]['round']] = 1;
            } else {
                round_num[sorted_data[i]['round']] += 1;
            }
        }
        // set left or right block and vertical order
        let left_block_indices = [];
        let right_block_indices = [];
        for (let i = 0; i < sorted_data.length; i++) {
            let id = sorted_data[i]['id'];
            const round = sorted_data[i]['round'];
            let game_id = id;
            // subtract
            for (let j = 0; j < round - 1; j++) {
                game_id -= round_num[j+1];
            }
            if (round_num[round] > 1) {
                sorted_data[i]['game_id'] = game_id;
                if (game_id <= round_num[round] / 2) {
                    sorted_data[i]['block_pos'] = 'left';
                } else {
                    sorted_data[i]['block_pos'] = 'right';
                }
            } else {
                sorted_data[i]['block_pos'] = 'center';
            }
            // insert to block indices
            if (round === 1) {
                if (sorted_data[i]['block_pos'] === 'left') {
                    left_block_indices.push(id);
                } else {
                    right_block_indices.push(id);
                }
            }
            const next_left_id = sorted_data[i]['next_left_id'];
            const next_right_id = sorted_data[i]['next_right_id'];
            if (round > 1) {
                const block_pos = sorted_data[i]['block_pos'];
                let target_indices = (block_pos === 'left' ? left_block_indices : right_block_indices);
                const current_index = target_indices.indexOf(sorted_data[i]['id']);
                if (current_index === -1) {
                    continue;
                }
                if (next_left_id !== null) {
                    if ('set_prev_right_position_y' in sorted_data[parseInt(next_left_id) - 1] &&
                       !target_indices.includes(sorted_data[parseInt(next_left_id) - 1]['prev_right_id'] + 1)) {
                        target_indices.splice(current_index + (block_pos === 'left' ? 2 : -1), 0,
                                              sorted_data[parseInt(next_left_id) - 1]['prev_right_id'] + 1);
                    } else if ('set_prev_left_position_y' in sorted_data[parseInt(next_left_id) - 1] &&
                              !target_indices.includes(sorted_data[parseInt(next_left_id) - 1]['prev_left_id'] + 1)) {
                        target_indices.splice(current_index + (block_pos === 'left' ? -1 : 2), 0,
                                              sorted_data[parseInt(next_left_id) - 1]['prev_left_id'] + 1);
                    }
                }
                if (next_right_id !== null) {
                    if ('set_prev_right_position_y' in sorted_data[parseInt(next_right_id) - 1] &&
                        !target_indices.includes(sorted_data[parseInt(next_right_id) - 1]['prev_right_id'] + 1)) {
                        target_indices.splice(current_index + (block_pos === 'left' ? -1 : 2), 0,
                                              sorted_data[parseInt(next_right_id) - 1]['prev_right_id'] + 1);
                        console.log(target_indices);
                    } else if ('set_prev_left_position_y' in sorted_data[parseInt(next_right_id) - 1] &&
                               !target_indices.includes(sorted_data[parseInt(next_right_id) - 1]['prev_left_id'] + 1)) {
                        target_indices.splice(current_index + (block_pos === 'left' ? 2 : -1), 0,
                                              sorted_data[parseInt(next_right_id) - 1]['prev_left_id'] + 1);
                    }
                }
                continue;
            }
            if (next_left_id !== null &&
                left_block_indices.indexOf(next_left_id) === -1 &&
                right_block_indices.indexOf(next_left_id) === -1) {
                const block_pos = sorted_data[i]['block_pos'];
                if (block_pos === 'left') {
                    const current_index = left_block_indices.indexOf(sorted_data[i]['id']);
                    if (current_index !== -1) {
                        left_block_indices.splice(current_index + 1, 0, next_left_id);
                    }
                } else if (block_pos === 'right') {
                    const current_index = right_block_indices.indexOf(sorted_data[i]['id']);
                    if (current_index !== -1) {
                        right_block_indices.splice(current_index, 0, next_left_id);
                    }
                }
            } else if (next_right_id !== null &&
                       left_block_indices.indexOf(next_right_id) === -1 &&
                       right_block_indices.indexOf(next_right_id) === -1) {
                const block_pos = sorted_data[i]['block_pos'];
                if (block_pos === 'left') {
                    const current_index = left_block_indices.indexOf(sorted_data[i]['id']);
                    if (current_index !== -1) {
                        left_block_indices.splice(current_index, 0, next_right_id);
                    }
                } else if (block_pos === 'right') {
                    const current_index = right_block_indices.indexOf(sorted_data[i]['id']);
                    if (current_index !== -1) {
                        right_block_indices.splice(current_index + 1, 0, next_right_id);
                    }
                }
            }
        }
        let max_begin_y = 0;
        let begin_y = 25;
        for (let i = 0; i < left_block_indices.length; i++) {
            const index = left_block_indices[i] - 1;
            if (sorted_data[index]['round'] === 1) {
                sorted_data[index]['left_begin_y'] = begin_y;
                begin_y += 40;
                sorted_data[index]['right_begin_y'] = begin_y;
                begin_y += 40;
            } else {
                const has_left = ('has_left' in sorted_data[index]);
                const has_right = ('has_right' in sorted_data[index]);
                if (!has_left) {
                    sorted_data[index]['left_begin_y'] = begin_y;
                    begin_y += 40;
                }
                if (!has_right) {
                    sorted_data[index]['right_begin_y'] = begin_y;
                    begin_y += 40;
                }
            }
        }
        max_begin_y = begin_y;
        begin_y = 25;
        for (let i = 0; i < right_block_indices.length; i++) {
            const index = right_block_indices[i] - 1;
            if (sorted_data[index]['round'] === 1) {
                sorted_data[index]['right_begin_y'] = begin_y;
                begin_y += 40;
                sorted_data[index]['left_begin_y'] = begin_y;
                begin_y += 40;
                if (sorted_data[index]['next_left_id'] !== null) {
                    sorted_data[sorted_data[index]['next_left_id'] - 1]['left_begin_y'] = (sorted_data[index]['left_begin_y'] +
                                                                                           sorted_data[index]['right_begin_y']) / 2;
                } else {
                    sorted_data[sorted_data[index]['next_right_id'] - 1]['right_begin_y'] = (sorted_data[index]['left_begin_y'] +
                                                                                             sorted_data[index]['right_begin_y']) / 2;
                }
            } else {
                const has_left = ('has_left' in sorted_data[index]);
                const has_right = ('has_right' in sorted_data[index]);
                if (!has_right) {
                    sorted_data[index]['right_begin_y'] = begin_y;
                    begin_y += 40;
                }
                if (!has_left) {
                    sorted_data[index]['left_begin_y'] = begin_y;
                    begin_y += 40;
                }
            }
        }
        max_begin_y = Math.max(begin_y, max_begin_y);
        let semi_final_right_id = -1;
        for (let i = 0; i < sorted_data.length; i++) {
            if (sorted_data[i]['next_left_id'] !== null) {
                sorted_data[sorted_data[i]['next_left_id'] - 1]['left_begin_y'] = (sorted_data[i]['left_begin_y'] +
                                                                                   sorted_data[i]['right_begin_y']) / 2;
            } else if (sorted_data[i]['next_right_id'] !== null) {
                sorted_data[sorted_data[i]['next_right_id'] - 1]['right_begin_y'] = (sorted_data[i]['left_begin_y'] +
                                                                                     sorted_data[i]['right_begin_y']) / 2;
                // to correct center position later in right-side semi final
                if (sorted_data[i]['next_right_id'] === sorted_data.length) {
                    semi_final_right_id = i;
                }
            }
        }
        if (sorted_data.length > 1 &&
            semi_final_right_id !== -1 &&
            sorted_data[sorted_data.length - 1]['left_begin_y'] !== sorted_data[sorted_data.length - 1]['right_begin_y']) {
            sorted_data[semi_final_right_id]['offset_y'] = sorted_data[sorted_data.length - 1]['left_begin_y'] - sorted_data[sorted_data.length - 1]['right_begin_y'];
        }
        if (sorted_data.length > 2) {
            sorted_data[sorted_data.length - 2]['left_begin_y'] = max_begin_y + 50;
        }
        console.log(sorted_data);
        res.json(sorted_data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
