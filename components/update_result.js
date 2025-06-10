import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Box from "@mui/material/Box";
import FlagCircleRoundedIcon from "@mui/icons-material/FlagCircleRounded";

function ShowRedFlags(event_name, selectedRadioButton, fontSize) {
  const flag = parseInt(selectedRadioButton);
  if (event_name.includes("hokei")) {
    if (flag === 4) {
      return <></>;
    }
    return (
      <>
        {flag >= 1 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="red" />
        ) : null}
        {flag >= 2 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="red" />
        ) : null}
        {flag >= 3 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="red" />
        ) : null}
      </>
    );
  } else if (event_name.includes("zissen")) {
    return (
      <>
        <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="white" />
        {flag === 0 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="red" />
        ) : null}
      </>
    );
  }
}

function ShowWhiteFlags(event_name, selectedRadioButton, fontSize) {
  const flag = parseInt(selectedRadioButton);
  if (event_name.includes("hokei")) {
    if (flag === -1 || flag === -2) {
      return <></>;
    }
    return (
      <>
        {flag <= 0 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="gray" />
        ) : null}
        {flag <= 1 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="gray" />
        ) : null}
        {flag <= 2 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="gray" />
        ) : null}
      </>
    );
  } else if (event_name.includes("zissen")) {
    return (
      <>
        <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="white" />
        {flag === 1 ? (
          <FlagCircleRoundedIcon sx={{ fontSize: fontSize }} htmlColor="gray" />
        ) : null}
      </>
    );
  }
}

function ShowLeftName(data, is_dantai) {
  const flag = parseInt(
    is_dantai ? data.left_group_flag : data.left_player_flag,
  );
  if (flag === -1 || flag === -2) {
    return <s>{data.left_name}</s>;
  } else {
    return <span>{data.left_name}</span>;
  }
}

function ShowRightName(data, is_dantai) {
  const flag = parseInt(
    is_dantai ? data.left_group_flag : data.left_player_flag,
  );
  if (flag === 4 || flag === -2) {
    return <s>{data.right_name}</s>;
  } else {
    return <span>{data.right_name}</span>;
  }
}

