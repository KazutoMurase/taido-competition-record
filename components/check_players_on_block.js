import { useCallback, useEffect, useState } from "react";
import axios from "axios";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FlagCircleRoundedIcon from "@mui/icons-material/FlagCircleRounded";
import SquareTwoToneIcon from "@mui/icons-material/SquareTwoTone";
import checkStyles from "../styles/checks.module.css";
import { useRouter } from "next/router";
import { GetCourtId } from "../lib/get_court_id";

function onSubmit(id, block_number, event_id, is_test, function_after_post) {
  const court_id = GetCourtId(block_number);
  let post = {
    event_id: event_id,
    player_id: id,
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

function onClear(player_id, event_id, court_id, is_test, function_after_post) {
  let post = {
    player_id: player_id,
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

function CheckPlayers({
  block_number,
  schedule_id,
  event_id,
  update_interval,
  is_mobile,
  is_test = false,
}) {
  const router = useRouter();
  const leftLocalStateKey =
    "left_retire_states_" + block_number + "_" + schedule_id + "_" + event_id;
  const rightLocalStateKey =
    "right_retire_states_" + block_number + "_" + schedule_id + "_" + event_id;
  function onBack() {
    localStorage.removeItem(leftLocalStateKey);
    localStorage.removeItem(rightLocalStateKey);
    router.push("block?block_number=" + block_number);
  }

  const [leftRetireStates, setLeftRetireStates] = useState([]);
  const [rightRetireStates, setRightRetireStates] = useState([]);
  const [getLocalState, setGetLocalState] = useState(false);
  useEffect(() => {
    const localLeftRetireStates = localStorage.getItem(leftLocalStateKey);
    if (localLeftRetireStates) {
      setLeftRetireStates(JSON.parse(localLeftRetireStates));
    }
    const localRightRetireStates = localStorage.getItem(rightLocalStateKey);
    if (localRightRetireStates) {
      setRightRetireStates(JSON.parse(localRightRetireStates));
    }
    setGetLocalState(true);
  }, [leftLocalStateKey, rightLocalStateKey]);

  useEffect(() => {
    if (getLocalState) {
      localStorage.setItem(leftLocalStateKey, JSON.stringify(leftRetireStates));
    }
  }, [getLocalState, leftRetireStates, leftLocalStateKey]);

  useEffect(() => {
    if (getLocalState) {
      localStorage.setItem(
        rightLocalStateKey,
        JSON.stringify(rightRetireStates),
      );
    }
  }, [getLocalState, rightRetireStates, rightLocalStateKey]);

  const handleLeftRetireStatesChange = (id, is_retired) => {
    setLeftRetireStates((prevRadios) => {
      const radioExists = prevRadios.some((radio) => radio.id === id);
      if (!radioExists) {
        return [...prevRadios, { id: id, is_retired: is_retired }];
      }
      return prevRadios.map((radio) =>
        radio.id === id ? { ...radio, is_retired: is_retired } : radio,
      );
    });
  };
  const handleRightRetireStatesChange = (id, is_retired) => {
    setRightRetireStates((prevRadios) => {
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
    localStorage.removeItem(leftLocalStateKey);
    localStorage.removeItem(rightLocalStateKey);
    const num_players = data.length;
    let num_checked = 0;
    for (let i = 0; i < num_players; i++) {
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
      left_retire_array: leftRetireStates,
      right_retire_array: rightRetireStates,
      all_checked: num_checked === num_players,
      is_test: is_test,
    };
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
      "/api/check_players_on_block?block_number=" +
        block_number +
        "&schedule_id=" +
        schedule_id +
        "&event_id=" +
        event_id +
        "&is_test=" +
        is_test,
    );
    const result = await response.json();
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
    if (item.is_left) {
      for (let i = 0; i < leftRetireStates.length; i++) {
        if (leftRetireStates[i]["id"] === item.game_id) {
          return leftRetireStates[i]["is_retired"] == is_retired;
        }
      }
    } else {
      for (let i = 0; i < rightRetireStates.length; i++) {
        if (rightRetireStates[i]["id"] === item.game_id) {
          return rightRetireStates[i]["is_retired"] == is_retired;
        }
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
  const minWidth = is_mobile ? "200px" : "720px";
  const squareColorFontSize = is_mobile ? 30 : 60;
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: minWidth }}>
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
            <Button
              variant="contained"
              type="submit"
              onClick={(e) =>
                onSubmit(null, block_number, event_id, is_test, forceFetchData)
              }
              style={!all_requested ? null : activeButtonStyle}
            >
              {!all_requested ? "全体呼び出し" : "全体リクエスト済"}
            </Button>
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
          </Grid>
          <table border="1">
            <tbody>
              <tr className={checkStyles.column}>
                <th>色</th>
                <th>選手名</th>
                {is_mobile ? (
                  <th>
                    点呼
                    <br />
                    完了
                  </th>
                ) : (
                  <th>点呼完了</th>
                )}
                <th>棄権</th>
                <th></th>
                {is_mobile ? <></> : <th></th>}
              </tr>
              {data.items?.map((item, index) => (
                <tr key={item["id"]} className={checkStyles.column}>
                  <td>
                    <SquareTwoToneIcon
                      sx={{ fontSize: squareColorFontSize }}
                      htmlColor={item["color"] === "red" ? "red" : "gray"}
                    />
                  </td>
                  <td>
                    {is_mobile ? (
                      <>
                        <div style={{ fontSize: "15px" }}>
                          {item["name_kana"]}
                        </div>
                        {item["name"]}
                      </>
                    ) : (
                      item["name"] + "(" + item["name_kana"] + ")"
                    )}
                  </td>
                  <td className={checkStyles.elem}>
                    <input
                      type="radio"
                      name={index}
                      className={checkStyles.large_checkbox}
                      checked={CheckState(item, false)}
                      onChange={() =>
                        item.is_left
                          ? handleLeftRetireStatesChange(item.game_id, false)
                          : handleRightRetireStatesChange(item.game_id, false)
                      }
                    />
                  </td>
                  <td className={checkStyles.elem}>
                    <input
                      type="radio"
                      name={index}
                      className={checkStyles.large_checkbox}
                      checked={CheckState(item, true)}
                      onChange={() =>
                        item.is_left
                          ? handleLeftRetireStatesChange(item.game_id, true)
                          : handleRightRetireStatesChange(item.game_id, true)
                      }
                    />
                  </td>
                  {is_mobile ? (
                    <td>
                      <Button
                        size="small"
                        variant="contained"
                        type="submit"
                        onClick={(e) =>
                          onSubmit(
                            item.id,
                            block_number,
                            event_id,
                            is_test,
                            forceFetchData,
                          )
                        }
                        style={!item["requested"] ? null : activeButtonStyle}
                      >
                        {!item["requested"] ? "　呼び出し　" : "リクエスト済"}
                      </Button>
                      <br />
                      <Button
                        variant="contained"
                        type="submit"
                        onClick={(e) =>
                          onClear(item.id, null, null, is_test, forceFetchData)
                        }
                        disabled={!item["requested"]}
                      >
                        キャンセル
                      </Button>
                    </td>
                  ) : (
                    <>
                      <td>
                        <Button
                          variant="contained"
                          type="submit"
                          onClick={(e) =>
                            onSubmit(
                              item.id,
                              block_number,
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
                              null,
                              null,
                              is_test,
                              forceFetchData,
                            )
                          }
                          disabled={!item["requested"]}
                        >
                          キャンセル
                        </Button>
                      </td>
                    </>
                  )}
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

export default CheckPlayers;
