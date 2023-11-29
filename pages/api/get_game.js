import { db } from '@vercel/postgres';

export default async (req, res) => {
    try {
        const client = await db.connect();
        const current_id = parseInt(req.query.id);
        const event_name = req.query.event_name;
        let query = 'SELECT t1.id, t1.left_player_flag, t1.left_player_id, t1.right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name FROM ' + event_name + ' AS t1 LEFT JOIN players AS t2 ON t1.left_player_id = t2.' + event_name + '_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.' + event_name + '_player_id';
        const result_schedule = await client.query(query);
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
        // select item
        for (let i = 0; i < sorted_data.length; i++) {
            console.log(sorted_data[i]);
            if (sorted_data[i]['id'] === current_id) {
                if (i === sorted_data.length - 1) {
                    sorted_data[i]['block_pos'] = 'center';
                    sorted_data[i]['left_color'] = 'red';
                } else if ('round' in sorted_data[i]) {
                    const round = sorted_data[i]['round'];
                    let game_id = sorted_data[i]['id'];
                    for (let j = 0; j < round - 1; j++) {
                        game_id -= round_num[j+1];
                    }
                    if (game_id <= round_num[round] / 2) {
                        // sorted_data[i]['block_pos'] = 'left';
                        sorted_data[i]['left_color'] = 'red';
                    } else {
                        //sorted_data[i]['block_pos'] = 'right';
                        sorted_data[i]['left_color'] = 'white';
                    }
                } else {
                    sorted_data[i]['block_pos'] = 'center';
                    sorted_data[i]['left_color'] = 'red';
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
