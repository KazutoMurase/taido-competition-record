import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

export default async (req, res) => {
  try {
    const client = await GetClient();
    let query, values, result;
    console.log(req.body.is_test);
    const notification_request_name =
      req.body.is_test === true
        ? "test_notification_request"
        : "notification_request";
    console.log(notification_request_name);
    if ("player_id" in req.body) {
      query =
        "INSERT INTO " +
        notification_request_name +
        "(event_id, player_id, court_id) values ($1, $2, $3)";
      values = [req.body.event_id, req.body.player_id, req.body.court_id];
      result = await client.query(query, values);
    } else if ("group_id" in req.body) {
      query =
        "INSERT INTO " +
        notification_request_name +
        "(event_id, group_id, court_id) values ($1, $2, $3)";
      values = [req.body.event_id, req.body.group_id, req.body.court_id];
      result = await client.query(query, values);
    }
    const key = "latest_update_for_" + notification_request_name;
    Set(key, Date.now());
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};
