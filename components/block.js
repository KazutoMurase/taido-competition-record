import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";

function ShowDetails(
  item,
  block_number,
  current,
  ToCall,
  ToRecord,
  ToUpdate,
  ToFinish,
) {
  if (item["name"].includes("団体")) {
    return (
      <>
        &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp;
        &nbsp;&nbsp;
        <Button
          variant="contained"
          type="submit"
          onClick={(e) => ToFinish(item["id"], block_number)}
          disabled={item["id"] !== current.id || !item["players_checked"]}
        >
          競技終了
        </Button>
        &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp; &nbsp;&nbsp;
        &nbsp;&nbsp; &nbsp;&nbsp;
      </>
    );
  }
  return (
    <>
      <Button
        variant="contained"
        type="submit"
        onClick={(e) => ToCall(block_number, item["id"], item["event_id"])}
        disabled={item["id"] !== current.id || !item["players_checked"]}
      >
        呼び出し
      </Button>
      &nbsp;&nbsp;
      <Button
        variant="contained"
        type="submit"
        onClick={(e) => ToRecord(block_number, item["id"], item["event_id"])}
        disabled={item["id"] !== current.id || !item["players_checked"]}
      >
        記録
      </Button>
      &nbsp;&nbsp;
      <Button
        variant="contained"
        type="submit"
        onClick={(e) => ToUpdate(block_number, item["id"], item["event_id"])}
        disabled={item["id"] > current.id || !item["players_checked"]}
      >
        結果修正
      </Button>
    </>
  );
}

function ShowGamesText(item) {
  let prefix = "";
  if (item["before_final"]) {
    prefix += "三決";
  }
  if (item["final"]) {
    prefix += "決勝";
  }
  if (prefix !== "") {
    prefix = "【" + prefix + "】";
  }
  if (item["name"].includes("団体展開") || item["name"].includes("団体法形")) {
    return prefix + "";
  }
  return prefix + item["games_text"];
}

function Block({ block_number, update_interval, return_url }) {
  const router = useRouter();
  const ToCheck = (block_number, id, name, event_id) => {
    router.push(
      return_url +
        "/check_players_on_block?block_number=" +
        block_number +
        "&schedule_id=" +
        id +
        "&event_id=" +
        event_id,
    );
  };
  const ToCall = (block_number, id, event_id) => {
    router.push(
      return_url +
        "/games_on_block?block_number=" +
        block_number +
        "&schedule_id=" +
        id +
        "&event_id=" +
        event_id,
    );
  };
  const ToRecord = (block_number, id, event_id) => {
    router.push(
      return_url +
        "/record_result?block_number=" +
        block_number +
        "&schedule_id=" +
        id +
        "&event_id=" +
        event_id,
    );
  };
  const ToUpdate = (block_number, id, event_id) => {
    router.push(
      return_url +
        "/check_result?block_number=" +
        block_number +
        "&schedule_id=" +
        id +
        "&event_id=" +
        event_id,
    );
  };
  const ToBack = () => {
    router.push(return_url);
  };
  const [data, setData] = useState([]);
  const [current, setCurrent] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        "/api/get_time_schedule?block_number=" + block_number,
      );
      const result = await response.json();
      setData(result);
    }
    const interval = setInterval(() => {
      fetchData();
    }, update_interval);
    fetchData();
    return () => {
      clearInterval(interval);
    };
  }, [block_number, update_interval]);

  const fetchCurrent = useCallback(async () => {
    const response = await fetch(
      "/api/current_schedule?block_number=" + block_number,
    );
    const result = await response.json();
    setCurrent(result);
  }, [block_number]);
  const forceFetchCurrent = () => {
    fetchCurrent();
  };
  const ToFinish = (id, block_number) => {
    let post = { id: id, update_block: block_number };
    axios
      .post("/api/complete_schedule", post)
      .then((response) => {
        forceFetchCurrent();
      })
      .catch((e) => {
        console.log(e);
      });
  };
  useEffect(() => {
    const interval = setInterval(() => {
      fetchCurrent();
    }, update_interval);
    fetchCurrent();
    return () => {
      clearInterval(interval);
    };
  }, [fetchCurrent, update_interval]);
  const doneButtonStyle = {
    backgroundColor: "purple",
  };
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: "840px" }}>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <h1>{block_number.toUpperCase()}コート</h1>
          </Grid>
          <table border="1">
            <tbody>
              <tr className={checkStyles.column}>
                <th>競技</th>
                <th>時間</th>
                <th>試合番号</th>
                <th>試合数</th>
                <th></th>
              </tr>
              {data.map((item, index) => (
                <tr
                  key={item["id"]}
                  className={checkStyles.column}
                  bgcolor={item["id"] === current.id ? "yellow" : "white"}
                >
                  <td>{item["name"].replace("'", "").replace("'", "")}</td>
                  <td>
                    {item["time_schedule"].replace("'", "").replace("'", "")}
                  </td>
                  <td>{ShowGamesText(item)}</td>
                  <td>
                    {"game_count" in item ? item["game_count"] + "試合" : ""}
                  </td>
                  <td>
                    {item["event_id"] > 0 ? (
                      <Button
                        variant="contained"
                        type="submit"
                        onClick={(e) =>
                          ToCheck(
                            block_number,
                            item["id"],
                            item["name"],
                            item["event_id"],
                          )
                        }
                        style={item["players_checked"] ? doneButtonStyle : null}
                      >
                        {item["players_checked"] ? "点呼完了" : "　点呼　"}
                      </Button>
                    ) : (
                      <></>
                    )}
                    &nbsp;&nbsp;
                    {item["event_id"] > 0 ? (
                      ShowDetails(
                        item,
                        block_number,
                        current,
                        ToCall,
                        ToRecord,
                        ToUpdate,
                        ToFinish,
                      )
                    ) : (
                      <></>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "100px" }}
          >
            <Button variant="contained" type="submit" onClick={(e) => ToBack()}>
              戻る
            </Button>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}

export default Block;
