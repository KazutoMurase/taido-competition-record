import GetClient from "../../lib/db_client";

export default async (req, res) => {
  try {
    const client = await GetClient();
    const event_name = req.query.event_name;
    const query =
      "SELECT t1.id, t1.left_player_id AS left_id, t2.name AS left_name, t1.right_player_id AS right_id, t3.name AS right_name, t1.left_player_flag FROM " +
      event_name +
      " AS t1 LEFT JOIN players AS t2 ON t1.left_player_id = t2." +
      event_name +
      "_player_id LEFT JOIN players AS t3 ON t1.right_player_id = t3." +
      event_name +
      "_player_id";
    const result = await client.query(query);
    const sorted_data = result.rows.sort((a, b) => a.id - b.id);
    const final_data = sorted_data[sorted_data.length - 1];
    const before_final_data = sorted_data[sorted_data.length - 2];
    let winner1 = null;
    let winner2 = null;
    let winner3 = null;
    let winner4 = null;
    if (final_data !== undefined && final_data.left_player_flag !== null) {
      if (event_name.includes("hokei")) {
        if (final_data.left_player_flag >= 2) {
          winner1 = { name: final_data.left_name, id: final_data.left_id };
          winner2 = { name: final_data.right_name, id: final_data.right_id };
        } else {
          winner1 = { name: final_data.right_name, id: final_data.right_id };
          winner2 = { name: final_data.left_name, id: final_data.left_id };
        }
      } else if (event_name.includes("zissen")) {
        if (final_data.left_player_flag >= 1) {
          winner1 = { name: final_data.left_name, id: final_data.left_id };
          winner2 = { name: final_data.right_name, id: final_data.right_id };
        } else {
          winner1 = { name: final_data.right_name, id: final_data.right_id };
          winner2 = { name: final_data.left_name, id: final_data.left_id };
        }
      }
    }
    if (
      before_final_data !== undefined &&
      before_final_data.left_player_flag !== null
    ) {
      if (event_name.includes("hokei")) {
        if (before_final_data.left_player_flag >= 2) {
          winner3 = {
            name: before_final_data.left_name,
            id: before_final_data.left_id,
          };
          winner4 = {
            name: before_final_data.right_name,
            id: before_final_data.right_id,
          };
        } else {
          winner3 = {
            name: before_final_data.right_name,
            id: before_final_data.right_id,
          };
          winner4 = {
            name: before_final_data.left_name,
            id: before_final_data.left_id,
          };
        }
      } else if (event_name.includes("zissen")) {
        if (before_final_data.left_player_flag >= 1) {
          winner3 = {
            name: before_final_data.left_name,
            id: before_final_data.left_id,
          };
          winner4 = {
            name: before_final_data.right_name,
            id: before_final_data.right_id,
          };
        } else {
          winner3 = {
            name: before_final_data.right_name,
            id: before_final_data.right_id,
          };
          winner4 = {
            name: before_final_data.left_name,
            id: before_final_data.left_id,
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
