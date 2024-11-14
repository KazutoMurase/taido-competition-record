import { Get, Set } from "../../lib/redis_client";
import { GetTableResult } from "../../lib/get_table_result";

const GetResult = async (req, res) => {
  try {
    const event_name = req.query.event_name;
    const latest_update_key =
      "latest_update_result_for_" + event_name + "_timestamp";
    const cache_key = "get_result_for_" + event_name + "_cache_data";
    const cached_data = await Get(cache_key);
    const latest_update_timestamp = (await Get(latest_update_key)) || 0;
    if (cached_data && latest_update_timestamp < cached_data.timestamp) {
      console.log("using cache");
      return res.json(cached_data.data);
    }
    console.log("get new data");
    const data = await GetTableResult(req.query.event_name);
    await Set(cache_key, { data: data, timestamp: Date.now() });
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetResult;
