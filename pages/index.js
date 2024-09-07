import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Image from "next/image";

export default function Home() {
  const router = useRouter();
  const ToSummary = () => {
    router.push("/summary");
  };
  // TODO: make it optional
  const show_image = false;
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
            <u>第33回 全国社会人躰道優勝大会</u>
          </h1>
        </Grid>
        {show_image ? (
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "350px" }}
          >
            <Image src={topImage} height={300} alt="" />
          </Grid>
        ) : (
          <></>
        )}
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "60px" }}
        >
          <Button
            variant="contained"
            style={{ minWidth: "110px" }}
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
            style={{ minWidth: "110px" }}
            type="submit"
            onClick={(e) => {
              router.push("/results");
            }}
          >
            競技結果一覧
          </Button>
        </Grid>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "80px" }}
        >
          <Button
            variant="contained"
            type="submit"
            onClick={(e) => ToSummary()}
          >
            サマリー
          </Button>
        </Grid>
      </Container>
    </div>
  );
}
