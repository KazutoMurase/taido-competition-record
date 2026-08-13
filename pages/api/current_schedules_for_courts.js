import { GetCurrentScheduleData } from "./current_schedule";

const BLOCK_NUMBER_PATTERN = /^[a-z0-9_]+$/;
const MAX_COURTS = 12;

const CurrentSchedulesForCourts = async (req, res) => {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const blockNumbers = String(req.query.block_numbers || "")
    .split(",")
    .filter(Boolean);
  if (
    blockNumbers.length === 0 ||
    blockNumbers.length > MAX_COURTS ||
    blockNumbers.some((blockNumber) => !BLOCK_NUMBER_PATTERN.test(blockNumber))
  ) {
    return res.status(400).json({ error: "Invalid query" });
  }

  const settled = await Promise.allSettled(
    blockNumbers.map(async (blockNumber) => [
      blockNumber,
      await GetCurrentScheduleData(blockNumber),
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
      console.error("Failed to fetch current schedule", result.reason),
    );

  if (Object.keys(data).length === 0) {
    return res.status(500).json({ error: "Error fetching data" });
  }
  return res.json(data);
};

export default CurrentSchedulesForCourts;
