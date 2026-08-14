import { SubscribeResultUpdates } from "../../lib/result_updates";

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;
const HEARTBEAT_INTERVAL_MS = 25000;

export const config = {
  api: {
    externalResolver: true,
  },
};

export default function ResultUpdates(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const eventName = req.query.event_name;
  if (typeof eventName !== "string" || !EVENT_NAME_PATTERN.test(eventName)) {
    res.status(400).json({ error: "Invalid event name" });
    return;
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.socket?.setTimeout(0);
  res.write("retry: 3000\n\n");

  const unsubscribe = SubscribeResultUpdates((updatedEventName) => {
    if (updatedEventName !== eventName) {
      return;
    }
    res.write(
      `event: result-updated\ndata: ${JSON.stringify({ eventName })}\n\n`,
    );
  });
  const heartbeat = setInterval(() => {
    res.write("event: heartbeat\ndata: {}\n\n");
  }, HEARTBEAT_INTERVAL_MS);

  req.on("close", () => {
    clearInterval(heartbeat);
    unsubscribe();
    res.end();
  });
}
