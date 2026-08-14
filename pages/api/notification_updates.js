import { SubscribeNotificationUpdates } from "../../lib/notification_updates";

const HEARTBEAT_INTERVAL_MS = 25000;

export const config = {
  api: {
    externalResolver: true,
  },
};

export default function NotificationUpdates(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!["true", "false"].includes(req.query.is_test)) {
    res.status(400).json({ error: "Invalid test mode" });
    return;
  }
  const isTest = req.query.is_test === "true";

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders?.();
  res.socket?.setTimeout(0);
  res.write("retry: 3000\n\n");

  const unsubscribe = SubscribeNotificationUpdates((updatedIsTest) => {
    if (updatedIsTest !== isTest) {
      return;
    }
    res.write(
      `event: notification-updated\ndata: ${JSON.stringify({ isTest })}\n\n`,
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
