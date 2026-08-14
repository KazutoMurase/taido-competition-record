const DEFAULT_CONNECTION_TIMEOUT_MS = 10000;
const DEFAULT_HEARTBEAT_TIMEOUT_MS = 60000;
const DEFAULT_WATCHDOG_INTERVAL_MS = 15000;

const connections = new Map();

function StopFallbackPolling(subscriber) {
  if (subscriber.fallbackInterval !== null) {
    clearInterval(subscriber.fallbackInterval);
    subscriber.fallbackInterval = null;
  }
}

function StartFallbackPolling(subscriber) {
  if (subscriber.pollInterval <= 0 || subscriber.fallbackInterval !== null) {
    return;
  }
  subscriber.onUpdate();
  subscriber.fallbackInterval = setInterval(
    subscriber.onUpdate,
    subscriber.pollInterval,
  );
}

function MarkConnectionHealthy(connection) {
  const recovered = !connection.healthy;
  connection.healthy = true;
  connection.lastActivity = Date.now();
  for (const subscriber of connection.subscribers) {
    StopFallbackPolling(subscriber);
  }
  return recovered;
}

function CreateConnection(
  url,
  connectionTimeoutMs,
  heartbeatTimeoutMs,
  watchdogIntervalMs,
) {
  const eventSource = new EventSource(url);
  const connection = {
    eventSource,
    subscribers: new Set(),
    healthy: false,
    lastActivity: Date.now(),
    connectionTimeout: null,
    heartbeatWatchdog: null,
  };

  eventSource.addEventListener("heartbeat", () => {
    if (MarkConnectionHealthy(connection)) {
      for (const subscriber of connection.subscribers) {
        subscriber.onUpdate();
      }
    }
  });
  eventSource.onopen = () => {
    MarkConnectionHealthy(connection);
    for (const subscriber of connection.subscribers) {
      subscriber.onUpdate();
    }
  };
  eventSource.onerror = () => {
    connection.healthy = false;
    for (const subscriber of connection.subscribers) {
      StartFallbackPolling(subscriber);
    }
  };
  connection.connectionTimeout = setTimeout(() => {
    if (!connection.healthy) {
      for (const subscriber of connection.subscribers) {
        StartFallbackPolling(subscriber);
      }
    }
  }, connectionTimeoutMs);
  connection.heartbeatWatchdog = setInterval(() => {
    if (Date.now() - connection.lastActivity > heartbeatTimeoutMs) {
      connection.healthy = false;
      for (const subscriber of connection.subscribers) {
        StartFallbackPolling(subscriber);
      }
    }
  }, watchdogIntervalMs);

  return connection;
}

function CloseConnection(url, connection) {
  if (connection.connectionTimeout !== null) {
    clearTimeout(connection.connectionTimeout);
  }
  if (connection.heartbeatWatchdog !== null) {
    clearInterval(connection.heartbeatWatchdog);
  }
  connection.eventSource.close();
  if (connections.get(url) === connection) {
    connections.delete(url);
  }
}

export function StartSseWithPolling({
  url,
  eventName,
  onUpdate,
  pollInterval,
  connectionTimeoutMs = DEFAULT_CONNECTION_TIMEOUT_MS,
  heartbeatTimeoutMs = DEFAULT_HEARTBEAT_TIMEOUT_MS,
  watchdogIntervalMs = DEFAULT_WATCHDOG_INTERVAL_MS,
}) {
  const subscriber = {
    onUpdate,
    pollInterval,
    fallbackInterval: null,
    eventHandler: null,
  };

  if (typeof EventSource === "undefined") {
    StartFallbackPolling(subscriber);
    return () => StopFallbackPolling(subscriber);
  }

  let connection = connections.get(url);
  if (!connection) {
    try {
      connection = CreateConnection(
        url,
        connectionTimeoutMs,
        heartbeatTimeoutMs,
        watchdogIntervalMs,
      );
      connections.set(url, connection);
    } catch (error) {
      console.error("Failed to connect to server-sent events", error);
      StartFallbackPolling(subscriber);
      return () => StopFallbackPolling(subscriber);
    }
  }

  subscriber.eventHandler = () => {
    MarkConnectionHealthy(connection);
    subscriber.onUpdate();
  };
  connection.subscribers.add(subscriber);
  connection.eventSource.addEventListener(eventName, subscriber.eventHandler);
  if (connection.healthy) {
    subscriber.onUpdate();
  }

  return () => {
    StopFallbackPolling(subscriber);
    connection.eventSource.removeEventListener(
      eventName,
      subscriber.eventHandler,
    );
    connection.subscribers.delete(subscriber);
    if (connection.subscribers.size === 0) {
      CloseConnection(url, connection);
    }
  };
}
