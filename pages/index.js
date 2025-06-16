import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Image from "next/image";
import topImage from "../public/top.jpeg";

export const getServerSideProps = async () => {
  const competitionTitle = process.env.COMPETITION_TITLE;
  const show_total = process.env.SHOW_TOTAL_IN_PUBLIC === "1";
  return {
    props: {
      competitionTitle,
      show_total,
    },
  };
};

export default function Home({ competitionTitle, show_total }) {
  const router = useRouter();
  const ToSummary = () => {
    router.push("/summary");
  };
  const ToTotal = () => {
    router.push("/total");
  };
  // TODO: make it optional
  const show_image = true;
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
            <u>{competitionTitle}</u>
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
        {show_total ? (
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "40px" }}
          >
            <Button
              variant="contained"
              type="submit"
              onClick={(e) => ToTotal()}
            >
              総合得点表
            </Button>
          </Grid>
        ) : (
          <></>
        )}
      </Container>
    </div>
  );
}
