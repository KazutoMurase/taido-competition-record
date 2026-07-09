import React, { useEffect, useState } from "react";
import { useRouter } from "next/router";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Grid,
  Paper,
  Stack,
} from "@mui/material";

export const getServerSideProps = async () => {
  return {
    props: {
      params: {
        competition: process.env.COMPETITION_NAME || "",
      },
    },
  };
};

export default function EditTournamentsPage({ params }) {
  const router = useRouter();
  const [events, setEvents] = useState([]);
  const [courts, setCourts] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const competition = params.competition;

  useEffect(() => {
    if (!competition) {
      setError("COMPETITION_NAME が設定されていません。");
      setLoading(false);
      return;
    }
    async function fetchEvents() {
      setLoading(true);
      setError("");
      const response = await fetch(
        `/api/edit_tournament/events?competition=${competition}`,
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "failed to load events");
      }
      setEvents(result.filter((event) => event.editable));

      const courtsResponse = await fetch("/api/get_courts");
      const courtsResult = await courtsResponse.json();
      if (!courtsResponse.ok) {
        throw new Error(courtsResult.error || "failed to load courts");
      }
      setCourts(courtsResult);
    }
    fetchEvents()
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, [competition]);

  const openEditor = (event) => {
    const path =
      event.editor_type === "table_order"
        ? "/admin/edit_table_order"
        : "/admin/edit";
    router.push(
      `${path}?competition=${competition}&event_name=${event.name_en}`,
    );
  };

  const openBlockEditor = (block) => {
    router.push(`/admin/edit_block?competition=${competition}&block=${block}`);
  };

  const courtToBlock = (court) => {
    const name = String(court.name || "").replace(/['"]+/g, "");
    return name.charAt(0).toLowerCase();
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={3}>
        <Box sx={{ textAlign: "center" }}>
          <h1>
            <u>競技編集</u>
          </h1>
        </Box>

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Alert severity="error">{error}</Alert>
        ) : events.length === 0 ? (
          <Alert severity="info">編集できるトーナメントがありません。</Alert>
        ) : (
          <Stack spacing={3}>
            <Paper sx={{ p: 2 }} elevation={1}>
              <Stack spacing={2}>
                <h2>ブロック編集</h2>
                <Grid container spacing={2}>
                  {courts.map((court) => {
                    const block = courtToBlock(court);
                    return (
                      <Grid item xs={6} sm={4} key={court.id}>
                        <Button
                          variant="outlined"
                          fullWidth
                          onClick={() => openBlockEditor(block)}
                          sx={{ minHeight: 48 }}
                        >
                          {String(court.name || "").replace(/['"]+/g, "")}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              </Stack>
            </Paper>
            <Paper sx={{ p: 2 }} elevation={1}>
              <Stack spacing={2}>
                <h2>競技編集</h2>
                <Grid container spacing={2}>
                  {events.map((event) => (
                    <Grid item xs={12} sm={6} key={event.name_en}>
                      <Button
                        variant="contained"
                        fullWidth
                        onClick={() => openEditor(event)}
                        sx={{ minHeight: 48 }}
                      >
                        {event.name || event.full_name || event.name_en}
                      </Button>
                    </Grid>
                  ))}
                </Grid>
              </Stack>
            </Paper>
          </Stack>
        )}
      </Stack>
    </Container>
  );
}
