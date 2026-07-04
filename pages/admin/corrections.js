import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";

export default function Corrections() {
  const router = useRouter();
  const [courts, setCourts] = useState([]);

  const fetchCourts = async () => {
    const response = await fetch("/api/get_courts");
    const result = await response.json();
    setCourts(result);
  };

  useEffect(() => {
    fetchCourts();
  }, []);

  const toBlockCorrection = (blockNumber) => {
    router.push(
      "/admin/block?block_number=" + blockNumber + "&correction=true",
    );
  };

  const toAdmin = () => {
    router.push("/admin");
  };

  return (
    <div>
      <br />
      <Container maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "80px" }}
        >
          <h1>
            <u>進行調整</u>
          </h1>
        </Grid>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "40px" }}
        >
          コート別の現在競技・競技順を調整します
        </Grid>
        <br />
        <br />
        {courts.map((item) => {
          const courtName = item.name.replace(/['"]+/g, "");
          const blockNumber = item.name[1].toLowerCase();
          return (
            <React.Fragment key={item.id}>
              <Grid
                container
                justifyContent="center"
                alignItems="center"
                style={{ height: "50px" }}
              >
                <Button
                  variant="contained"
                  type="submit"
                  onClick={(e) => toBlockCorrection(blockNumber)}
                >
                  {courtName} 進行調整
                </Button>
              </Grid>
              <br />
            </React.Fragment>
          );
        })}
        <br />
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "80px" }}
        >
          <Button variant="outlined" type="submit" onClick={(e) => toAdmin()}>
            戻る
          </Button>
        </Grid>
      </Container>
    </div>
  );
}
