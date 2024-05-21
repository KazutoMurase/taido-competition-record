import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import { GetEventName } from "../lib/get_event_name";

function GetEvents() {
  const router = useRouter();
  const ToResult = (event_name) => {
    router.push("/results/" + event_name);
  };

  const [data, setData] = useState([]);

  const fetchData = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    setData(result);
  };
  useEffect(() => {
    fetchData();
  }, []);

  const events = data.map((item, index) => {
    const event_name = GetEventName(item["id"]);
    // TODO: event_type テーブルに existence を追加して、existence が 1 のもののみ表示する
    if (event_name === "dantai" || !item["existence"]) {
      return <></>;
    }
    return (
      <Grid
        key={index}
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "60px" }}
      >
        <Button
          variant="contained"
          type="submit"
          onClick={(e) => ToResult("zissen_man")}
        >
          {item["name"].replace("'", "").replace("'", "")}
        </Button>
      </Grid>
    );
  });

  return events;
}

export default GetEvents;
