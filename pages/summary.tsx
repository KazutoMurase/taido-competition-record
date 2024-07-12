import React from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/router";
import GetSummary from "../components/get_summary";

const Summary: React.FC = ({}) => {
  const router = useRouter();
  const ToBack = () => {
    router.back();
  };
  // TODO: use api/get_events
  const event_ids = [1, 2, 3, 4, 12, 13, 14, 15, 16, 17];
  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80px" }}
      >
        <h1>サマリー</h1>
      </Grid>
      {event_ids.map((id) => (
        <GetSummary key={id} event_id={id} />
      ))}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80px" }}
      >
        <Button variant="contained" type="submit" onClick={(e) => ToBack()}>
          戻る
        </Button>
      </Grid>
    </>
  );
};

export default Summary;
