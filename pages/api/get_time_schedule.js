import conn from '../../lib/db'

export default async (req, res) => {
    try {
        const block_name = 'block_' + req.query.block_number;
        let query = 'select t0.id, t1.name, t0.time_schedule, t0.players_checked from ' + block_name + ' as t0 left join EVENT_TYPE as t1 on t0.event_id = t1.id';
        let result = await conn.query(query);
        query = 'select id, schedule_id, game_id from ' + block_name + '_games';
        let result_games = await conn.query(query);
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
            sorted_data[i]['games_text'] = words.join('');
        }
        res.json(sorted_data);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
