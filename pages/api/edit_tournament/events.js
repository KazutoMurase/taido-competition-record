import GetClient from "../../../lib/db_client";

function assertSafeName(value, label) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`invalid ${label}`);
  }
}

function cleanText(value) {
  if (value == null) {
    return "";
  }
  return String(value)
    .trim()
    .replace(/^'+|'+$/g, "");
}

function isUnsupportedEvent(eventName) {
  return (
    eventName === "finished" ||
    (eventName.includes("dantai") && !eventName.includes("dantai_zissen")) ||
    eventName.includes("tenkai")
  );
}

export default async function ListEditableTournamentEvents(req, res) {
  try {
    const competition = String(req.query.competition || "");
    assertSafeName(competition, "competition");

    const client = await GetClient();
    const result = await client.query(
      "SELECT id, full_name, name, name_en, existence, order_id FROM event_type",
    );
    const events = result.rows
      .sort((a, b) => a.order_id - b.order_id)
      .map((event) => {
        const eventName = cleanText(event.name_en);
        return {
          id: event.id,
          full_name: cleanText(event.full_name),
          name: cleanText(event.name),
          name_en: eventName,
          existence: Boolean(event.existence),
          editable: Boolean(event.existence) && !isUnsupportedEvent(eventName),
        };
      });

    res.json(events);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Error listing events" });
  }
}
