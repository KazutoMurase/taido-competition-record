import GetClient from "../../lib/db_client"

const GetEvents = async (req, res) => {
  try {
    const client = await GetClient();
    const event_name = req.query.event_name;
    const query = "SELECT id, name, existence FROM event_type";
    const result = await client.query(query)
    const sorted_data = result.rows.sort((a, b) => a.id - b.id);
    res.json(sorted_data);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error feching data" })
  }
}

export default GetEvents;
