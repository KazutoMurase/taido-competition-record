import GetClient from "../../lib/db_client";
import { Set } from "../../lib/redis_client";

const ChangeEventOrder = async (req, res) => {
  try {
    const client = await GetClient();
    const block_name = "block_" + req.query.block;
    const target_schedule_id = parseInt(req.query.target_schedule_id);
    let query =
      "update " +
      block_name +
      " t1 set event_id = t2.event_id from " +
      block_name +
      " t2 where t1.id in ($1,$2) and t2.id in ($2,$1) and t1.id <> t2.id";
    let values = [target_schedule_id, target_schedule_id + 1];
    let result = await client.query(query, values);
    query =
      "update " +
      block_name +
      "_games t1 set schedule_id = t2.schedule_id from " +
      block_name +
      "_games t2 where t1.schedule_id in ($1,$2) and t2.schedule_id in ($2,$1) and t1.schedule_id <> t2.schedule_id";
    values = [target_schedule_id, target_schedule_id + 1];
    result = await client.query(query, values);
    const key = "time_schedule_for_" + block_name;
    const timestamp = Date.now();
    await Set(key, timestamp);
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default ChangeEventOrder;
