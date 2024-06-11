import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import GetEvents from "../components/get_events";

export default function Home() {
  const router = useRouter();
  return (
    <div>
      <br />
      <Container maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "100px" }}
        >
          <h1>
            <u>第1回 創玄杯 躰道競技大会</u>
          </h1>
        </Grid>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "60px" }}
        >
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => {
              router.push("/progress_check");
            }}
          >
            時程表
          </Button>
        </Grid>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "60px" }}
        >
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => {
              router.push("/results");
            }}
          >
            競技結果一覧
          </Button>
        </Grid>
      </Container>
    </div>
  );
}
