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
          <Paper sx={{ p: 2 }} elevation={1}>
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
          </Paper>
        )}
      </Stack>
    </Container>
  );
}
