import React from "react";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import GetEvents from "../components/get_events";

const Results: React.FC = () => {
  const router = useRouter();
  const onBack = () => {
    router.back();
  };
  return (
    <div>
      <Container maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "100px" }}
        >
          <h1>
            <u>競技結果一覧</u>
          </h1>
          <GetEvents />
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "100px" }}
          >
            <Button variant="contained" type="submit" onClick={(e) => onBack()}>
              戻る
            </Button>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Results;
