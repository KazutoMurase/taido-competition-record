import React from "react";
import { useEffect, useState } from "react";
import Grid from "@mui/material/Grid";
import Summary from "./show_summary";
import { GetEventName } from "../lib/get_event_name";

const GetSummary: React.FC<{
  event_id: number;
  event_name: string;
  hide: boolean;
}> = ({ event_id, event_name, hide }) => {
  const [data, setData] = useState({});
  useEffect(() => {
    async function fetchData() {
      if (
        event_name.includes("dantai_hokei") ||
        event_name.includes("tenkai")
      ) {
        let winners = {};
        const response = await fetch(
          "/api/get_table_result?event_name=" + event_name,
        );
        const result = await response.json();
        for (let i = 0; i < result.length; i++) {
          if (result[i].rank) {
            winners[result[i].rank] = {
              id: result[i].id,
              group: result[i].name,
            };
          }
        }
        setData(winners);
      } else {
        const response = await fetch(
          "/api/get_winners?event_name=" + event_name,
        );
        const result = await response.json();
        setData(result);
      }
    }
    if (!hide) {
      fetchData();
    }
  }, [event_name, hide]);
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
