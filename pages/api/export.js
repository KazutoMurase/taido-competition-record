import GetClient from "../../lib/db_client";
import { parse } from "json2csv";

const ExportToCsv = async (req, res) => {
  try {
    const client = await GetClient();
    const db_name = req.query.database_name;
    const query = "SELECT * FROM " + db_name;
    const result = await client.query(query);
    const data = result.rows;
    const csv = parse(data);
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=" + db_name + ".csv",
    );
    res.status(200).send(csv);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default ExportToCsv;
