import GetClient from "../../lib/db_client";
import { Get, Set } from "../../lib/redis_client";

function AddScore(data, id, score) {
  if (data[id]) {
    data[id] += score;
  } else {
    data[id] = score;
  }
  if (data["total"]) {
    data["total"] += score;
  } else {
    data["total"] = score;
  }
}

const GetTotal = async (req, res) => {
  const client = await GetClient();
  const event_name = req.query.event_name;
  let query = "SELECT id, name_en FROM event_type WHERE existence = 1";
  const event_result = await client.query(query);
  query = "SELECT id, name FROM groups";
  const groups_result = await client.query(query);
  let sorted_group_data = groups_result.rows.sort((a, b) => a.id - b.id);
  for (const elem of event_result.rows) {
    if (elem.name_en.includes("finished")) {
      // skip
      continue;
    } else if (
      elem.name_en.includes("tenkai") ||
      elem.name_en.includes("dantai_hokei")
    ) {
      const groups_name = elem.name_en + "_groups";
      if (elem.name_en.includes("tenkai")) {
        query =
          "SELECT t1.id, t2.group_id, t1.round, t1.main_score, t1.sub1_score, t1.sub2_score, t1.sub3_score, t1.sub4_score, t1.sub5_score, t1.elapsed_time, t1.penalty FROM " +
          elem.name_en +
          " AS t1 LEFT JOIN " +
          groups_name +
          " AS t2 ON t1.group_id = t2.id";
      } else {
        query =
          "SELECT t1.id, t2.group_id, t1.round, t1.main_score, t1.sub1_score, t1.sub2_score, t1.penalty FROM " +
          elem.name_en +
          " AS t1 LEFT JOIN " +
          groups_name +
          " AS t2 ON t1.group_id = t2.id";
      }
      const result = await client.query(query);
      const sorted_data = result.rows.sort((a, b) => a.id - b.id);
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
        if (sorted_data[i]["penalty"]) {
          sum_score += parseFloat(sorted_data[i]["penalty"]) * 10;
        }
        if (sorted_data[i]["elapsed_time"]) {
          const time = parseFloat(sorted_data[i]["elapsed_time"]);
          if (time >= 30.0) {
            sorted_data[i]["time_penalty"] =
              -Math.ceil((time - 30.0) * 2) * 0.5;
            sum_score += sorted_data[i]["time_penalty"] * 10;
          } else if (time <= 25.0) {
            sorted_data[i]["time_penalty"] =
              -Math.ceil((25.0 - time) * 2) * 0.5;
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
      for (let i = 0; i < ranked_data.length; i++) {
        if (ranked_data[i]["round"] === final_round_num) {
          if (ranked_data[i]["rank"] === 1) {
            AddScore(
              sorted_group_data[ranked_data[i].group_id - 1],
              elem.id,
              10,
            );
          } else if (ranked_data[i]["rank"] === 2) {
            AddScore(
              sorted_group_data[ranked_data[i].group_id - 1],
              elem.id,
              6,
            );
          } else if (ranked_data[i]["rank"] === 3) {
            AddScore(
              sorted_group_data[ranked_data[i].group_id - 1],
              elem.id,
              3,
            );
          } else if (ranked_data[i]["rank"] === 4) {
            AddScore(
              sorted_group_data[ranked_data[i].group_id - 1],
              elem.id,
              1,
            );
          }
        }
      }
      continue;
    } else if (elem.name_en.includes("dantai")) {
      const groups_name = elem.name_en + "_groups";
      query =
        "SELECT t1.id, t2.group_id AS left_group_id, t3.group_id AS right_group_id, t1.left_group_flag AS left_flag FROM " +
        elem.name_en +
        " AS t1" +
        " LEFT JOIN " +
        groups_name +
        " AS t2 ON t1.left_group_id = t2.id" +
        " LEFT JOIN " +
        groups_name +
        " AS t3 ON t1.right_group_id = t3.id";
    } else {
      query =
        "SELECT t1.id, t2.group_id AS left_group_id, t3.group_id AS right_group_id, t1.left_player_flag AS left_flag FROM " +
        elem.name_en +
        " AS t1" +
        " LEFT JOIN players AS t2 ON t1.left_player_id = t2." +
        elem.name_en +
        "_player_id" +
        " LEFT JOIN players AS t3 ON t1.right_player_id = t3." +
        elem.name_en +
        "_player_id";
    }
    const result = await client.query(query);
    const sorted_data = result.rows.sort((a, b) => a.id - b.id);
    const final_data = sorted_data[sorted_data.length - 1];
    const before_final_data = sorted_data[sorted_data.length - 2];
    const final_left_flag = final_data?.left_flag;
    const before_final_left_flag = before_final_data?.left_flag;
    if (final_left_flag !== null) {
      const thresh = elem.name_en.includes("hokei") ? 2 : 1;
      if (final_left_flag >= thresh) {
        AddScore(sorted_group_data[final_data.left_group_id - 1], elem.id, 10);
        AddScore(sorted_group_data[final_data.right_group_id - 1], elem.id, 6);
      } else {
        AddScore(sorted_group_data[final_data.right_group_id - 1], elem.id, 10);
        AddScore(sorted_group_data[final_data.left_group_id - 1], elem.id, 6);
      }
    }
    if (before_final_left_flag !== null) {
      const thresh = elem.name_en.includes("hokei") ? 2 : 1;
      if (before_final_left_flag >= thresh) {
        AddScore(
          sorted_group_data[before_final_data.left_group_id - 1],
          elem.id,
          3,
        );
        AddScore(
          sorted_group_data[before_final_data.right_group_id - 1],
          elem.id,
          1,
        );
      } else {
        AddScore(
          sorted_group_data[before_final_data.right_group_id - 1],
          elem.id,
          3,
        );
        AddScore(
          sorted_group_data[before_final_data.left_group_id - 1],
          elem.id,
          1,
        );
      }
    }
  }
  // set rank
  sorted_group_data.sort((a, b) => {
    if (!a.total) {
      a.total = 0;
    }
    if (!b.total) {
      b.total = 0;
    }
    if (b.total === a.total) {
    }
    return b.total - a.total;
  });
  let prev_total = -1;
  sorted_group_data.forEach((item, index) => {
    if (item.total) {
      item.rank = item.total === prev_total ? index : index + 1;
      prev_total = item.total;
    } else {
      item.rank = null;
    }
  });
  sorted_group_data.sort((a, b) => a.id - b.id);
  res.json(sorted_group_data);
};

export default GetTotal;
