import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import React from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";
import { GetEventName } from "../lib/get_event_name";
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

function ShowDetails(
  item,
  block_number,
  current,
  is_mobile,
  ToCall,
  ToRecord,
  ToUpdate,
  ToFinish,
) {
  if (is_mobile) {
    return (
      <>
        <br />
        <Button
          variant="contained"
          type="submit"
          onClick={(e) => ToCall(block_number, item["id"], item["event_id"])}
          disabled={item["id"] !== current.id || !item["players_checked"]}
          sx={{ width: "5rem", marginBottom: "5px" }}
        >
          呼び出し
        </Button>
        <br />
        {item["id"] >= current.id ? (
          <>
            <Button
              variant="contained"
              type="submit"
              onClick={(e) =>
                ToRecord(block_number, item["id"], item["event_id"])
              }
              disabled={item["id"] !== current.id || !item["players_checked"]}
              sx={{ width: "5rem", marginBottom: "5px" }}
            >
              記録　
            </Button>
          </>
        ) : (
          <>
            <Button
              variant="contained"
              type="submit"
              onClick={(e) =>
                ToUpdate(block_number, item["id"], item["event_id"])
              }
              disabled={item["id"] > current.id || !item["players_checked"]}
              sx={{ width: "5rem", marginBottom: "5px" }}
            >
              結果修正
            </Button>
          </>
        )}
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

function ShowTimeTable(time_table_text, is_mobile) {
  if (is_mobile) {
    if (time_table_text) {
      const times = time_table_text.split("-");
      if (times.length == 2) {
        return (
          <>
            {times[0]}
            <br />
            -
            <br />
            {times[1]}
          </>
        );
      }
      return time_table_text;
    }
    return "";
  }
  return time_table_text;
}

function ShowGamesText(item, is_mobile) {
  if (!item["games_text"]) {
    return "";
  }
  let prefix = "";
  if (item["before_final"]) {
    prefix += "三決";
  }
  if (item["final"]) {
    prefix += "決勝";
  }
  if (prefix !== "" && !is_mobile) {
    prefix = "【" + prefix + "】";
  }
  if (is_mobile) {
    const elems = item["games_text"]?.split(",");
    if (elems) {
      return (
        <>
          {prefix}
          <br />
          {elems.map((value, index) => {
            return (
              <>
                {value}
                {index % 2 === 1 ? <br /> : <>,</>}
              </>
            );
          })}
        </>
      );
    }
  }
  return prefix + item["games_text"];
}

function Block({ block_number, update_interval, is_mobile, return_url }) {
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
    let record_url;
    if (
      GetEventName(event_id).includes("dantai_hokei") ||
      GetEventName(event_id).includes("tenkai")
    ) {
      record_url = "record_table_result";
    } else {
      record_url = "record_result";
    }
    router.push(
      return_url +
        "/" +
        record_url +
        "?block_number=" +
        block_number +
        "&schedule_id=" +
        id +
        "&event_id=" +
        event_id,
    );
  };
  const ToUpdate = (block_number, id, event_id) => {
    let check_url;
    if (
      GetEventName(event_id).includes("dantai_hokei") ||
      GetEventName(event_id).includes("tenkai")
    ) {
      check_url = "check_table_result";
    } else {
      check_url = "check_result";
    }
    router.push(
      return_url +
        "/" +
        check_url +
        "?block_number=" +
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
  const minWidth = is_mobile ? "400px" : "1000px";
  return (
    <div>
      <Container
        maxWidth="md"
        sx={{ "margin-left": "0px", "margin-right": "0px" }}
      >
        <Box style={{ minWidth: minWidth }}>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <h1>{block_number.toUpperCase()}コート</h1>
          </Grid>
          <Table border="1">
            <TableHead>
              <TableRow className={checkStyles.column}>
                <TableCell>競技</TableCell>
                <TableCell>時間</TableCell>
                <TableCell>試合{is_mobile && <br />}番号</TableCell>
                <TableCell>試合数</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((item, index) => (
                <TableRow
                  key={item["id"]}
                  className={"admin"}
                  bgcolor={item["id"] === current.id ? "#ffd54f" : "white"}
                >
                  <TableCell>{item["name"]?.replace(/['"]+/g, "")}</TableCell>
                  <TableCell>
                    {ShowTimeTable(
                      item["time_schedule"]?.replace(/['"]+/g, ""),
                      is_mobile,
                    )}
                  </TableCell>
                  <TableCell>{ShowGamesText(item, is_mobile)}</TableCell>
                  <TableCell>
                    {"game_count" in item ? item["game_count"] + "試合" : ""}
                  </TableCell>
                  <TableCell>
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
                        sx={{
                          width: "5rem",
                          marginBottom: is_mobile ? "5px" : "0px",
                        }}
                      >
                        {item["players_checked"] ? "点呼完了" : "点呼"}
                      </Button>
                    ) : (
                      <></>
                    )}
                    {is_mobile ? <></> : <>&nbsp;&nbsp;</>}
                    {item["event_id"] > 0 ? (
                      ShowDetails(
                        item,
                        block_number,
                        current,
                        is_mobile,
                        ToCall,
                        ToRecord,
                        ToUpdate,
                        ToFinish,
                      )
                    ) : (
                      <></>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
