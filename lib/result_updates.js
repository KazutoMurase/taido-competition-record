const RESULT_UPDATES_KEY = Symbol.for(
  "taido-competition-record.result-updates",
);

function GetListeners() {
  if (!globalThis[RESULT_UPDATES_KEY]) {
    globalThis[RESULT_UPDATES_KEY] = new Set();
  }
  return globalThis[RESULT_UPDATES_KEY];
}

export function PublishResultUpdate(eventName) {
  for (const listener of GetListeners()) {
    listener(eventName);
  }
}

export function SubscribeResultUpdates(listener) {
  const listeners = GetListeners();
  listeners.add(listener);
  return () => listeners.delete(listener);
}
