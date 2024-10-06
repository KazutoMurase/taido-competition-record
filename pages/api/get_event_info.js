import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

const GetEventDescription = async (req, res) => {
  try {
    const client = await GetClient();
    const event_name = req.query.event_name;
    const cache_key = "get_event_info_" + event_name;
    const cached_data = await Get(cache_key);
    if (cached_data) {
      return res.json(cached_data.data);
    }
    const query =
      "SELECT full_name, description FROM event_type where name_en = $1";
    const result = await client.query(query, [event_name]);
    await Set(cache_key, { data: result.rows });
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetEventDescription;
