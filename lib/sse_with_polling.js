const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 60000;
const DEFAULT_WATCHDOG_INTERVAL_MS = 15000;

export function StartSseWithPolling({
  url,
  eventName,
  onUpdate,
  pollInterval,
  connectionTimeoutMs = DEFAULT_CONNECTION_TIMEOUT_MS,
  heartbeatTimeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS,
  watchdogIntervalMs = DEFAULT_WATCHDOG_INTERVAL_MS,
}) {
  let eventSource = null;
  let fallbackInterval = null;
  let connectionTimeout = null;
  let heartbeatWatchdog = null;
  let sseHealthy = false;
  let lastSseActivity = Date.now();

  const stopFallbackPolling = () => {
    if (fallbackInterval !== null) {
      clearInterval(fallbackInterval);
      fallbackInterval = null;
    }
  };
  const startFallbackPolling = () => {
    if (pollInterval <= 0 || fallbackInterval !== null) {
      return;
    }
    onUpdate();
    fallbackInterval = setInterval(onUpdate, pollInterval);
  };
  const markSseHealthy = () => {
    const recovered = !sseHealthy;
    sseHealthy = true;
    lastSseActivity = Date.now();
    stopFallbackPolling();
    return recovered;
  };

  if (typeof EventSource === "undefined") {
    startFallbackPolling();
  } else {
    try {
      eventSource = new EventSource(url);
      eventSource.addEventListener(eventName, () => {
        markSseHealthy();
        onUpdate();
      });
      eventSource.addEventListener("heartbeat", () => {
        if (markSseHealthy()) {
          onUpdate();
        }
      });
      eventSource.onopen = () => {
        markSseHealthy();
        onUpdate();
      };
      eventSource.onerror = () => {
        sseHealthy = false;
        startFallbackPolling();
      };
      connectionTimeout = setTimeout(() => {
        if (!sseHealthy) {
          startFallbackPolling();
        }
      }, connectionTimeoutMs);
      heartbeatWatchdog = setInterval(() => {
        if (Date.now() - lastSseActivity > heartbeatTimeoutMs) {
          sseHealthy = false;
          startFallbackPolling();
        }
      }, watchdogIntervalMs);
    } catch (error) {
      console.error("Failed to connect to result updates", error);
      startFallbackPolling();
    }
  }

  return () => {
    stopFallbackPolling();
    if (connectionTimeout !== null) {
      clearTimeout(connectionTimeout);
    }
    if (heartbeatWatchdog !== null) {
      clearInterval(heartbeatWatchdog);
    }
    eventSource?.close();
  };
}
