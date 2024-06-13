import React from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/router";
import NotificationRequest from "../../components/notification_request";

const Home = () => {
  const router = useRouter();
  const ToSummary = () => {
    router.push("/summary");
  };
  return (
    <>
      <NotificationRequest update_interval={3000} return_url="/admin" />
      <br />
      <br />
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80px" }}
      >
        <Button variant="contained" type="submit" onClick={(e) => ToSummary()}>
          サマリー
        </Button>
      </Grid>
    </>
  );
};

export default Home;
