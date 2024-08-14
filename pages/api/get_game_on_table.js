import GetClient from "../../lib/db_client";

const GetGameOnTable = async (req, res) => {
  try {
    const client = await GetClient();
    const current_id = parseInt(req.query.id);
    const event_name = req.query.event_name;
    const groups_name = event_name + "_groups";
    let query =
      "SELECT t1.id, t2.name, t1.main_score, t1.sub1_score, t1.sub2_score, t1.penalty, t1.retire FROM " +
      event_name +
      " AS t1 LEFT JOIN " +
      groups_name +
      " AS t2 ON t1.group_id = t2.id WHERE t1.id = " +
      current_id;
    const result_schedule = await client.query(query);
    if (result_schedule.rows.length === 0) {
      res.status(500).json({ error: "Error fetching data" });
    } else {
      res.json(result_schedule.rows[0]);
    }
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetGameOnTable;
