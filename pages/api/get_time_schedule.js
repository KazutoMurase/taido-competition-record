import GetClient from '../../lib/db_client';
import { Get, Set } from '../../lib/redis_client';

async function GetFromDB(req, res) {
    const client = await GetClient();
    const block_name = 'block_' + req.query.block_number;
    let query = 'select t0.id, t0.event_id, t1.name, t0.time_schedule, t0.before_final, t0.final, t0.players_checked from ' + block_name + ' as t0 left join EVENT_TYPE as t1 on t0.event_id = t1.id';
    const result = await client.query(query);
    query = 'select id, schedule_id, game_id from ' + block_name + '_games';
    let result_games = await client.query(query);
    const sorted_data = result.rows.sort((a, b) => a.id - b.id);
    const sorted_games_data = result_games.rows.sort((a, b) => a.id - b.id);
    for (let i = 0; i < sorted_games_data.length; i++) {
        let target_schedule = sorted_data[parseInt(sorted_games_data[i].schedule_id) - 1];
        if ('game_count' in target_schedule) {
            target_schedule['game_count'] += 1;
            target_schedule['games'].push(sorted_games_data[i].game_id);
        } else {
            target_schedule['game_count'] = 1;
            target_schedule['games'] = [sorted_games_data[i].game_id];
        }
    }
    for (let i = 0; i < sorted_data.length; i++) {
        const games = sorted_data[i].games;
        let words = []
        if (games !== undefined) {
            for (let j = 0; j < games.length; j++) {
                if (j === 0) {
                    words = [games[j]];
                }
                else if (j === 1) {
                    words.push(',');
                    words.push(games[j]);
                }
                else {
                    if (games[j - 2] + 1 === games[j - 1] &&
                        games[j - 1] + 1 === games[j]) {
                        const length = words.length;
                        words[length - 2] = "-";
                        words[length - 1] = games[j];
                    } else {
                        words.push(',');
                        words.push(games[j]);
                    }
                }
            }
        }
        sorted_data[i]['games_text'] = words.join('');
    }
    return sorted_data;
}

export default async (req, res) => {
    try {
        // try to use cache
        const block_name = 'block_' + req.query.block_number;
        const latest_update_key = 'update_complete_players_for_' + block_name;
        const cache_key = 'time_schedule_for_' + block_name;
        const latest_update_timestamp = await Get(latest_update_key) || 0;
        const cached_data = await Get(cache_key);
        if (cached_data &&
            latest_update_timestamp < cached_data.timestamp) {
            console.log("using cache");
            return res.json(cached_data.data);
        }
        console.log("get new data");
        const data = await GetFromDB(req, res);
        console.log(data);
        await Set(cache_key, {data: data, timestamp: Date.now()});
        res.json(data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
