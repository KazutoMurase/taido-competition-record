import GetClient from "../../lib/db_client";
import { TouchCacheVersion } from "../../lib/versioned_cache";

const CreateNotificationRequest = async (req, res) => {
  try {
    const client = await GetClient();
    let query, values, result;
    const notification_request_name =
      req.body.is_test === true
        ? "test_notification_request"
        : "notification_request";
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
        "(event_id, group_id, group_name, court_id) values ($1, $2, $3, $4)";
      values = [
        req.body.event_id,
        req.body.group_id,
        req.body.group_name,
        req.body.court_id,
      ];
      result = await client.query(query, values);
    }
    const key = "latest_update_for_" + notification_request_name;
    await TouchCacheVersion(key);
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default CreateNotificationRequest;
