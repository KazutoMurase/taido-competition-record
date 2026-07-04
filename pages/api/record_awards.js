import GetClient from "../../lib/db_client";

const Record = async (req, res) => {
  try {
    const client = await GetClient();
    const id = req.method === "POST" ? req.body.id : req.query.id;
    const name = req.method === "POST" ? req.body.name : req.query.name;
    const player_id =
      req.method === "POST" ? req.body.player_id : req.query.player_id;
    const free_name =
      req.method === "POST" ? req.body.free_name : req.query.free_name;
    if (!id) {
      res.status(400).json({ error: "id is required" });
      return;
    }
    if (free_name !== undefined) {
      const query =
        "update awarded_players set player_id = null, name = $1 where id = $2";
      await client.query(query, [free_name || null, id]);
      res.json({});
      return;
    }
    if (player_id === null || player_id === "") {
      const query =
        "update awarded_players set player_id = null, name = null where id = $1";
      await client.query(query, [id]);
      res.json({});
      return;
    }
    if (name) {
      let query = "select id from players where name = $1";
      let result = await client.query(query, [name]);
      if (result.rows.length === 0) {
        res.status(404).json({ error: "player not found" });
        return;
      }
      query =
        "update awarded_players set player_id = $1, name = null where id = $2";
      result = await client.query(query, [result.rows[0].id, id]);
    } else {
      const query =
        "update awarded_players set player_id = $1, name = null where id = $2";
      const result = await client.query(query, [player_id, id]);
    }
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default Record;
