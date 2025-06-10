import GetClient from "../../lib/db_client";
import { Set } from "../../lib/redis_client";

const Confirm = async (req, res) => {
  const client = await GetClient();
  const event_name = req.body.event_name;
  let query;
  const groups_name = event_name + "_groups";
  const groups = event_name.includes("test") ? "test_groups" : "groups";
  if (event_name.includes("tenkai")) {
    query =
      "SELECT t1.id, t1.group_id, t1.round, t1.main_score, t1.sub1_score, t1.sub2_score, t1.sub3_score, t1.sub4_score, t1.sub5_score, t1.elapsed_time, t1.penalty, t1.retire, t2.name FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      groups_name +
      " AS t2 ON t1.group_id = t2.id";
  } else {
    query =
      "SELECT t1.id, t1.group_id, t1.round, t1.main_score, t1.sub1_score, t1.sub2_score, t1.penalty, t1.retire, t2.name FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      groups_name +
      " AS t2 ON t1.group_id = t2.id";
  }
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
    if (sorted_data[i]["sub3_score"]) {
      sum_score += parseFloat(sorted_data[i]["sub3_score"]) * 10;
    }
    if (sorted_data[i]["sub4_score"]) {
      sum_score += parseFloat(sorted_data[i]["sub4_score"]) * 10;
    }
    if (sorted_data[i]["sub5_score"]) {
      sum_score += parseFloat(sorted_data[i]["sub5_score"]) * 10;
    }
    sorted_data[i]["sum_score_without_penalty"] = sum_score
      ? sum_score / 10
      : null;
    if (sorted_data[i]["penalty"]) {
      sum_score += parseFloat(sorted_data[i]["penalty"]) * 10;
    }
    if (sorted_data[i]["elapsed_time"]) {
      const time = parseFloat(sorted_data[i]["elapsed_time"]);
      if (time >= 30.0) {
        sorted_data[i]["time_penalty"] = -Math.ceil((time - 30.0) * 2) * 0.5;
        sum_score += sorted_data[i]["time_penalty"] * 10;
      } else if (time <= 25.0) {
        sorted_data[i]["time_penalty"] = -Math.ceil((25.0 - time) * 2) * 0.5;
        sum_score += sorted_data[i]["time_penalty"] * 10;
      }
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
  const final_round_num = Object.entries(grouped_data).length;
  if (final_round_num > 1) {
    const winners_num =
      grouped_data[final_round_num].length / (final_round_num - 1);
    // ranked_data might collapse the order, need to sort again
    const final_round_start_id = grouped_data[final_round_num].sort(
      (a, b) => a.id - b.id,
    )[0].id;
    for (let i = 1; i < final_round_num; i++) {
      const data = grouped_data[i];
      for (const item of data) {
        if (item.rank && item.rank <= winners_num) {
          const target_id =
            final_round_start_id +
            (winners_num - item.rank) * (final_round_num - 1) +
            (i - 1);
          query = "update " + event_name + " set group_id = $1 where id = $2";
          let values = [item.group_id, target_id];
          console.log(values);
          let result = await client.query(query, values);
        }
      }
    }
    const key = "latest_update_result_for_" + event_name + "_timestamp";
    const timestamp = Date.now();
    await Set(key, timestamp);
  }
  res.json({});
};

export default Confirm;
