import { GetVersionedCache, TouchCacheVersion } from "./versioned_cache";
import { SingleFlight } from "./single_flight";
import { PublishResultUpdate } from "./result_updates";

function versionKey(eventName) {
  return `latest_update_result_for_${eventName}_version`;
}

function cacheKey(eventName) {
  return `get_result_for_${eventName}_cache_data`;
}

export async function MarkResultUpdated(eventName) {
  await TouchCacheVersion(versionKey(eventName));
  PublishResultUpdate(eventName);
}

export async function GetResultWithCache(eventName, loadData) {
  const key = cacheKey(eventName);
  return SingleFlight(key, () =>
    GetVersionedCache(key, [versionKey(eventName)], loadData),
  );
}
