import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import FlagCircleRoundedIcon from "@mui/icons-material/FlagCircleRounded";
import SquareTwoToneIcon from "@mui/icons-material/SquareTwoTone";
import checkStyles from "../styles/checks.module.css";
import { useRouter } from "next/router";
import { GetEventName } from "../lib/get_event_name";

function GetCourtId(block_number) {
  const code = block_number.charCodeAt(0);
  // ASCII code of 'a' is 97
  return code >= 97 && code <= 122 ? code - 96 : null;
}

function onSubmit(
  block_number,
  group_id,
  group_name,
  event_id,
  is_test,
  function_after_post,
) {
  // TODO: FIXME
  let court_id;
  if (block_number === "a") {
    court_id = 1;
  } else if (block_number === "b") {
    court_id = 2;
  } else if (block_number === "c") {
    court_id = 3;
  } else if (block_number === "d") {
    court_id = 4;
  } else if (block_number === "x") {
    court_id = 24;
  } else if (block_number === "y") {
    court_id = 25;
  }
  let post = {
    event_id: event_id,
    group_id: group_id,
    group_name: group_name,
    court_id: court_id,
    is_test: is_test,
  };
  axios
    .post("/api/create_notification_request", post)
    .then((response) => {
      function_after_post();
    })
    .catch((e) => {
      console.log(e);
    });
}

function onClear(group_id, event_id, court_id, is_test, function_after_post) {
  let post = {
    group_id: group_id,
    event_id: event_id,
    court_id: court_id,
    is_test: is_test,
  };
  axios
    .post("/api/clear_notification_request", post)
    .then((response) => {
      function_after_post();
    })
    .catch((e) => {
      console.log(e);
    });
}

function CheckTable({
  block_number,
  schedule_id,
  event_id,
  update_interval,
  is_test = false,
}) {
  const router = useRouter();
  function onBack() {
    router.push("block?block_number=" + block_number);
  }

  const [retireStates, setRetireStates] = useState([]);

  const handleRetireStatesChange = (id, is_retired) => {
    setRetireStates((prevRadios) => {
      const radioExists = prevRadios.some((radio) => radio.id === id);
      if (!radioExists) {
        return [...prevRadios, { id: id, is_retired: is_retired }];
      }
      return prevRadios.map((radio) =>
        radio.id === id ? { ...radio, is_retired: is_retired } : radio,
      );
    });
  };

  function onFinish(block_number, schedule_id, data, is_test) {
    const num_groups = data.length;
    let num_checked = 0;
    for (let i = 0; i < num_groups; i++) {
      const item = data[i];
      if (CheckState(item, true)) {
        num_checked += 1;
      }
      if (CheckState(item, false)) {
        num_checked += 1;
      }
    }
    let post = {
      schedule_id: schedule_id,
      block_number: block_number,
    };
    post["retire_array"] = retireStates;
    post["all_checked"] = num_checked === num_groups;
    post["is_test"] = is_test;
    console.log(post);
    axios
      .post("/api/complete_players_check", post)
      .then((response) => {
        console.log(response);
        router.push("block?block_number=" + block_number);
      })
      .catch((e) => {
        console.log(e);
      });
  }

  let title;

  const fetchData = useCallback(async () => {
    const response = await fetch(
      "/api/check_table_groups_on_block?block_number=" +
        block_number +
        "&schedule_id=" +
        schedule_id +
        "&event_id=" +
        event_id +
        "&is_test=" +
        is_test,
    );
    const result = await response.json();
    console.log(result);
    setData(result);
  }, [block_number, schedule_id, event_id, is_test]);

  const [data, setData] = useState([]);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, update_interval);
    fetchData();
    return () => {
      clearInterval(interval);
    };
  }, [fetchData, update_interval]);
  const forceFetchData = () => {
    fetchData();
  };

  const waitButtonStyle = {
    backgroundColor: "blue",
  };
  const activeButtonStyle = {
    backgroundColor: "purple",
  };

  function CheckState(item, is_retired) {
    for (let i = 0; i < retireStates.length; i++) {
      if (retireStates[i]["id"] === item.id) {
        return retireStates[i]["is_retired"] == is_retired;
      }
    }
    let target_int = is_retired ? 1 : 0;
    return item.retire !== null && item.retire === target_int;
  }
  const all_requested = data.all_requested?.find((elem) => {
    return (
      elem.event_id === parseInt(event_id) &&
      elem.court_id == GetCourtId(block_number)
    );
  });
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: "720px" }}>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <h2>
              <u>コート{block_number.toUpperCase()}</u>
            </h2>
          </Grid>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <h3 className={checkStyles.warn}>
              {data.items && data.items.length > 0 && "all" in data.items[0]
                ? "※全団体が表示されていますので、点呼するべき団体を確認して下さい"
                : ""}
            </h3>
          </Grid>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <Button
              variant="contained"
              type="submit"
              onClick={(e) =>
                onSubmit(
                  block_number,
                  null,
                  null,
                  event_id,
                  is_test,
                  forceFetchData,
                )
              }
              style={!all_requested ? null : activeButtonStyle}
            >
              {!all_requested ? "全体呼び出し" : "全体リクエスト済"}
            </Button>
            {GetEventName(event_id) !== "dantai" ? (
              <Button
                variant="contained"
                type="submit"
                onClick={(e) =>
                  onClear(
                    null,
                    event_id,
                    GetCourtId(block_number),
                    is_test,
                    forceFetchData,
                  )
                }
                disabled={!all_requested}
              >
                キャンセル
              </Button>
            ) : (
              <></>
            )}
          </Grid>
          <table border="1">
            <tbody>
              <tr className={checkStyles.column}>
                <th>団体名</th>
                <th>点呼完了</th>
                <th>棄権</th>
                <th></th>
                <th></th>
              </tr>
              {data.items?.map((item, index) => (
                <tr key={item["id"]} className={checkStyles.column}>
                  <td>{item["name"].replace("'", "").replace("'", "")}</td>
                  <td className={checkStyles.elem}>
                    <input
                      type="radio"
                      name={index}
                      className={checkStyles.large_checkbox}
                      checked={CheckState(item, false)}
                      onChange={() => handleRetireStatesChange(item.id, false)}
                    />
                  </td>
                  <td className={checkStyles.elem}>
                    <input
                      type="radio"
                      name={index}
                      className={checkStyles.large_checkbox}
                      checked={CheckState(item, true)}
                      onChange={() => handleRetireStatesChange(item.id, true)}
                    />
                  </td>
                  <td>
                    <Button
                      variant="contained"
                      type="submit"
                      onClick={(e) =>
                        onSubmit(
                          block_number,
                          item.id,
                          item.name,
                          event_id,
                          is_test,
                          forceFetchData,
                        )
                      }
                      style={!item["requested"] ? null : activeButtonStyle}
                    >
                      {!item["requested"] ? "　呼び出し　" : "リクエスト済"}
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="contained"
                      type="submit"
                      onClick={(e) =>
                        onClear(
                          item.id,
                          event_id,
                          GetCourtId(block_number),
                          is_test,
                          forceFetchData,
                        )
                      }
                      disabled={!item["requested"]}
                    >
                      キャンセル
                    </Button>
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
            <Button
              variant="contained"
              type="submit"
              onClick={(e) =>
                onFinish(block_number, schedule_id, data.items, is_test)
              }
            >
              決定
            </Button>
            &nbsp;&nbsp;
            <Button variant="contained" type="submit" onClick={(e) => onBack()}>
              戻る
            </Button>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}

export default CheckTable;
