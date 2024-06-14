import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import checkStyles from "../../styles/checks.module.css";
import SyncDisabledIcon from "@mui/icons-material/SyncDisabled";
import SyncIcon from "@mui/icons-material/Sync";

export const getServerSideProps = async (context) => {
  const params = { production_test: process.env.PRODUCTION_TEST };
  return {
    props: { params },
  };
};

export default function Home({ params }) {
  const router = useRouter();
  const ToBlock = (block_number) => {
    router.push("/admin/block?block_number=" + block_number);
  };
  const ToNotificationRequest = () => {
    router.push("/admin/notification_request");
  };
  const hide = params.production_test === "1";
  return (
    <div>
      <br />
      <Container maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "1vh" }}
        >
          <h1>
            <u>躰道 大会管理システム</u>
          </h1>
        </Grid>
        <br />
        <br />
        <br />
        <br />
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "1vh" }}
        >
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => ToBlock("a")}
          >
            Aコート
          </Button>
        </Grid>
        <br />
        <br />
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "1vh" }}
        >
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => ToBlock("b")}
          >
            Bコート
          </Button>
        </Grid>
        <br />
        <br />
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "1vh" }}
        >
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => ToBlock("c")}
          >
            Cコート
          </Button>
        </Grid>
        <br />
        <br />
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "1vh" }}
        >
          <br />
          <br />
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => ToBlock("d")}
          >
            Dコート
          </Button>
        </Grid>
        <br />
        <br />
        <br />
        <br />
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "1vh" }}
        >
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => ToNotificationRequest()}
          >
            司会用
          </Button>
        </Grid>
        <br />
        <br />
        <br />
        <br />
        <Grid container justifyContent="center">
          {hide ? (
            <>
              一般公開用ページへの結果反映：<b>OFF</b>
              <SyncDisabledIcon color="disabled" />
            </>
          ) : (
            <>
              一般公開用ページへの結果反映：<b>ON</b>
              <SyncIcon color="primary" />
            </>
          )}
        </Grid>
      </Container>
    </div>
  );
}
