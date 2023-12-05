import GetClient from '../../lib/db_client';
import { Get, Set } from '../../lib/redis_client';
import { GetEventName } from '../../lib/get_event_name';

async function GetFromDB(req, res, event_name) {
    const client = await GetClient();
    const block_name = 'block_' + req.query.block_number;
    const current_block_name = 'current_' + block_name;
    let query = 'SELECT t0.id, t0.game_id from ' + current_block_name + ' AS t0 LEFT JOIN ' + block_name + ' AS t1 ON t0.id = t1.id';
    let result = await client.query(query);
    if (req.query.schedule_id !== undefined &&
        parseInt(req.query.schedule_id) !== result.rows[0].id) {
        return [];
    }
    const players_name = (event_name.includes("test")) ? "test_players" : "players";
    let schedule_id = result.rows[0].id;
    query = 'SELECT game_id from ' + block_name + '_games where order_id = $1 and schedule_id = $2';
    let values = [result.rows[0].game_id, result.rows[0].id];
    result = await client.query(query, values);
    const current_id = (result.rows.length === 0 ? -1 : result.rows[0].game_id);
    //console.log(current_id, schedule_id);
    query = 'SELECT t0.order_id, t1.id, t1.left_retire, t1.right_retire, t2.name AS left_name, t2.name_kana AS left_name_kana, t3.name AS right_name, t3.name_kana AS right_name_kana, t4.name AS left_group_name, t5.name AS right_group_name FROM ' + block_name + '_games AS t0 LEFT JOIN ' + event_name + ' AS t1 ON t0.game_id = t1.id LEFT JOIN '+ players_name + ' AS t2 ON t1.left_player_id = t2.' + event_name + '_player_id LEFT JOIN ' + players_name + ' AS t3 ON t1.right_player_id = t3.' + event_name + '_player_id LEFT JOIN groups AS t4 ON t2.group_id = t4.id LEFT JOIN groups AS t5 ON t3.group_id = t5.id where t0.schedule_id = $1';
    const result_block = await client.query(query, [schedule_id]);
    query = 'SELECT t1.id, t1.left_player_id, t1.right_player_id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t3.name AS right_name FROM ' + event_name + ' AS t1 LEFT JOIN ' + players_name + ' AS t2 ON t1.left_player_id = t2.' + event_name + '_player_id LEFT JOIN ' + players_name + ' AS t3 ON t1.right_player_id = t3.' + event_name + '_player_id';
    const result_schedule = await client.query(query);
    const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
    let sorted_block_data = result_block.rows.sort((a, b) => a.order_id - b.order_id);
    //console.log(sorted_block_data);
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
                sorted_data[i]['left_color'] = 'red';
            } else {
                sorted_data[i]['left_color'] = 'white';
            }
        } else {
            sorted_data[i]['block_pos'] = 'center';
            sorted_data[i]['left_color'] = 'red';
        }
    }
    for (let i = 0; i < sorted_block_data.length; i++) {
        let id = parseInt(sorted_block_data[i]['id']);
        if ('round' in sorted_data[id - 1]) {
            sorted_block_data[i]['round'] = sorted_data[id - 1]['round'];
        }
        if ('left_color' in sorted_data[id - 1]) {
            sorted_block_data[i]['left_color'] = sorted_data[id - 1]['left_color'];
        }
        if (sorted_block_data[i]['left_group_name'] !== null) {
            sorted_block_data[i]['left_group_name'] = sorted_block_data[i]['left_group_name'].replace('\'', '').replace('\'', '');
        }
        if (sorted_block_data[i]['right_group_name'] !== null) {
            sorted_block_data[i]['right_group_name'] = sorted_block_data[i]['right_group_name'].replace('\'', '').replace('\'', '');
        }
        if (sorted_block_data[i]['id'] === current_id) {
            sorted_block_data[i]['current'] = true;
        }
    }
    return sorted_block_data;
}

export default async (req, res) => {
    try {
        const block_name = 'block_' + req.query.block_number;
        const current_block_name = 'current_' + block_name;
        const event_name = req.query.event_name;
        const cacheKey = 'get_games_on_' + block_name;
        const cachedData = await Get(cacheKey);

        // 'update_id_for_' +current_block_name can be checked,
        // but only game id should be enough in the current logic
        const latestGameIdUpdateKey = 'update_game_id_for_' + current_block_name;
        const latestChangeOrderKey = 'change_order_for_' + block_name;
        const latestUpdateResultKey = 'latest_update_result_for_' + event_name + '_timestamp';
        const latestCompletePlayersKey = 'update_complete_players_for_' + block_name;

        const latestGameIdUpdateTimestamp = await Get(latestGameIdUpdateKey) || 0;
        const latestChangeOrderTimestamp = await Get(latestChangeOrderKey) || 0;
        const latestUpdateResultTimestamp = await Get(latestUpdateResultKey) || 0;
        const latestCompletePlayersTimestamp = await Get(latestCompletePlayersKey) || 0;
        if (cachedData &&
            latestGameIdUpdateTimestamp < cachedData.timestamp &&
            latestChangeOrderTimestamp < cachedData.timestamp &&
            latestUpdateResultTimestamp < cachedData.timestamp &&
            latestCompletePlayersTimestamp < cachedData.timestamp) {
            console.log("using cache");
            return res.json(cachedData.data);
        }
        console.log("get new data");
        const data = await GetFromDB(req, res, event_name);
        if (data.length !== 0) {
            await Set(cacheKey, {data: data, timestamp: Date.now()});
        }
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
