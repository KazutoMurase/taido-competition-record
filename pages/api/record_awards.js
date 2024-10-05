import GetClient from "../../lib/db_client";

const Record = async (req, res) => {
  try {
    const client = await GetClient();
    const id = req.query.id;
    const name = req.query.name;
    const player_id = req.query.player_id;
    if (name) {
      let query = "select id from players where name = $1";
      let result = await client.query(query, [name]);
      console.log(result.rows);
      query = "update awarded_players set player_id = $1 where id = $2";
      result = await client.query(query, [result.rows[0].id, id]);
    } else {
      const query = "update awarded_players set player_id = $1 where id = $2";
      const result = await client.query(query, [player_id, id]);
    }
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default Record;
