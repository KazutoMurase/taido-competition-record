import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import FlagCircleRoundedIcon from "@mui/icons-material/FlagCircleRounded";
import SquareTwoToneIcon from "@mui/icons-material/SquareTwoTone";
import checkStyles from "../styles/checks.module.css";

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

// TODO(murase): extract from database
function ShowHokeiType(item, event_name) {
  if (event_name === "hokei_sonen" || event_name.includes("hokei_mei")) {
    return <td>{item["round"] <= 2 ? "勢命" : "命の法形"}</td>;
  } else if (event_name === "hokei_newcommer") {
    return <td>運足八法</td>;
  } else if (event_name.includes("hokei_kyuui")) {
    return <td>{"旋・運・変"}</td>;
  } else if (event_name.includes("hokei_sei")) {
    return <td>制の法形</td>;
  } else if (event_name.includes("junior_high")) {
    return <td>{item["round"] <= 2 ? "旋・運・変" : "自由法形"}</td>;
  } else if (event_name.includes("higher_grades")) {
    return <td>{item["round"] <= 2 ? "旋・運" : "旋・運・変"}</td>;
  } else if (event_name.includes("lower_grades")) {
    return <td>{item["round"] <= 2 ? "旋" : "旋・運"}</td>;
  }
  return <td>{item["round"] <= 2 ? "変体/変陰" : "自由法形"}</td>;
}

