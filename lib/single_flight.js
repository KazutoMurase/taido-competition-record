const pendingLoads = new Map();

export async function SingleFlight(key, loadData) {
  const pending = pendingLoads.get(key);
  if (pending) {
    return pending;
  }

  const load = Promise.resolve().then(loadData);
  pendingLoads.set(key, load);

  try {
    return await load;
  } finally {
    if (pendingLoads.get(key) === load) {
      pendingLoads.delete(key);
    }
  }
}
