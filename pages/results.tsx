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
          direction="column"
          alignItems="center"
          spacing={3}
          sx={{ py: 3 }}
        >
          <Grid item>
            <h1>
              <u>競技結果一覧</u>
            </h1>
          </Grid>
          <Grid item width="100%">
            <GetEvents />
          </Grid>
          <Grid item>
            <Button variant="contained" onClick={onBack}>
              戻る
            </Button>
          </Grid>
        </Grid>
      </Container>
    </div>
  );
};

export default Results;
