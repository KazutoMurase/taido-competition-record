import { GetTableResult } from "../../lib/get_table_result";
import { GetResultWithCache } from "../../lib/result_cache";

const GetResult = async (req, res) => {
  try {
    const event_name = req.query.event_name;
    const data = await GetResultWithCache(event_name, () =>
      GetTableResult(event_name),
    );
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetResult;
