import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";
import { applyTournamentLayout } from "../../lib/tournament_layout";
import { GetResultWithCache } from "../../lib/result_cache";

async function GetFromDB(req, res) {
  const client = await GetClient();
  const event_name = req.query.event_name;
  let query;
  if (event_name.includes("dantai")) {
    const groups_name = event_name + "_groups";
    const groups = event_name.includes("test") ? "test_groups" : "groups";
    query =
      "SELECT t1.id, t1.next_left_id, t1.next_right_id, t2.name AS left_group_name, t3.name AS right_group_name, t1.left_group_flag FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      groups_name +
      " AS t2 ON t1.left_group_id = t2.id" +
      " LEFT JOIN " +
      groups_name +
      " AS t3 ON t1.right_group_id = t3.id" +
      " LEFT JOIN " +
      groups +
      " AS t4 ON t2.group_id = t4.id" +
      " LEFT JOIN " +
      groups +
      " AS t5 ON t3.group_id = t5.id";
  } else {
    const players_name = event_name.includes("test")
      ? "test_players"
      : "players";
    const groups = event_name.includes("test") ? "test_groups" : "groups";
    query =
      "SELECT t1.id, t1.next_left_id, t1.next_right_id, t2.name AS left_name, t2.name_kana AS left_name_kana, t4.name AS left_group_name, t3.name AS right_name, t3.name_kana AS right_name_kana, t5.name AS right_group_name, t1.left_player_flag, t1.left_retire, t1.right_retire FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      players_name +
      " AS t2 ON t1.left_player_id = t2." +
      event_name +
      "_player_id LEFT JOIN " +
      players_name +
      " AS t3 ON t1.right_player_id = t3." +
      event_name +
      "_player_id LEFT JOIN " +
      groups +
      " AS t4 ON t2.group_id = t4.id LEFT JOIN " +
      groups +
      " AS t5 ON t3.group_id = t5.id";
  }
  const result_schedule = await client.query(query);
  const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
  return applyTournamentLayout(sorted_data);
}

const GetResult = async (req, res) => {
  try {
    // try to use cache
    const event_name = req.query.event_name;
    const freeze = req.query.freeze;
    if (freeze != undefined && parseInt(freeze) === 1) {
      const freezedKey = "get_freezed_result_for_" + event_name;
      const freezedData = await Get(freezedKey);
      if (freezedData) {
        return res.json(freezedData.data);
      } else {
        const data = await GetFromDB(req, res);
        await Set(freezedKey, { data });
        return res.json(data);
      }
    }
    const data = await GetResultWithCache(event_name, () =>
      GetFromDB(req, res),
    );
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetResult;
