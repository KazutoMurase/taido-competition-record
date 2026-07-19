import { GetVersionedCache, TouchCacheVersion } from "./versioned_cache";

function versionKey(eventName) {
  return `latest_update_result_for_${eventName}_version`;
}

function cacheKey(eventName) {
  return `get_result_for_${eventName}_cache_data`;
}

export async function MarkResultUpdated(eventName) {
  await TouchCacheVersion(versionKey(eventName));
}

export async function GetResultWithCache(eventName, loadData) {
  return GetVersionedCache(
    cacheKey(eventName),
    [versionKey(eventName)],
    loadData,
  );
}
