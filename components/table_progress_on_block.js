import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";
import { FetchJson } from "../lib/fetch_json";
import { StartSseWithPolling } from "../lib/sse_with_polling";

function onMoveDown(order_id, block_number, schedule_id, function_after_post) {
  let post = {
    update_block: block_number,
    schedule_id: schedule_id,
    target_order_id: order_id,
  };
  axios
    .post("/api/change_order", post)
    .then((response) => {
      function_after_post();
    })
    .catch((e) => {
      console.log(e);
    });
}

function TableProgressOnBlock({
  block_number,
  event_name,
  schedule_id,
  update_interval,
  is_mobile,
}) {
  const router = useRouter();

  const [data, setData] = useState([]);
  const fetchData = useCallback(async () => {
    try {
      const result = await FetchJson(
        "/api/get_table_progress_on_block?block_number=" +
          block_number +
          "&schedule_id=" +
          schedule_id +
          "&event_name=" +
          event_name,
      );
      if (!Array.isArray(result)) {
        throw new Error("Invalid table progress response");
      }
      if (result.length === 0) {
        router.push("block?block_number=" + block_number);
      }
      setData(result);
    } catch (error) {
      console.error("Failed to update table progress", error);
    }
  }, [block_number, schedule_id, event_name, router]);
  useEffect(() => {
    fetchData();
    return StartSseWithPolling({
      url: "/api/result_updates?event_name=" + encodeURIComponent(event_name),
      eventName: "result-updated",
      onUpdate: fetchData,
      pollInterval: update_interval,
    });
  }, [event_name, fetchData, update_interval]);

  const forceFetchData = () => {
    fetchData();
  };
  const last_order_id = data.length;
  let current_order_id = -1;
  for (let i = 0; i < data.length; i++) {
    if ("current" in data[i]) {
      current_order_id = i + 1;
      break;
    }
  }
  const minWidth = is_mobile ? "500px" : "950px";
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: minWidth }}>
          <Grid container justifyContent="center" alignItems="center">
            <table border="1">
              <tbody>
                <tr className={checkStyles.column}>
                  <th style={{ width: "200px" }}>団体名</th>
                  {event_name === "dantai_hokei_newcommer" ? (
                    <th>選択法形</th>
                  ) : (
                    <></>
                  )}
                  <th>順序変更</th>
                </tr>
                {data.map((item, index) => (
                  <tr
                    key={item["id"]}
                    className={checkStyles.column}
                    bgcolor={"current" in item ? "yellow" : "white"}
                  >
                    <td>
                      {item["retire"] ? (
                        <s>{item["name"].replace(/['"]+/g, "")}</s>
                      ) : (
                        <span>{item["name"].replace(/['"]+/g, "")}</span>
                      )}
                    </td>
                    {event_name === "dantai_hokei_newcommer" ? (
                      <td>{item["hokei_name"]}</td>
                    ) : (
                      <></>
                    )}
                    <td>
                      <Button
                        variant="contained"
                        type="submit"
                        disabled={
                          current_order_id > item["order_id"] ||
                          last_order_id === item["order_id"]
                        }
                        onClick={(e) =>
                          onMoveDown(
                            item.order_id,
                            block_number,
                            schedule_id,
                            forceFetchData,
                          )
                        }
                      >
                        ▼
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}

export default TableProgressOnBlock;
