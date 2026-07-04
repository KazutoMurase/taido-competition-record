import { Get, Set } from "../../lib/redis_client";

function getKey(block) {
  return "operation_unlock_for_block_" + block;
}

function isValidBlock(block) {
  return typeof block === "string" && /^[a-z]$/.test(block);
}

const OperationUnlock = async (req, res) => {
  try {
    const block = req.method === "POST" ? req.body.block : req.query.block;
    if (!isValidBlock(block)) {
      res.status(400).json({ error: "invalid block" });
      return;
    }

    if (req.method === "POST") {
      const enabled = Boolean(req.body.enabled);
      await Set(getKey(block), enabled ? "true" : "false");
      res.json({ enabled });
      return;
    }

    const enabled = (await Get(getKey(block))) === true;
    res.json({ enabled });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Error updating operation unlock" });
  }
};

export default OperationUnlock;
