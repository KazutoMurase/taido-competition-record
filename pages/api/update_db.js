import GetClient from "../../lib/db_client";

const UpdateDb = async (req, res) => {
  try {
    const client = await GetClient();
    const table_name = req.query.table_name;
    const id = req.query.id;
    const key = req.query.key;
    const value = req.query.value;
    await client.query({
      text: "UPDATE " + table_name + " SET " + key + " = $1 WHERE id = $2",
      values: [value, id],
    });
    res.json([]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default UpdateDb;
