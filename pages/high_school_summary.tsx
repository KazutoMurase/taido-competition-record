import React from "react";
import { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/router";
import GetSummary from "../components/get_summary";
import GetAwardedPlayers from "../components/get_awarded_players";
import { ShowWinner } from "../components/show_summary";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";

export const getServerSideProps = async (context) => {
  const params = {
    production_test: process.env.PRODUCTION_TEST,
    show_award_in_public: process.env.SHOW_AWARD_IN_PUBLIC,
  };
  return {
    props: { params },
  };
};

const Summary: React.FC<{ params }> = ({ params }) => {
  const router = useRouter();
  const ToBack = () => {
    router.back();
  };
  const { from_admin } = router.query;
  const hide = params.production_test === "1" && !from_admin;
  const hide_award =
    (params.production_test === "1" || params.show_award_in_public === "0") &&
    !from_admin;
  const [data, setData] = useState([]);

  const fetchData = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    const event_infos = [];
    for (let i = 0; i < result.length; i++) {
      if (
        result[i]["name"].includes("高校") &&
        result[i]["existence"] &&
        result[i]["name_en"] != "finished"
      ) {
        event_infos.push({
          id: result[i]["id"],
          full_name: result[i]["full_name"].replace(/['"]+/g, ""),
          name: result[i]["name"].replace(/['"]+/g, ""),
          name_en: result[i]["name_en"].replace(/['"]+/g, ""),
        });
      }
    }
    setData(event_infos);
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80px" }}
      >
        <h1>高校生サマリー</h1>
      </Grid>
      {data.map((event_info) => (
        <GetSummary
          key={event_info.id}
          event_id={event_info.id}
          event_name={event_info.full_name}
          event_name_en={event_info.name_en}
          hide={hide}
        />
      ))}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "320px" }}
      >
        <GetAwardedPlayers hide={hide_award} is_high_school_result={true} />
      </Grid>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80px" }}
      >
        <Button variant="contained" type="submit" onClick={(e) => ToBack()}>
          戻る
        </Button>
      </Grid>
    </>
  );
};

export default Summary;
