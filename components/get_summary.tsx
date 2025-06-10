import React from "react";
import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Summary from "./show_summary";
import { GetEventName } from "../lib/get_event_name";

const GetSummary: React.FC<{
  event_id: number;
  event_name: string;
  event_name_en: string;
  hide: boolean;
}> = ({ event_id, event_name, event_name_en, hide }) => {
  const [data, setData] = useState({});
  useEffect(() => {
    async function fetchData() {
      if (
        event_name_en.includes("dantai_hokei") ||
        event_name_en.includes("tenkai")
      ) {
        let winners = {};
        const response = await fetch(
          "/api/get_table_result?event_name=" + event_name_en,
        );
        const result = await response.json();
        let final_num = 0;
        let final_finished_num = 0;
        for (let i = 0; i < result.length; i++) {
          if (result[i].is_final) {
            final_num += 1;
            if (result[i]["sum_score"] || result[i]["retire"]) {
              final_finished_num += 1;
            }
          }
        }
        if (final_num === final_finished_num) {
          for (let i = 0; i < result.length; i++) {
            if (result[i].is_final && result[i].rank) {
              winners[result[i].rank] = {
                id: result[i].id,
                group: result[i].name,
              };
            }
          }
        }
        setData(winners);
      } else {
        const response = await fetch(
          "/api/get_winners?event_name=" + event_name_en,
        );
        const result = await response.json();
        setData(result);
      }
    }
    if (!hide) {
      fetchData();
    }
  }, [event_name_en, hide]);
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
        {event_name}
      </Grid>
      <Summary winners={data} />
    </>
  );
};

export default GetSummary;
