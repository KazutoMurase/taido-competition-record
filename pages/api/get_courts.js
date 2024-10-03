import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

const GetCourts = async (req, res) => {
  try {
    const client = await GetClient();
    const cache_key = "get_courts";
    const cached_data = await Get(cache_key);
    if (cached_data) {
      return res.json(cached_data.data);
    }
    const query = "SELECT id, name FROM court_type";
    const result = await client.query(query);
    const sorted_data = result.rows.sort((a, b) => a.id - b.id);
    await Set(cache_key, { data: sorted_data });
    res.json(sorted_data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error feching data" });
  }
};

export default GetCourts;
