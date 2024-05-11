import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

async function GetFromDB(req, res, notification_request_name) {
  const client = await GetClient();
  const players_name = notification_request_name.includes("test")
    ? "test_players"
    : "players";
  let query =
    "SELECT t2.id, t3.name AS event_name, t2.name, t2.name_kana, t4.name AS court_name, t5.name AS group_name FROM " +
    notification_request_name +
    " AS t1 LEFT JOIN " +
    players_name +
    " AS t2 ON t1.player_id = t2.id LEFT JOIN event_type AS t3 ON t1.event_id = t3.id LEFT JOIN court_type AS t4 ON t1.court_id = t4.id LEFT JOIN groups AS t5 ON t2.group_id = t5.id WHERE t1.player_id is not null";
  const result = await client.query(query);
  query =
    "SELECT t1.event_id, t1.group_id, t3.name AS event_name, t4.name AS court_name, t5.name AS group_name FROM " +
    notification_request_name +
    " AS t1 LEFT JOIN event_type AS t3 ON t1.event_id = t3.id LEFT JOIN court_type AS t4 ON t1.court_id = t4.id LEFT JOIN groups AS t5 ON t1.group_id = t5.id WHERE t1.group_id is not null";
  const result_group = await client.query(query);
  return [...result.rows, ...result_group.rows];
}

export default async (req, res) => {
  try {
    const is_test = req.query.is_test === "true";
    console.log(is_test);
    const notification_request_name = is_test
      ? "test_notification_request"
      : "notification_request";
    const cacheKey = "get_" + notification_request_name;
    const cachedData = await Get(cacheKey);
    const latestNotificationUpdateKey =
      "latest_update_for_" + notification_request_name;
    const latestNotificationUpdateTimestamp =
      (await Get(latestNotificationUpdateKey)) || 0;
    if (
      cachedData &&
      latestNotificationUpdateTimestamp < cachedData.timestamp
    ) {
      console.log("using cache");
      return res.json(cachedData.data);
    }
    console.log("get new data");
    const data = await GetFromDB(req, res, notification_request_name);
    await Set(cacheKey, { data: data, timestamp: Date.now() });
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};
