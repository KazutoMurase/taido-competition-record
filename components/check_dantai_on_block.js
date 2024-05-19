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

function onSubmit(
  block_number,
  group_id,
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
    court_id = 100;
  } else if (block_number === "y") {
    court_id = 101;
  }
  let post = {
    event_id: event_id,
    group_id: group_id,
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

function onClear(item, is_test, function_after_post) {
  let post = {
    group_id: item.group_id,
    event_id: item.event_id,
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

function CheckDantai({
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

  function onFinish(block_number, schedule_id, is_test) {
    let post = {
      schedule_id: schedule_id,
      block_number: block_number,
      all_checked: true,
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
              {data.length > 0 && "all" in data[0]
                ? "※全団体が表示されていますので、点呼するべき団体を確認して下さい"
                : ""}
            </h3>
          </Grid>
          <table border="1">
            <tbody>
              <tr className={checkStyles.column}>
                <th>団体名</th>
                <th>点呼完了</th>
                <th>棄権</th>
                <th>{data.length > 0 && "all" in data[0] ? "敗退" : ""}</th>
                <th></th>
                <th></th>
              </tr>
              {data.map((item, index) => (
                <tr key={item["id"]} className={checkStyles.column}>
                  <td>{item["name"].replace("'", "").replace("'", "")}</td>
                  <td className={checkStyles.elem}>
                    <input
                      type="radio"
                      name={index}
                      className={checkStyles.large_checkbox}
                    />
                  </td>
                  <td className={checkStyles.elem}>
                    <input
                      type="radio"
                      name={index}
                      className={checkStyles.large_checkbox}
                    />
                  </td>
                  <td>
                    {"all" in item ? (
                      <input
                        type="radio"
                        name={index}
                        className={checkStyles.large_checkbox}
                      />
                    ) : (
                      <></>
                    )}
                  </td>
                  <td>
                    <Button
                      variant="contained"
                      type="submit"
                      onClick={(e) =>
                        onSubmit(
                          block_number,
                          item.group_id,
                          item.event_id,
                          is_test,
                          forceFetchData,
                        )
                      }
                      style={!item["requested"] ? null : activeButtonStyle}
                    >
                      {!item["requested"] ? "呼び出し　　" : "リクエスト済"}
                    </Button>
                  </td>
                  <td>
                    <Button
                      variant="contained"
                      type="submit"
                      onClick={(e) => onClear(item, is_test, forceFetchData)}
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
              onClick={(e) => onFinish(block_number, schedule_id)}
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

export default CheckDantai;
