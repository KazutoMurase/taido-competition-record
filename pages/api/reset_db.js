import GetClient from '../../lib/db_client';
import { Get, Set } from '../../lib/redis_client';
import fs from 'fs';
//import { parse } from 'csv-parse';
import path from 'path';
const { parse } = require('csv-parse');

const parseAsync = (fileData) => {
  return new Promise((resolve, reject) => {
    const parser = parse(fileData, { columns: true });
    const records = [];
    parser.on('readable', () => {
      let record;
      while ((record = parser.read())) {
        records.push(record);
      }
    });

    parser.on('end', () => {
      resolve(records);
    });

    parser.on('error', (error) => {
      reject(error);
    });
  });
};

async function UpdateEventFromCSV(client, event_name) {
    const csvFilePath = path.join(process.cwd(),
                                  '/data/test/' + event_name + '.csv');
    const fileData = fs.readFileSync(csvFilePath,
                                     'utf-8');
    const records = await parseAsync(fileData);
    for (const record of records) {
        const query = {
            text: 'UPDATE ' + event_name + ' SET left_player_id = $1, right_player_id = $2 WHERE id = $3',
            values: [record.left_player_id !== '' ? parseInt(record.left_player_id) : null,
                     record.right_player_id !== '' ? parseInt(record.right_player_id) : null,
                     record.id],
        };
        client.query(query);
    }
    let query = 'UPDATE ' + event_name + ' SET left_player_flag=null, left_retire=null, right_retire=null';
    await client.query(query);
}

async function UpdateBlockFromCSV(client, block_name) {
    const csvFilePath = path.join(process.cwd(),
                                  '/data/test/' + block_name + '_games.csv');
    const fileData = fs.readFileSync(csvFilePath,
                                     'utf-8');
    const records = await parseAsync(fileData);
    for (const record of records) {
        const query = {
            text: 'UPDATE ' + block_name + '_games SET order_id = $1 WHERE id = $2',
            values: [record.order_id,
                     record.id],
        };
        client.query(query);
    }
    let query = 'UPDATE current_' + block_name + ' SET id = 1, game_id = 1';
    await client.query(query);
    query = 'UPDATE ' + block_name + ' SET players_checked = 0';
    await client.query(query);
}

export default async (req, res) => {
    try {
        const client = await GetClient();
        for (let i = 0; i < req.body.event_names.length; i++) {
            console.log("reset " + req.body.event_names[i]);
            await UpdateEventFromCSV(client, req.body.event_names[i]);
        }
        for (let i = 0; i < req.body.block_names.length; i++) {
            console.log("reset " + req.body.block_names[i]);
            await UpdateBlockFromCSV(client, req.body.block_names[i]);
        }
        let query = 'DELETE FROM test_notification_request';
        await client.query(query);
        // update timestamp to current
        const timestamp = Date.now();
        for (let i = 0; i < req.body.event_names.length; i++) {
            const event_name = req.body.event_names[i];
            await Set("latest_update_result_for_" + event_name + "_timestamp", timestamp);
        }
        for (let i = 0; i < req.body.block_names.length; i++) {
            const block_name = req.body.block_names[i];
            await Set("update_id_for_current_" + block_name, timestamp);
            await Set("update_game_id_for_current_" + block_name, timestamp);
            await Set("update_complete_players_for_" + block_name, timestamp);
        }
        await Set("latest_update_for_test_notification_request", timestamp);
        res.json([]);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: 'Error fetching data'});
    }
};
