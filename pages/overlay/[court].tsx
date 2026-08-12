import Head from "next/head";
import { useRouter } from "next/router";
import { useCallback, useEffect, useState } from "react";
import styles from "../../styles/Overlay.module.css";

type CurrentMatch = {
  active: boolean;
  court_name: string;
  display_text: string;
};

const UPDATE_INTERVAL_MS = 3000;

export default function CourtOverlay() {
  const router = useRouter();
  const court = Array.isArray(router.query.court)
    ? router.query.court[0]
    : router.query.court;
  const [currentMatch, setCurrentMatch] = useState<CurrentMatch | null>(null);
  const [hasError, setHasError] = useState(false);

  const updateCurrentMatch = useCallback(async () => {
    if (!court) {
      return;
    }

    try {
      const response = await fetch(
        `/api/overlay/current-match?court=${encodeURIComponent(court)}`,
        { cache: "no-store" },
      );
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      setCurrentMatch(await response.json());
      setHasError(false);
    } catch (error) {
      // Keep the last successfully loaded text visible during a temporary outage.
      console.error("Failed to update current match overlay", error);
      setHasError(true);
    }
  }, [court]);

  useEffect(() => {
    updateCurrentMatch();
    const interval = window.setInterval(updateCurrentMatch, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [updateCurrentMatch]);

  return (
    <>
      <Head>
        <title>{currentMatch?.court_name || "コート"} 配信表示</title>
      </Head>
      <main
        className={styles.overlay}
        data-stale={hasError ? "true" : "false"}
        aria-live="polite"
      >
        <span className={styles.text}>{currentMatch?.display_text || ""}</span>
      </main>
      <style jsx global>{`
        html,
        body,
        #__next,
        .app {
          width: 100%;
          height: 100%;
          overflow: hidden;
          background: transparent !important;
        }
      `}</style>
    </>
  );
}
