import React from "react";
import { useRouter } from "next/router";
import { Alert, Box } from "@mui/material";
import BlockScheduleEditor from "../../components/block_schedule_editor";

export const getServerSideProps = async () => {
  return {
    props: {
      params: {
        competition: process.env.COMPETITION_NAME || "",
      },
    },
  };
};

export default function EditBlockPage({ params }) {
  const router = useRouter();
  const { competition, block } = router.query;
  const effectiveCompetition = competition || params.competition;

  if (!router.isReady) {
    return null;
  }

  if (!effectiveCompetition || !block) {
    return (
      <Box sx={{ p: 2 }}>
        <Alert severity="info">
          competition と block を指定してください。例:
          /admin/edit_block?competition=2025_kid&block=a
        </Alert>
      </Box>
    );
  }

  return (
    <BlockScheduleEditor
      competition={String(effectiveCompetition)}
      block={String(block).toLowerCase()}
      onBackToList={() => router.push("/admin/edit_tournaments")}
    />
  );
}
