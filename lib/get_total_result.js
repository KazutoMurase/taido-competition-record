import GetClient from "./db_client";

function AddScore(data, id, score) {
  if (!data) {
    return;
  }
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

// for rank resolution when total score equals
function AddRankedCount(data, rank, is_dantai) {
  if (!data) {
    return;
  }
  const rank_key = "rank" + rank.toString() + "_events";
  data[rank_key] = (data[rank_key] ? data[rank_key] : 0) + 1;
  if (is_dantai) {
    data["ranked_dantai_events"] =
      (data["ranked_dantai_events"] ? data["ranked_dantai_events"] : 0) + 1;
  }
}

function GetDataById(data, id) {
  return data.find((item) => item.id === id);
}

export async function GetTotalResult(
  event_name,
  use_different_personal_scores,
) {
  const dantai_scores = [10, 6, 3, 1];
  const personal_scores =
    use_different_personal_scores === "true" ? [7, 4, 2, 1] : [10, 6, 3, 1];
  const client = await GetClient();
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
          const data = GetDataById(sorted_group_data, ranked_data[i].group_id);
          if (ranked_data[i]["rank"] === 1) {
            AddScore(data, elem.id, dantai_scores[0]);
            AddRankedCount(data, 1, true);
          } else if (ranked_data[i]["rank"] === 2) {
            AddScore(data, elem.id, dantai_scores[1]);
            AddRankedCount(data, 2, true);
          } else if (ranked_data[i]["rank"] === 3) {
            AddScore(data, elem.id, dantai_scores[2]);
            AddRankedCount(data, 3, true);
          } else if (ranked_data[i]["rank"] === 4) {
            AddScore(data, elem.id, dantai_scores[3]);
            AddRankedCount(data, 4, true);
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
      const left_data = GetDataById(
        sorted_group_data,
        final_data.left_group_id,
      );
      const right_data = GetDataById(
        sorted_group_data,
        final_data.right_group_id,
      );
      const is_dantai = elem.name_en.includes("dantai");
      if (final_left_flag >= thresh) {
        AddScore(
          left_data,
          elem.id,
          is_dantai ? dantai_scores[0] : personal_scores[0],
        );
        AddRankedCount(left_data, 1, is_dantai);
        AddScore(
          right_data,
          elem.id,
          is_dantai ? dantai_scores[1] : personal_scores[1],
        );
        AddRankedCount(right_data, 2, is_dantai);
      } else {
        AddScore(
          right_data,
          elem.id,
          is_dantai ? dantai_scores[0] : personal_scores[0],
        );
        AddRankedCount(right_data, 1, is_dantai);
        AddScore(
          left_data,
          elem.id,
          is_dantai ? dantai_scores[1] : personal_scores[1],
        );
        AddRankedCount(left_data, 2, is_dantai);
      }
    }
    if (before_final_left_flag !== null) {
      const thresh = elem.name_en.includes("hokei") ? 2 : 1;
      const left_data = GetDataById(
        sorted_group_data,
        before_final_data.left_group_id,
      );
      const right_data = GetDataById(
        sorted_group_data,
        before_final_data.right_group_id,
      );
      const is_dantai = elem.name_en.includes("dantai");
      if (before_final_left_flag >= thresh) {
        AddScore(
          left_data,
          elem.id,
          is_dantai ? dantai_scores[2] : personal_scores[2],
        );
        AddRankedCount(left_data, 3, is_dantai);
        AddScore(
          right_data,
          elem.id,
          is_dantai ? dantai_scores[3] : personal_scores[3],
        );
        AddRankedCount(right_data, 4, is_dantai);
      } else {
        AddScore(
          right_data,
          elem.id,
          is_dantai ? dantai_scores[2] : personal_scores[2],
        );
        AddRankedCount(right_data, 3, is_dantai);
        AddScore(
          left_data,
          elem.id,
          is_dantai ? dantai_scores[3] : personal_scores[3],
        );
        AddRankedCount(left_data, 4, is_dantai);
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
    if (b.total !== a.total || (b.total === 0 && a.total === 0)) {
      return b.total - a.total;
    }
    // if total scores are same, compare the numbers of ranked events at 1st~4th each
    for (let i = 1; i <= 4; ++i) {
      const rank_key = "rank" + i.toString() + "_events";
      if (!a[rank_key]) a[rank_key] = 0;
      if (!b[rank_key]) b[rank_key] = 0;
      if (b[rank_key] !== a[rank_key]) {
        return b[rank_key] - a[rank_key];
      }
    }
    // if the numbers of ranked events are same at all ranks, compare the sum of ranked dantai events
    if (!a["ranked_dantai_events"]) a["ranked_dantai_events"] = 0;
    if (!b["ranked_dantai_events"]) b["ranked_dantai_events"] = 0;
    // if even the sum of ranked dantai events are the same, mark two groups to be the same rank by linking each other
    if (b["ranked_dantai_events"] === a["ranked_dantai_events"]) {
      b["same_rank_as"] = a.id;
      a["same_rank_as"] = b.id;
    }
    return b["ranked_dantai_events"] - a["ranked_dantai_events"];
  });
  let prev_total = -1;
  let prev_id = -1;
  sorted_group_data.forEach((item, index) => {
    if (item.total) {
      if (
        item.total !== prev_total ||
        !item["same_rank_as"] ||
        item["same_rank_as"] !== prev_id
      ) {
        // "+ 1" because rank starts from 1
        item.rank = index + 1;
      } else {
        // if this group's rank is same as previous one
        item.rank = sorted_group_data[index - 1].rank;
      }
      prev_total = item.total;
      prev_id = item.id;
    } else {
      // if total score = 0
      item.rank = null;
    }
  });
  sorted_group_data.sort((a, b) => a.id - b.id);
  return sorted_group_data;
}
