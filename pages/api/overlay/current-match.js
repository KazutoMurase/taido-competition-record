import {
  GetCurrentMatchForCourt,
  NormalizeCourt,
} from "../../../lib/current_match_overlay";

export default async function CurrentMatchOverlay(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  const court = NormalizeCourt(req.query.court);
  if (!court) {
    return res.status(400).json({ error: "Invalid court" });
  }

  try {
    const currentMatch = await GetCurrentMatchForCourt(court);
    if (!currentMatch) {
      return res.status(404).json({ error: "Court not found" });
    }

    res.setHeader("Cache-Control", "no-store");
    return res.status(200).json(currentMatch);
  } catch (error) {
    console.error("Failed to load overlay current match", error);
    return res.status(500).json({ error: "Error fetching data" });
  }
}
