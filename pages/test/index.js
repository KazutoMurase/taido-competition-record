import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import checkStyles from "../../styles/checks.module.css";

export default function Home() {
  const router = useRouter();
  const ToBlock = (block_number) => {
    router.push("/test/block?block_number=" + block_number);
  };
  const ToNotificationRequest = () => {
    router.push("/test/notification_request");
  };
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
            <u>躰道 大会管理システムテスト</u>
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
            onClick={(e) => ToBlock("x")}
          >
            Xコート
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
            onClick={(e) => ToBlock("y")}
          >
            Yコート
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
              router.push("/test/progress_check");
            }}
          >
            進行確認
          </Button>
        </Grid>
      </Container>
    </div>
  );
}
