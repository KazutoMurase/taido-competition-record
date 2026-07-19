import { GetMany, Increment, Set } from "./redis_client";

const CACHE_RETRIES = 2;

function normalizeVersion(value) {
  const version = Number(value);
  return Number.isInteger(version) && version >= 0 ? version : 0;
}

async function getVersions(versionKeys) {
  const values = await GetMany(versionKeys);
  return values.map(normalizeVersion);
}

function versionsMatch(left, right) {
  return (
    Array.isArray(left) &&
    left.length === right.length &&
    left.every((version, index) => version === right[index])
  );
}

export async function TouchCacheVersion(key) {
  return Increment(key);
}

export async function GetVersionedCache(
  cacheKey,
  versionKeys,
  loadData,
  shouldCache = () => true,
) {
  const initialValues = await GetMany([cacheKey, ...versionKeys]);
  const cached = initialValues[0];
  let versions = initialValues.slice(1).map(normalizeVersion);

  if (cached && versionsMatch(cached.versions, versions)) {
    return cached.data;
  }

  let data;
  for (let attempt = 0; attempt < CACHE_RETRIES; attempt += 1) {
    const versionsBefore = versions;
    data = await loadData();
    const versionsAfter = await getVersions(versionKeys);

    if (versionsMatch(versionsBefore, versionsAfter)) {
      if (shouldCache(data)) {
        await Set(cacheKey, { data, versions: versionsAfter });
      }
      return data;
    }
    versions = versionsAfter;
  }

  return data;
}
