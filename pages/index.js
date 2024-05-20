import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";
import GetEvents from "../components/get_events";

export default function Home() {
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
            <u>躰道 第56回全日本大会 個人競技速報</u>
          </h1>
        </Grid>
        <GetEvents />
      </Container>
    </div>
  );
}
