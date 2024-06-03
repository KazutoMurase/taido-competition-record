import React from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import GetEvents from "../components/get_events";

const Results: React.FC = () => {
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
        </Grid>
      </Container>
    </div>
  );
};

export default Results;
