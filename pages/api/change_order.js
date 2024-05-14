import GetClient from "../../lib/db_client";
import { Set } from "../../lib/redis_client";

const ChangeOrder = async (req, res) => {
  try {
    const client = await GetClient();
    const block_name = "block_" + req.body.update_block;
    let query =
      "update " +
      block_name +
      "_games t1 set order_id = t2.order_id from " +
      block_name +
      "_games t2 where t1.order_id in ($1,$2) and t2.order_id in ($2,$1) and t1.order_id <> t2.order_id and t1.schedule_id = " +
      req.body.schedule_id +
      " and t2.schedule_id = " +
      req.body.schedule_id;
    let values = [req.body.target_order_id, req.body.target_order_id + 1];
    const result = await client.query(query, values);
    const key = "change_order_for_" + block_name;
    const timestamp = Date.now();
    await Set(key, timestamp);
    res.json({});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error fetching data" });
  }
};

export default ChangeOrder;
