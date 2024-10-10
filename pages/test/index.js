import { useRouter } from "next/router";
import React, { useEffect, useState } from "react";
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

  const [courts, setCourts] = useState([]);
  const fetchCourts = async () => {
    const response = await fetch("/api/get_courts?is_test=true");
    const result = await response.json();
    setCourts(result);
  };
  useEffect(() => {
    fetchCourts();
  }, []);

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
        {courts.map((item, index) => {
          return (
            <>
              <Grid
                container
                justifyContent="center"
                alignItems="center"
                style={{ height: "1vh" }}
              >
                <Button
                  variant="contained"
                  type="submit"
                  onClick={(e) => ToBlock(item.name[1].toLowerCase())}
                >
                  {item.name.replace(/['"]+/g, "")}
                </Button>
              </Grid>
              <br />
              <br />
            </>
          );
        })}
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
      </Container>
    </div>
  );
}
