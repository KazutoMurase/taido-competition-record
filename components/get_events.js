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
  const events = data.filter((item) => {
    const event_name = GetEventName(item["id"]);
    return event_name !== "dantai" && item["existence"];
  });

  return (
    <Grid container spacing={2}>
      {events.map((item) => {
        const event_name = GetEventName(item["id"]);
        return (
          <Grid
            key={item["id"]}
            item
            xs={6}
            display="flex"
            justifyContent="center"
          >
            <Button
              variant="contained"
              fullWidth
              sx={{ maxWidth: "280px" }}
              onClick={() => ToResult(event_name)}
            >
              {item["name"].replace("'", "").replace("'", "")}
            </Button>
          </Grid>
        );
      })}
    </Grid>
  );
}

export default GetEvents;
