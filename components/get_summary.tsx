import React from "react";
import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Summary from "./show_summary";
import { GetEventName } from "../lib/get_event_name";

// TODO: 実大会競技名が固まったら別ファイルにMap作成
const test_event_id_vs_event_name: Map<number, string> = new Map([
  [0, "全日程終了"],
  [1, "男子個人実戦"],
  [2, "男子個人法形"],
  [3, "女子個人実戦"],
  [4, "女子個人法形"],
  [5, "壮年法形"],
  [6, "女子団体実戦"],
  [7, "男子団体実戦"],
  [8, "男子団体法形"],
  [9, "女子団体法形"],
  [10, "男子団体展開"],
  [11, "女子団体展開"],
  [12, "個人法形　新人"],
  [13, "男子級位個人実戦"],
  [14, "男子級位個人法形"],
  [15, "女子級位個人実戦"],
  [16, "女子級位個人法形"],
  [17, "団体実戦"],
  [18, "団体法形"],
  [19, "団体展開"],
  [20, "個人法形　級位"],
  [21, "壮年実戦　男子"],
  [22, "壮年実戦　女子"],
  [23, "個人法形　制の法形"],
  [24, "命法形（有段者）"],
  [25, "命法形（新人級位）"],
]);

const GetSummary: React.FC<{ event_id: number }> = ({ event_id }) => {
  const [data, setData] = useState([]);
  const event_name = GetEventName(event_id);
  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/get_winners?event_name=" + event_name);
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, [event_name]);
  if (!data) {
    return <></>;
  }
  return (
    <>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "30px" }}
      >
        {test_event_id_vs_event_name.get(event_id)}
      </Grid>
      <Summary winners={data} />
    </>
  );
};

export default GetSummary;
