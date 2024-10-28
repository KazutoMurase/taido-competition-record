import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";
import fs from "fs";
//import { parse } from 'csv-parse';
import path from "path";
const { parse } = require("csv-parse");

const parseAsync = (fileData) => {
  return new Promise((resolve, reject) => {
    const parser = parse(fileData, { columns: true });
    const records = [];
    parser.on("readable", () => {
      let record;
      while ((record = parser.read())) {
        records.push(record);
      }
    });

    parser.on("end", () => {
      resolve(records);
    });

    parser.on("error", (error) => {
      reject(error);
    });
  });
};

async function UpdateEventFromCSV(client, db_name, event_name) {
  const csvFilePath = path.join(
    process.cwd(),
    "/data/" + db_name + "/original/" + event_name + ".csv",
  );
  const fileData = fs.readFileSync(csvFilePath, "utf-8");
  const records = await parseAsync(fileData);
  const is_dantai = event_name.includes("dantai");
  const type_name = is_dantai ? "group" : "player";
  let query;
  for (const record of records) {
    const left_id = is_dantai ? record.left_group_id : record.left_player_id;
    const right_id = is_dantai ? record.right_group_id : record.right_player_id;
    query = {
      text:
        "UPDATE " +
        event_name +
        " SET left_" +
        type_name +
        "_id = $1, right_" +
        type_name +
        "_id = $2 WHERE id = $3",
      values: [
        left_id !== "" && parseInt(left_id) ? parseInt(left_id) : null,
        right_id !== "" && parseInt(right_id) ? parseInt(right_id) : null,
        record.id,
      ],
    };
    await client.query(query);
  }
  query =
    "UPDATE " +
    event_name +
    " SET left_" +
    type_name +
    "_flag=null, left_retire=null, right_retire=null";
  await client.query(query);
}

async function UpdateTableEventFromCSV(client, db_name, event_name) {
  const csvFilePath = path.join(
    process.cwd(),
    "/data/" + db_name + "/original/" + event_name + ".csv",
  );
  const fileData = fs.readFileSync(csvFilePath, "utf-8");
  const records = await parseAsync(fileData);
  let query;
  for (const record of records) {
    query = {
      text: "UPDATE " + event_name + " SET group_id = $1 WHERE id = $2",
      values: [record.group_id ? parseInt(record.group_id) : null, record.id],
    };
    await client.query(query);
  }
  if (event_name.includes("tenkai")) {
    query =
      "UPDATE " +
      event_name +
      " SET main_score=null, sub1_score=null, sub2_score=null, sub3_score=null, sub4_score=null, sub5_score=null, elapsed_time=null, penalty=null, retire=null";
  } else {
    query =
      "UPDATE " +
      event_name +
      " SET main_score=null, sub1_score=null, sub2_score=null, penalty=null, retire=null";
  }
  await client.query(query);
}

async function UpdateBlockFromCSV(client, db_name, block_name) {
  const csvFilePath = path.join(
    process.cwd(),
    "/data/" + db_name + "/original/" + block_name + "_games.csv",
  );
  const fileData = fs.readFileSync(csvFilePath, "utf-8");
  const records = await parseAsync(fileData);
  for (const record of records) {
    const query = {
      text: "UPDATE " + block_name + "_games SET order_id = $1 WHERE id = $2",
      values: [record.order_id, record.id],
    };
    client.query(query);
  }
  let query = "UPDATE current_" + block_name + " SET id = 1, game_id = 1";
  await client.query(query);
  query = "UPDATE " + block_name + " SET players_checked = 0";
  await client.query(query);
}

const ResetDb = async (req, res) => {
  try {
    const client = await GetClient();
    const db_name = req.body.database_name;
    const is_test = db_name === "test";
    for (let i = 0; i < req.body.event_names.length; i++) {
      console.log("reset " + req.body.event_names[i]);
      if (
        req.body.event_names[i].includes("dantai_hokei") ||
        req.body.event_names[i].includes("tenkai")
      ) {
        await UpdateTableEventFromCSV(client, db_name, req.body.event_names[i]);
      } else {
        await UpdateEventFromCSV(client, db_name, req.body.event_names[i]);
      }
    }
    for (let i = 0; i < req.body.block_names.length; i++) {
      console.log("reset " + req.body.block_names[i]);
      await UpdateBlockFromCSV(client, db_name, req.body.block_names[i]);
    }
    let query = "UPDATE awarded_players SET player_id=null";
    await client.query(query);
    query = "DELETE FROM " + (is_test ? "test_" : "") + "notification_request";
    await client.query(query);
    // update timestamp to current
    const timestamp = Date.now();
    for (let i = 0; i < req.body.event_names.length; i++) {
      const event_name = req.body.event_names[i];
      await Set(
        "latest_update_result_for_" + event_name + "_timestamp",
        timestamp,
      );
    }
    for (let i = 0; i < req.body.block_names.length; i++) {
      const block_name = req.body.block_names[i];
      await Set("update_id_for_current_" + block_name, timestamp);
      await Set("update_game_id_for_current_" + block_name, timestamp);
      await Set("update_complete_players_for_" + block_name, timestamp);
    }
    await Set(
      "latest_update_for_" + (is_test ? "test_" : "") + "notification_request",
      timestamp,
    );
    res.json([]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default ResetDb;
