import React from "react";
import { useRouter } from "next/router";
import { Alert, Box } from "@mui/material";
import TournamentEditor from "../../components/tournament_editor";

export default function EditTournamentPage() {
  const router = useRouter();
  const { competition, event_name } = router.query;

  if (!router.isReady) {
    return null;
  }

  if (!competition || !event_name) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          competition と event_name を指定してください。例:
          /admin/edit?competition=2025_kid&event_name=hokei_man
        </Alert>
      </Box>
    );
  }

  return (
    <TournamentEditor
      competition={String(competition)}
      eventName={String(event_name)}
      onBackToList={() => router.push("/admin/edit_tournaments")}
    />
  );
}
