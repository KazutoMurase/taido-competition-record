import { TouchCacheVersion } from "./versioned_cache";

const NOTIFICATION_UPDATES_KEY = Symbol.for(
  "taido-competition-record.notification-updates",
);

function GetListeners() {
  if (!globalThis[NOTIFICATION_UPDATES_KEY]) {
    globalThis[NOTIFICATION_UPDATES_KEY] = new Set();
  }
  return globalThis[NOTIFICATION_UPDATES_KEY];
}

function VersionKey(isTest) {
  return (
    "latest_update_for_" + (isTest ? "test_" : "") + "notification_request"
  );
}

export async function MarkNotificationUpdated(isTest) {
  await TouchCacheVersion(VersionKey(isTest));
  for (const listener of GetListeners()) {
    listener(isTest);
  }
}

export function SubscribeNotificationUpdates(listener) {
  const listeners = GetListeners();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
