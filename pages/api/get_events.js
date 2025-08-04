import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

const GetEvents = async (req, res) => {
  try {
    const client = await GetClient();
    const event_name = req.query.event_name;
    const cache_key = "get_events";
    const cached_data = await Get(cache_key);
    if (cached_data) {
      return res.json(cached_data.data);
    }
    const query =
      "SELECT id, full_name, name, name_en, existence, order_id FROM event_type";
    const result = await client.query(query);
    const sorted_data = result.rows.sort((a, b) => a.order_id - b.order_id);
    await Set(cache_key, { data: sorted_data });
    res.json(sorted_data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error feching data" });
  }
};

export default GetEvents;
