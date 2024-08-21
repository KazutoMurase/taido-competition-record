import React from "react";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/router";
import GetSummary from "../components/get_summary";
import { ShowWinner } from "../components/show_summary";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";

export const getServerSideProps = async (context) => {
  const params = { production_test: process.env.PRODUCTION_TEST };
  return {
    props: { params },
  };
};

const Summary: React.FC<{ params }> = ({ params }) => {
  const router = useRouter();
  const ToBack = () => {
    router.back();
  };
  const hide = params.production_test === "1";
  // TODO: use api/get_events
  const event_ids = [1, 3, 2, 4, 12, 20, 24, 25, 23, 21, 22, 18, 19];
  // item for MVP, etc
  const mvp_item = {
    name: "　　　",
    name_kana: "",
    group: "",
  };
  const syukun_item = {
    name: "　　　",
    name_kana: "",
    group: "",
  };
  const kantou_item = {
    name: "　　　",
    name_kana: "",
    group: "",
  };
  const ginou_item = {
    name: "　　　",
    name_kana: "",
    group: "",
  };
  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80px" }}
      >
        <h1>サマリー</h1>
      </Grid>
      {event_ids.map((id) => (
        <GetSummary key={id} event_id={id} hide={hide} />
      ))}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "220px" }}
      >
        <table border={1} style={{ width: "400px" }}>
          <tbody>
            <tr style={{ fontSize: "12px" }}>
              <td>
                <div style={{ fontSize: "16px" }}>最高師範杯</div>
              </td>
              <td>{ShowWinner(mvp_item)}</td>
            </tr>
            <tr style={{ fontSize: "12px" }}>
              <td>
                <div style={{ fontSize: "16px" }}>殊勲賞</div>
              </td>
              <td>{ShowWinner(syukun_item)}</td>
            </tr>
            <tr style={{ fontSize: "12px" }}>
              <td>
                <div style={{ fontSize: "16px" }}>敢闘賞</div>
              </td>
              <td>{ShowWinner(kantou_item)}</td>
            </tr>
            <tr style={{ fontSize: "12px" }}>
              <td>
                <div style={{ fontSize: "16px" }}>技能賞</div>
              </td>
              <td>{ShowWinner(ginou_item)}</td>
            </tr>
          </tbody>
        </table>
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
