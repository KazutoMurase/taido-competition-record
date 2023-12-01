import { db } from '@vercel/postgres';
import { kv } from "@vercel/kv";

function update(sorted_data, item, block_indices, value) {
    if ('prev_left_id' in item) {
        update(sorted_data, sorted_data[item['prev_left_id']], block_indices, value);
    }
    if (!('prev_left_id' in item) ||
        !('prev_right_id' in item)) {
        if (value === 'left') {
            block_indices.push(item['id']);
        } else {
            block_indices.splice(0, 0, item['id']);
        }
    }
    if ('prev_right_id' in item) {
        update(sorted_data, sorted_data[item['prev_right_id']], block_indices, value);
    }
    item['block_pos'] = value;
}

async function GetFromDB(req, res) {
    const client = await db.connect();
    const event_name = req.query.event_name;
    const query = 'SELECT t1.id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t2.name_kana AS left_name_kana, t4.name AS left_group_name, t3.name AS right_name, t3.name_kana AS right_name_kana, t5.name AS right_group_name, t1.left_player_flag FROM ' + event_name + ' AS t1 LEFT JOIN players AS t2 ON t1.left_player_id = t2.' + event_name + '_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3.' + event_name + '_player_id LEFT JOIN groups AS t4 ON t2.group_id = t4.id LEFT JOIN groups AS t5 ON t3.group_id = t5.id';
    const result_schedule = await client.query(query);
    const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
    // set round 0, 1, ...
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
    // set block pos
    let left_block_indices = [];
    let right_block_indices = [];
    if (sorted_data.length > 3 &&
        'prev_left_id' in sorted_data[sorted_data.length - 1] &&
        'prev_right_id' in sorted_data[sorted_data.length - 1] ) {
        sorted_data[sorted_data.length - 1]['block_pos'] = 'center';
        sorted_data[sorted_data.length - 2]['block_pos'] = 'center';
        const left_block_id = sorted_data[sorted_data.length - 1]['prev_left_id'];
        const right_block_id = sorted_data[sorted_data.length - 1]['prev_right_id'];
        update(sorted_data, sorted_data[left_block_id], left_block_indices, 'left');
        update(sorted_data, sorted_data[right_block_id], right_block_indices, 'right');
    }
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
    return sorted_data;
}

export default async (req, res) => {
    try {
        // try to use cache
        const event_name = req.query.event_name;
        const freeze = req.query.freeze;
        if (freeze != undefined && parseInt(freeze) === 1) {
            const freezedKey = 'get_freezed_result_for_' + event_name;
            const freezedData = await kv.get(freezedKey);
            if (freezedData) {
                return res.json(freezedData.data);
            } else {
                const data = await GetFromDB(req, res);
                await kv.set(freezedKey, {data: data, timestamp: Date.now()});
                return res.json(data);
            }
        }
        const latestUpdateKey = 'latest_update_result_for_' + event_name + '_timestamp';
        const cacheKey = 'get_result_for_' + event_name + '_cache_data';
        const cachedData = await kv.get(cacheKey);
        const latestUpdateTimestamp = await kv.get(latestUpdateKey) || 0;
        if (cachedData &&
            latestUpdateTimestamp < cachedData.timestamp) {
            console.log("using cache");
            return res.json(cachedData.data);
        }
        console.log("get new data");
        const data = await GetFromDB(req, res);
        console.log(data);
        await kv.set(cacheKey, {data: data, timestamp: Date.now()});
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
