import GetClient from "../../lib/db_client";

const GetAwardedPlayers = async (req, res) => {
  try {
    const client = await GetClient();
    const query =
      "SELECT t1.id, t1.award_name, t2.name, t2.name_kana, t3.name AS group FROM awarded_players AS t1 " +
      " LEFT JOIN players AS t2 ON t1.player_id = t2.id " +
      " LEFT JOIN groups AS t3 ON t2.group_id = t3.id";
    const result = await client.query(query);
    const sorted_data = result.rows.sort((a, b) => a.id - b.id);
    res.json(sorted_data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default GetAwardedPlayers;