function GamesOnBlock({
  block_number,
  event_name,
  schedule_id,
  update_interval,
  is_mobile,
}) {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
    setSelectedRadioButton(event.target.value);
  };
  const router = useRouter();
  const leftLocalStateKey =
    "left_retire_states_" + block_number + "_" + schedule_id + "_" + event_name;
  const rightLocalStateKey =
    "right_retire_states_" +
    block_number +
    "_" +
    schedule_id +
    "_" +
    event_name;

  const [data, setData] = useState([]);
  const fetchData = useCallback(async () => {
    const response = await fetch(
      "/api/get_games_on_block?block_number=" +
        block_number +
        "&schedule_id=" +
        schedule_id +
        "&event_name=" +
        event_name,
    );
    const result = await response.json();
    if (result.length === 0) {
      localStorage.removeItem(leftLocalStateKey);
      localStorage.removeItem(rightLocalStateKey);
      router.push("block?block_number=" + block_number);
    }
    setData(result);
  }, [
    block_number,
    schedule_id,
    event_name,
    router,
    leftLocalStateKey,
    rightLocalStateKey,
  ]);
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
  const retireButtonStyle = {
    backgroundColor: "gray",
    fontSize: "10px",
  };

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

  const handleLeftRetireStatesChange = (id) => {
    setLeftRetireStates((prevStates) => {
      const stateExists = prevStates.some((state) => state.id === id);
      if (!stateExists) {
        return [...prevStates, { id: id, is_retired: true }];
      }
      return prevStates.map((state) =>
        state.id === id ? { ...state, is_retired: !state.is_retired } : state,
      );
    });
  };
  const handleRightRetireStatesChange = (id) => {
    setRightRetireStates((prevStates) => {
      const stateExists = prevStates.some((state) => state.id === id);
      if (!stateExists) {
        return [...prevStates, { id: id, is_retired: true }];
      }
      return prevStates.map((state) =>
        state.id === id ? { ...state, is_retired: !state.is_retired } : state,
      );
    });
  };

  const showText = (
    left_color,
    left_retire,
    left_text,
    right_retire,
    right_text,
    id,
    target_col,
  ) => {
    let target_states =
      target_col === "left" ? leftRetireStates : rightRetireStates;
    for (let i = 0; i < target_states.length; i++) {
      if (id === target_states[i].id) {
        if (target_states[i]["is_retired"]) {
          return <s>{left_color === "red" ? left_text : right_text}</s>;
        } else {
          return <span>{left_color === "red" ? left_text : right_text}</span>;
        }
      }
    }
    if (
      (left_color === "red" && left_retire) ||
      (left_color !== "red" && right_retire)
    ) {
      return <s>{left_color === "red" ? left_text : right_text}</s>;
    }
    return <span>{left_color === "red" ? left_text : right_text}</span>;
  };
  const last_order_id = data.length;
  let current_order_id = -1;
  for (let i = 0; i < data.length; i++) {
    if ("current" in data[i]) {
      current_order_id = i + 1;
      break;
    }
  }
  const minWidth = is_mobile ? "400px" : "950px";
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: minWidth }}>
          <Grid container justifyContent="flex-start" alignItems="center">
            <table border="1">
              <tbody>
                <tr className={checkStyles.column}>
                  {event_name.includes("hokei") ? <th>種類</th> : <></>}
                  <th>色</th>
                  {event_name.includes("dantai") ? <></> : <th>地区</th>}
                  {event_name.includes("dantai") ? (
                    <th>団体名</th>
                  ) : (
                    <th>選手(カナ)</th>
                  )}
                  <th>色</th>
                  {event_name.includes("dantai") ? <></> : <th>地区</th>}
                  {event_name.includes("dantai") ? (
                    <th>団体名</th>
                  ) : (
                    <th>選手(カナ)</th>
                  )}
                  {is_mobile ? (
                    <th>
                      順序
                      <br />
                      変更
                    </th>
                  ) : (
                    <th>順序変更</th>
                  )}
                  {event_name.includes("zissen") ? (
                    <th>
                      {is_mobile ? (
                        <>
                          赤<br />
                          棄権
                        </>
                      ) : (
                        "赤棄権"
                      )}
                    </th>
                  ) : (
                    <></>
                  )}
                  {event_name.includes("zissen") ? (
                    <th>
                      {is_mobile ? (
                        <>
                          白<br />
                          棄権
                        </>
                      ) : (
                        "白棄権"
                      )}
                    </th>
                  ) : (
                    <></>
                  )}
                </tr>
                {data.map((item, index) => (
                  <tr
                    key={item["id"]}
                    className={checkStyles.column}
                    bgcolor={"current" in item ? "yellow" : "white"}
                  >
                    {event_name.includes("hokei") ? (
                      ShowHokeiType(item, event_name)
                    ) : (
                      <></>
                    )}
                    <td>
                      <SquareTwoToneIcon
                        sx={{ fontSize: 30 }}
                        htmlColor={"red"}
                      />
                    </td>
                    {event_name.includes("dantai") ? (
                      <></>
                    ) : (
                      <td>
                        {item["left_color"] === "red"
                          ? item["left_group_name"]
                          : item["right_group_name"]}
                      </td>
                    )}
                    <td>
                      {is_mobile ? (
                        <>
                          <div style={{ fontSize: "15px" }}>
                            {showText(
                              item["left_color"],
                              item["left_retire"],
                              item["left_name_kana"]
                                ? item["left_name_kana"]
                                : "",
                              item["right_retire"],
                              item["right_name_kana"]
                                ? item["right_name_kana"]
                                : "",
                              item["id"],
                              "left",
                              "15px",
                            )}
                          </div>
                          {showText(
                            item["left_color"],
                            item["left_retire"],
                            item["left_name"],
                            item["right_retire"],
                            item["right_name"],
                            item["id"],
                            "left",
                          )}
                        </>
                      ) : (
                        <>
                          {showText(
                            item["left_color"],
                            item["left_retire"],
                            item["left_name"],
                            item["right_retire"],
                            item["right_name"],
                            item["id"],
                            "left",
                          )}
                          {showText(
                            item["left_color"],
                            item["left_retire"],
                            item["left_name_kana"]
                              ? "(" + item["left_name_kana"] + ")"
                              : "",
                            item["right_retire"],
                            item["right_name_kana"]
                              ? "(" + item["right_name_kana"] + ")"
                              : "",
                            item["id"],
                            "left",
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <SquareTwoToneIcon
                        sx={{ fontSize: 30 }}
                        htmlColor={"gray"}
                      />
                    </td>
                    {event_name.includes("dantai") ? (
                      <></>
                    ) : (
                      <td>
                        {item["left_color"] === "red"
                          ? item["right_group_name"]
                          : item["left_group_name"]}
                      </td>
                    )}
                    <td>
                      {is_mobile ? (
                        <>
                          <div style={{ fontSize: "15px" }}>
                            {showText(
                              item["left_color"],
                              item["right_retire"],
                              item["right_name_kana"]
                                ? item["right_name_kana"]
                                : "",
                              item["left_retire"],
                              item["left_name_kana"]
                                ? item["left_name_kana"]
                                : "",
                              item["id"],
                              "right",
                              "15px",
                            )}
                          </div>
                          {showText(
                            item["left_color"],
                            item["right_retire"],
                            item["right_name"],
                            item["left_retire"],
                            item["left_name"],
                            item["id"],
                            "right",
                          )}
                        </>
                      ) : (
                        <>
                          {showText(
                            item["left_color"],
                            item["right_retire"],
                            item["right_name"],
                            item["left_retire"],
                            item["left_name"],
                            item["id"],
                            "right",
                          )}
                          {showText(
                            item["left_color"],
                            item["right_retire"],
                            item["right_name_kana"]
                              ? "(" + item["right_name_kana"] + ")"
                              : "",
                            item["left_retire"],
                            item["left_name_kana"]
                              ? "(" + item["left_name_kana"] + ")"
                              : "",
                            item["id"],
                            "right",
                          )}
                        </>
                      )}
                    </td>
                    <td>
                      <Button
                        variant="contained"
                        type="submit"
                        size={is_mobile ? "small" : "medium"}
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
                    {event_name.includes("zissen") ? (
                      <td>
                        <Button
                          size="small"
                          style={retireButtonStyle}
                          variant="contained"
                          type="submit"
                          onClick={(e) => handleLeftRetireStatesChange(item.id)}
                        >
                          Check
                        </Button>
                      </td>
                    ) : (
                      <></>
                    )}
                    {event_name.includes("zissen") ? (
                      <td>
                        <Button
                          size="small"
                          style={retireButtonStyle}
                          variant="contained"
                          type="submit"
                          onClick={(e) =>
                            handleRightRetireStatesChange(item.id)
                          }
                        >
                          Check
                        </Button>
                      </td>
                    ) : (
                      <></>
                    )}
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

export default GamesOnBlock;