function UpdateResult({ event_name, id, is_mobile, return_url }) {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
    setSelectedRadioButton(event.target.value);
  };

  const [data, setData] = useState([]);

  useEffect(() => {
    async function fetchData() {
      if (id !== undefined) {
        console.log(id);
        const response = await fetch(
          "/api/get_game?event_name=" + event_name + "&id=" + id,
        );
        const result = await response.json();
        const left_flag = event_name.includes("dantai")
          ? result.left_group_flag
          : result.left_player_flag;
        if (left_flag !== undefined && left_flag !== null) {
          if (result.left_color === "red") {
            if (event_name.includes("hokei")) {
              setSelectedRadioButton(left_flag);
            } else if (event_name.includes("zissen")) {
              setSelectedRadioButton(1 - left_flag);
            }
          } else {
            if (event_name.includes("hokei")) {
              setSelectedRadioButton(3 - left_flag);
            } else if (event_name.includes("zissen")) {
              setSelectedRadioButton(left_flag);
            }
          }
        }
        setData(result);
      }
    }
    fetchData();
  }, [id, event_name]);
  const router = useRouter();
  const onBack = () => {
    router.push("/" + return_url);
  };
  const onSubmit = (data, flag, event_name) => {
    let left_flag;
    if (flag === -2) {
      left_flag = -2;
    } else if (event_name.includes("hokei")) {
      left_flag = data.left_color === "white" ? 3 - flag : flag;
    } else if (event_name.includes("zissen")) {
      left_flag = data.left_color === "white" ? flag : 1 - flag;
    }
    let post = {
      id: data.id,
      event_name: event_name,
    };
    if (event_name.includes("dantai")) {
      post["left_group_flag"] = left_flag;
    } else {
      post["left_player_flag"] = left_flag;
    }
    const left_id = event_name.includes("dantai")
      ? data.left_group_id
      : data.left_player_id;
    const right_id = event_name.includes("dantai")
      ? data.right_group_id
      : data.right_player_id;
    const next_id_name = event_name.includes("dantai")
      ? "next_group_id"
      : "next_player_id";
    if (left_flag === -2) {
      post[next_id_name] = null;
    } else if (event_name.includes("hokei")) {
      if (parseInt(left_flag) > 1) {
        post[next_id_name] = left_id;
        post["loser_id"] = right_id;
      } else {
        post[next_id_name] = right_id;
        post["loser_id"] = left_id;
      }
    } else if (event_name.includes("zissen")) {
      if (parseInt(left_flag) > 0) {
        post[next_id_name] = left_id;
        post["loser_id"] = right_id;
      } else {
        post[next_id_name] = right_id;
        post["loser_id"] = left_id;
      }
    }
    if (data.next_left_id !== null) {
      post["next_id"] = data.next_left_id;
      post["next_type"] = "left";
    } else {
      post["next_id"] = data.next_right_id;
      post["next_type"] = "right";
    }
    axios
      .post("/api/record", post)
      .then((response) => {
        console.log(response);
        router.push("/" + return_url);
      })
      .catch((e) => {
        console.log(e);
      });
  };

  let no_game_red_winner;
  let no_game_white_winner;
  if (event_name.includes("hokei")) {
    no_game_red_winner = 4;
    no_game_white_winner = -1;
  } else if (event_name.includes("zissen")) {
    no_game_red_winner = -1;
    no_game_white_winner = 2;
  }
  const minWidth = is_mobile ? "250px" : "850px";
  const flagFontSize = is_mobile ? 50 : 60;
  return (
    <div>
      <Container maxWidth="md">
        <Box
          textAlign={is_mobile ? "center" : "left"}
          style={{ minWidth: minWidth }}
        >
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <h2>第{data.id}試合</h2>
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
              onClick={(e) => onSubmit(data, -2, event_name)}
              style={{ backgroundColor: "gray" }}
            >
              両者棄権
            </Button>
          </Grid>
          <Grid container>
            <Grid item xs={is_mobile ? 0 : 3} />
            <Grid item xs={is_mobile ? 6 : 4} style={{ height: "220px" }}>
              <Button
                variant="contained"
                type="submit"
                onClick={(e) => onSubmit(data, no_game_red_winner, event_name)}
              >
                赤不戦勝
              </Button>
              {is_mobile ? (
                <h2>
                  {data.left_color === "white"
                    ? ShowRightName(data, event_name.includes("dantai"))
                    : ShowLeftName(data, event_name.includes("dantai"))}
                </h2>
              ) : (
                <h1>
                  {data.left_color === "white"
                    ? ShowRightName(data, event_name.includes("dantai"))
                    : ShowLeftName(data, event_name.includes("dantai"))}
                </h1>
              )}
              {ShowRedFlags(event_name, selectedRadioButton, flagFontSize)}
            </Grid>
            <Grid item xs={is_mobile ? 6 : 4} style={{ height: "220px" }}>
              <Button
                variant="contained"
                type="submit"
                onClick={(e) =>
                  onSubmit(data, no_game_white_winner, event_name)
                }
              >
                白不戦勝
              </Button>
              {is_mobile ? (
                <h2>
                  {data.left_color === "white"
                    ? ShowLeftName(data, event_name.includes("dantai"))
                    : ShowRightName(data, event_name.includes("dantai"))}
                </h2>
              ) : (
                <h1>
                  {data.left_color === "white"
                    ? ShowLeftName(data, event_name.includes("dantai"))
                    : ShowRightName(data, event_name.includes("dantai"))}
                </h1>
              )}
              {ShowWhiteFlags(event_name, selectedRadioButton, flagFontSize)}
            </Grid>
            <br />
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "60px" }}
            >
              {event_name.includes("hokei") ? (
                <div>
                  <h2>赤の旗</h2>
                </div>
              ) : (
                ""
              )}
            </Grid>
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "60px" }}
            >
              {event_name.includes("hokei") ? (
                <>
                  <input
                    class="radio-inline__input"
                    type="radio"
                    id="choice0"
                    name="contact"
                    value="0"
                    onChange={handleRadioButtonChange}
                    checked={parseInt(selectedRadioButton) === 0}
                  />
                  <label class="radio-inline__label" for="choice0">
                    0
                  </label>
                  <input
                    class="radio-inline__input"
                    type="radio"
                    id="choice1"
                    name="contact"
                    value="1"
                    onChange={handleRadioButtonChange}
                    checked={parseInt(selectedRadioButton) === 1}
                  />
                  <label class="radio-inline__label" for="choice1">
                    1
                  </label>
                  <input
                    class="radio-inline__input"
                    type="radio"
                    id="choice2"
                    name="contact"
                    value="2"
                    onChange={handleRadioButtonChange}
                    checked={parseInt(selectedRadioButton) === 2}
                  />
                  <label class="radio-inline__label" for="choice2">
                    2
                  </label>
                  <input
                    class="radio-inline__input"
                    type="radio"
                    id="choice3"
                    name="contact"
                    value="3"
                    onChange={handleRadioButtonChange}
                    checked={parseInt(selectedRadioButton) === 3}
                  />
                  <label class="radio-inline__label" for="choice3">
                    3
                  </label>
                </>
              ) : (
                <>
                  <input
                    class="radio-inline__input"
                    type="radio"
                    id="choice0"
                    name="contact"
                    value="0"
                    onChange={handleRadioButtonChange}
                    checked={parseInt(selectedRadioButton) === 0}
                  />
                  <label class="radio-inline__label" for="choice0">
                    赤勝利
                  </label>
                  <input
                    class="radio-inline__input"
                    type="radio"
                    id="choice1"
                    name="contact"
                    value="1"
                    onChange={handleRadioButtonChange}
                    checked={parseInt(selectedRadioButton) === 1}
                  />
                  <label class="radio-inline__label" for="choice1">
                    白勝利
                  </label>
                </>
              )}
            </Grid>
          </Grid>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "100px" }}
          >
            <Button
              variant="contained"
              type="submit"
              onClick={(e) => onSubmit(data, selectedRadioButton, event_name)}
            >
              決定
            </Button>
            &nbsp;&nbsp;
            <Button variant="contained" type="submit" onClick={onBack}>
              戻る
            </Button>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}

export default UpdateResult;
