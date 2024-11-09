import { FlushAll } from "../../lib/redis_client";

const ResetCache = async (req, res) => {
  try {
    await FlushAll();
    res.json([]);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default ResetCache;
