import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

// FIXME: need to support tenkai
async function GetFromDB(req, res) {
  const client = await GetClient();
  const event_name = req.query.event_name;
  let query;
  const groups_name = event_name + "_groups";
  const groups = event_name.includes("test") ? "test_groups" : "groups";
  query =
    "SELECT t1.id, t1.round, t1.main_score, t1.sub1_score, t1.sub2_score, t1.penalty, t1.retire, t2.name FROM " +
    event_name +
    " AS t1 LEFT JOIN " +
    groups_name +
    " AS t2 ON t1.group_id = t2.id";
  const result_schedule = await client.query(query);
  const sorted_data = result_schedule.rows.sort((a, b) => a.id - b.id);
  for (let i = 0; i < sorted_data.length; i++) {
    let sum_score = 0;
    // Multiply by 10 before sum, then devide by 10 at last
    // to avoid rounding error
    if (sorted_data[i]["main_score"]) {
      sum_score += parseFloat(sorted_data[i]["main_score"]) * 10;
    }
    if (sorted_data[i]["sub1_score"]) {
      sum_score += parseFloat(sorted_data[i]["sub1_score"]) * 10;
    }
    if (sorted_data[i]["sub2_score"]) {
      sum_score += parseFloat(sorted_data[i]["sub2_score"]) * 10;
    }
    if (sorted_data[i]["penalty"]) {
      sum_score += parseFloat(sorted_data[i]["penalty"]) * 10;
    }
    sorted_data[i]["sum_score"] = sum_score ? sum_score / 10 : null;
  }
  const grouped_data = sorted_data.reduce((result, data) => {
    if (!result[data.round]) {
      result[data.round] = [];
    }
    result[data.round].push(data);
    return result;
  }, {});

  const ranked_data = Object.values(grouped_data).flatMap((round_group) => {
    round_group.sort((a, b) => {
      if (b.sum_score === a.sum_score) {
        return b.main_score - a.main_score;
      }
      return b.sum_score - a.sum_score;
    });
    round_group.forEach((item, index) => {
      item.rank = item.sum_score ? index + 1 : null;
    });
    return round_group;
  });
  return ranked_data.sort((a, b) => a.id - b.id);
}

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
    const data = await GetFromDB(req, res);
    console.log(data);
    await Set(cache_key, { data: data, timestamp: Date.now() });
    res.json(data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetResult;
