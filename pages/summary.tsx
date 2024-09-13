import React from "react";
import { useEffect, useState } from "react";
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
  const [data, setData] = useState([]);

  const fetchData = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    const event_infos = [];
    for (let i = 0; i < result.length; i++) {
      if (result[i]["existence"] && result[i]["name_en"] != "finished") {
        event_infos.push({
          id: result[i]["id"],
          name: result[i]["name"].replace(/['"]+/g, ""),
        });
      }
    }
    setData(event_infos);
  };
  useEffect(() => {
    fetchData();
  }, []);
  // item for MVP, etc
  const mvp_item = {
    name: "稲見 安希子",
    name_kana: "イナミ アキコ",
    group: "千葉県",
  };
  const syukun_item = {
    name: "木村 雅和",
    name_kana: "キムラ マサカズ",
    group: "愛知県",
  };
  const kantou_item = {
    name: "大越 晴斗",
    name_kana: "オオコシ ハルト",
    group: "",
  };
  const ginou_item = {
    name: "佐々木 尚希",
    name_kana: "ササキ ナオキ",
    group: "宮城県",
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
      {data.map((event_info) => (
        <GetSummary
          key={event_info.id}
          event_id={event_info.id}
          event_name={event_info.name}
          hide={hide}
        />
      ))}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "320px" }}
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
