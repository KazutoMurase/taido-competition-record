import Head from "next/head";
import { useCallback, useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Typography from "@mui/material/Typography";
import { GetLiveStream } from "../../lib/live_streams";

const UPDATE_INTERVAL_MS = 10000;

export const getServerSideProps = async (context) => {
  const stream = GetLiveStream(context.params?.court);
  return stream ? { props: { stream } } : { notFound: true };
};

export default function CourtLive({ stream }) {
  const [currentMatch, setCurrentMatch] = useState("");

  const updateCurrentMatch = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/overlay/current-match?court=${encodeURIComponent(stream.court)}`,
        { cache: "no-store" },
      );
      if (response.ok) {
        const data = await response.json();
        setCurrentMatch(data.display_text || "");
      }
    } catch (error) {
      console.error("Failed to update current match", error);
    }
  }, [stream.court]);

  useEffect(() => {
    updateCurrentMatch();
    const interval = window.setInterval(updateCurrentMatch, UPDATE_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [updateCurrentMatch]);

  const courtName = `${stream.court.toUpperCase()}コート`;
  return (
    <>
      <Head>
        <title>{courtName} ライブ配信</title>
      </Head>
      <Container maxWidth="lg" sx={{ py: 3 }}>
        <Typography variant="h4" component="h1" align="center" sx={{ mb: 2 }}>
          {courtName} ライブ配信
        </Typography>
        {currentMatch ? (
          <Typography variant="h6" align="center" sx={{ mb: 2 }}>
            {currentMatch}
          </Typography>
        ) : null}
        <Box
          sx={{
            position: "relative",
            width: "100%",
            paddingTop: "56.25%",
            backgroundColor: "black",
          }}
        >
          <Box
            component="iframe"
            src={stream.embedUrl}
            title={`${courtName} YouTubeライブ配信`}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            sx={{
              position: "absolute",
              inset: 0,
              width: "100%",
              height: "100%",
              border: 0,
            }}
          />
        </Box>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Button
            variant="outlined"
            component="a"
            href={stream.watchUrl}
            target="_blank"
            rel="noopener noreferrer"
          >
            YouTubeで開く
          </Button>
        </Box>
      </Container>
    </>
  );
}
