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

function onSubmit(id, block_number, event_id, is_test, function_after_post) {
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
    court_id = 100;
  } else if (block_number === "y") {
    court_id = 101;
  }
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

function onClear(id, is_test, function_after_post) {
  let post = { player_id: id, is_test: is_test };
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
  is_test = false,
}) {
  const router = useRouter();
  function onBack() {
    router.push("block?block_number=" + block_number);
  }

  const [leftRetireStates, setLeftRetireStates] = useState([]);
  const [rightRetireStates, setRightRetireStates] = useState([]);

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
            <Button
              variant="contained"
              type="submit"
              onClick={(e) =>
                onSubmit(null, block_number, event_id, is_test, forceFetchData)
              }
            >
              全体呼び出し
            </Button>
          </Grid>
          <table border="1">
            <tbody>
              <tr className={checkStyles.column}>
                <th>色</th>
                <th>選手名</th>
                <th>点呼完了</th>
                <th>棄権</th>
                <th></th>
                <th></th>
              </tr>
              {data.map((item, index) => (
                <tr key={item["id"]} className={checkStyles.column}>
                  <td>
                    <SquareTwoToneIcon
                      sx={{ fontSize: 60 }}
                      htmlColor={item["color"] === "red" ? "red" : "gray"}
                    />
                  </td>
                  <td>
                    {item["name"]}({item["name_kana"]})
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
                      onClick={(e) => onClear(item.id, is_test, forceFetchData)}
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
                onFinish(block_number, schedule_id, data, is_test)
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
