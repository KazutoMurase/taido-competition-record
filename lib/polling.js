export function StartPolling({ onUpdate, pollInterval }) {
  let stopped = false;
  let running = false;
  let timeout = null;

  async function refresh() {
    if (stopped || running || document.visibilityState === "hidden") {
      return;
    }
    clearTimeout(timeout);
    running = true;
    try {
      await onUpdate();
    } catch (error) {
      console.error("Failed to refresh polled data", error);
    } finally {
      running = false;
      if (
        !stopped &&
        document.visibilityState !== "hidden" &&
        pollInterval > 0
      ) {
        timeout = setTimeout(refresh, pollInterval);
      }
    }
  }

  function onVisibilityChange() {
    clearTimeout(timeout);
    if (document.visibilityState !== "hidden") {
      refresh();
    }
  }

  document.addEventListener("visibilitychange", onVisibilityChange);
  refresh();
  return () => {
    stopped = true;
    clearTimeout(timeout);
    document.removeEventListener("visibilitychange", onVisibilityChange);
  };
}
