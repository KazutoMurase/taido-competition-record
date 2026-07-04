import GetClient from "../../lib/db_client";

const SearchPlayers = async (req, res) => {
  try {
    const client = await GetClient();
    const q = typeof req.query.q === "string" ? req.query.q.trim() : "";
    if (q.length === 0) {
      res.json([]);
      return;
    }

    const query =
      "SELECT t1.id, t1.name, t1.name_kana, t2.name AS group FROM players AS t1 " +
      "LEFT JOIN groups AS t2 ON t1.group_id = t2.id " +
      "WHERE CAST(t1.id AS TEXT) = $1 OR t1.name ILIKE $2 OR t1.name_kana ILIKE $2 " +
      "ORDER BY t1.id LIMIT 20";
    const result = await client.query(query, [q, "%" + q + "%"]);
    res.json(result.rows);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error searching players" });
  }
};

export default SearchPlayers;
