import GetClient from "../../lib/db_client";

const GetWinners = async (req, res) => {
  try {
    const client = await GetClient();
    const event_name = req.query.event_name;
    let query;
    if (event_name.includes("dantai")) {
      const groups_name = event_name + "_groups";
      query =
        "SELECT t1.id, t1.left_group_id AS left_id, t2.name AS left_name, t1.right_group_id AS right_id, t3.name AS right_name, t1.left_group_flag FROM " +
        event_name +
        " AS t1 LEFT JOIN " +
        groups_name +
        " AS t2 ON t1.left_group_id = t2.id" +
        " LEFT JOIN " +
        groups_name +
        " AS t3 ON t1.right_group_id = t3.id";
    } else {
      query =
        "SELECT t1.id, t1.left_player_id AS left_id, t2.name AS left_name, t2.name_kana AS left_name_kana, t1.right_player_id AS right_id, t3.name AS right_name, t3.name_kana AS right_name_kana, t1.left_player_flag, t4.name AS left_group, t5.name AS right_group FROM " +
        event_name +
        " AS t1 LEFT JOIN players AS t2 ON t1.left_player_id = t2." +
        event_name +
        "_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3." +
        event_name +
        "_player_id" +
        " LEFT JOIN groups AS t4 ON t2.group_id = t4.id" +
        " LEFT JOIN groups AS t5 ON t3.group_id = t5.id";
    }
    const result = await client.query(query);
    const sorted_data = result.rows.sort((a, b) => a.id - b.id);
    const final_data = sorted_data[sorted_data.length - 1];
    const before_final_data = sorted_data[sorted_data.length - 2];
    let winner1 = null;
    let winner2 = null;
    let winner3 = null;
    let winner4 = null;
    const final_left_flag = event_name.includes("dantai")
      ? final_data?.left_group_flag
      : final_data?.left_player_flag;
    if (final_left_flag !== null) {
      if (event_name.includes("hokei")) {
        if (final_left_flag >= 2) {
          winner1 = {
            name: final_data.left_name,
            name_kana: final_data.left_name_kana,
            id: final_data.left_id,
            group: final_data.left_group,
          };
          winner2 = {
            name: final_data.right_name,
            name_kana: final_data.right_name_kana,
            id: final_data.right_id,
            group: final_data.right_group,
          };
        } else {
          winner1 = {
            name: final_data.right_name,
            name_kana: final_data.right_name_kana,
            id: final_data.right_id,
            group: final_data.right_group,
          };
          winner2 = {
            name: final_data.left_name,
            name_kana: final_data.left_name_kana,
            id: final_data.left_id,
            group: final_data.left_group,
          };
        }
      } else if (event_name.includes("zissen")) {
        if (final_left_flag >= 1) {
          winner1 = {
            name: final_data.left_name,
            name_kana: final_data.left_name_kana,
            id: final_data.left_id,
            group: final_data.left_group,
          };
          winner2 = {
            name: final_data.right_name,
            name_kana: final_data.right_name_kana,
            id: final_data.right_id,
            group: final_data.right_group,
          };
        } else {
          winner1 = {
            name: final_data.right_name,
            name_kana: final_data.right_name_kana,
            id: final_data.right_id,
            group: final_data.right_group,
          };
          winner2 = {
            name: final_data.left_name,
            name_kana: final_data.left_name_kana,
            id: final_data.left_id,
            group: final_data.left_group,
          };
        }
      }
    }
    const before_final_left_flag = event_name.includes("dantai")
      ? before_final_data?.left_group_flag
      : before_final_data?.left_player_flag;
    if (before_final_left_flag !== null) {
      if (event_name.includes("hokei")) {
        if (before_final_left_flag >= 2) {
          winner3 = {
            name: before_final_data.left_name,
            name_kana: before_final_data.left_name_kana,
            id: before_final_data.left_id,
            group: before_final_data.left_group,
          };
          winner4 = {
            name: before_final_data.right_name,
            name_kana: before_final_data.right_name_kana,
            id: before_final_data.right_id,
            group: before_final_data.right_group,
          };
        } else {
          winner3 = {
            name: before_final_data.right_name,
            name_kana: before_final_data.right_name_kana,
            id: before_final_data.right_id,
            group: before_final_data.right_group,
          };
          winner4 = {
            name: before_final_data.left_name,
            name_kana: before_final_data.left_name_kana,
            id: before_final_data.left_id,
            group: before_final_data.left_group,
          };
        }
      } else if (event_name.includes("zissen")) {
        if (before_final_left_flag >= 1) {
          winner3 = {
            name: before_final_data.left_name,
            name_kana: before_final_data.left_name_kana,
            id: before_final_data.left_id,
            group: before_final_data.left_group,
          };
          winner4 = {
            name: before_final_data.right_name,
            name_kana: before_final_data.right_name_kana,
            id: before_final_data.right_id,
            group: before_final_data.right_group,
          };
        } else {
          winner3 = {
            name: before_final_data.right_name,
            name_kana: before_final_data.right_name_kana,
            id: before_final_data.right_id,
            group: before_final_data.right_group,
          };
          winner4 = {
            name: before_final_data.left_name,
            name_kana: before_final_data.left_name_kana,
            id: before_final_data.left_id,
            group: before_final_data.left_group,
          };
        }
      }
    }
    res.json({ 1: winner1, 2: winner2, 3: winner3, 4: winner4 });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetWinners;
