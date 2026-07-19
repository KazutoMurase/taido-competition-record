import { Delete } from "./redis_client";
import { GetVersionedCache, TouchCacheVersion } from "./versioned_cache";

function timestampKey(eventName) {
  return `latest_update_result_for_${eventName}_timestamp`;
}

function cacheKey(eventName) {
  return `get_result_for_${eventName}_cache_data`;
}

export async function MarkResultUpdated(eventName) {
  await Promise.all([
    TouchCacheVersion(timestampKey(eventName)),
    Delete(cacheKey(eventName)),
  ]);
}

export async function GetResultWithCache(eventName, loadData) {
  return GetVersionedCache(
    cacheKey(eventName),
    [timestampKey(eventName)],
    loadData,
  );
}
