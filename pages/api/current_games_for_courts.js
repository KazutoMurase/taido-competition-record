import { GetCurrentBlockData } from "./current_block";
import { GetCurrentGameOnTableData } from "./current_game_on_table";

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
const BLOCK_NUMBER_PATTERN = /^[a-z0-9_]+$/;
const MAX_COURTS = 12;

const CurrentGamesForCourts = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { event_name, type } = req.query;
  const blockNumbers = String(req.query.block_numbers || "")
    .split(",")
    .filter(Boolean);
  if (
    typeof event_name !== "string" ||
    !EVENT_NAME_PATTERN.test(event_name) ||
    !["table", "tournament"].includes(type) ||
    blockNumbers.length === 0 ||
    blockNumbers.length > MAX_COURTS ||
    blockNumbers.some((blockNumber) => !BLOCK_NUMBER_PATTERN.test(blockNumber))
  ) {
    return res.status(400).json({ error: "Invalid query" });
  }

  const loadData =
    type === "table" ? GetCurrentGameOnTableData : GetCurrentBlockData;
  const settled = await Promise.allSettled(
    blockNumbers.map(async (blockNumber) => [
      blockNumber,
      await loadData({ block_number: blockNumber, event_name }),
    ]),
  );
  const data = Object.fromEntries(
    settled
      .filter((result) => result.status === "fulfilled")
      .map((result) => result.value),
  );
  settled
    .filter((result) => result.status === "rejected")
    .forEach((result) =>
      console.error("Failed to fetch current game", result.reason),
    );

  if (Object.keys(data).length === 0) {
    return res.status(500).json({ error: "Error fetching data" });
  }
  return res.json(data);
};

export default CurrentGamesForCourts;
