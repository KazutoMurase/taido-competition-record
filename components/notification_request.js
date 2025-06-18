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
import {
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
} from "@mui/material";

function onClearAll(is_test, function_after_post) {
  let post = { is_test: is_test };
  axios
    .post("/api/clear_notification_request", post)
    .then((response) => {
      function_after_post();
    })
    .catch((e) => {
      console.log(e);
    });
}

function onClear(item, is_test, function_after_post) {
  let post = {};
  if ("name" in item) {
    post = { player_id: item.id, is_test: is_test };
  } else {
    post = {
      group_id: item.group_id,
      is_test: is_test,
      event_id: item.event_id,
      court_id: item.court_id,
    };
  }
  axios
    .post("/api/clear_notification_request", post)
    .then((response) => {
      function_after_post();
    })
    .catch((e) => {
      console.log(e);
    });
}

function ShowName(item, is_mobile) {
  if ("name" in item) {
    if (is_mobile) {
      return (
        <>
          <div style={{ fontSize: "15px" }}>{item["name_kana"]}</div>
          {item["name"]}
        </>
      );
    }
    return item["name"] + "(" + item["name_kana"] + ")";
  }
  if ("group_name" in item) {
    return item["group_name"].replace("'", "").replace("'", "");
  } else {
    return "全体";
  }
}

function NotificationRequest({
  update_interval,
  is_mobile = false,
  return_url,
  is_test = false,
}) {
  const [selectedRadioButton, setSelectedRadioButton] = useState(null);

  const handleRadioButtonChange = (event) => {
    setSelectedRadioButton(event.target.value);
  };
  const router = useRouter();
  const ToBack = () => {
    router.push(return_url);
  };

  const fetchData = useCallback(async () => {
    const response = await fetch(
      "/api/notification_request?is_test=" + is_test,
    );
    const result = await response.json();
    setData(result);
  }, [is_test]);
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
  const minWidth = is_mobile ? "400px" : "720px";
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
              <u>呼び出しリスト</u>
            </h2>
          </Grid>
          <Table border="1" sx={{ width: "100%" }}>
            <TableHead>
              <TableRow className={checkStyles.column}>
                <TableCell>競技</TableCell>
                <TableCell>選手/団体名</TableCell>
                <TableCell>コート</TableCell>
                <TableCell>所属</TableCell>
                <TableCell></TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.length === 0 ? (
                <>
                  <TableCell />
                  <TableCell sx={{ "font-size": "20px" }}>
                    呼び出し待ちはありません
                  </TableCell>
                  <TableCell />
                  <TableCell />
                  <TableCell />
                </>
              ) : (
                data.map((item, index) => (
                  <TableRow key={item["id"]} className={checkStyles.column}>
                    <TableCell sx={{ "font-size": "20px" }}>
                      {item["event_name"].replace("'", "").replace("'", "")}
                    </TableCell>
                    <TableCell sx={{ "font-size": "20px" }}>
                      {ShowName(item, is_mobile)}
                    </TableCell>
                    <TableCell sx={{ "font-size": "20px" }}>
                      {is_mobile
                        ? item["court_name"]
                            .replace(/['"]+/g, "")
                            .replace("コート", "")
                        : item["court_name"].replace(/['"]+/g, "")}
                    </TableCell>
                    <TableCell sx={{ "font-size": "20px" }}>
                      {"name" in item
                        ? item["group_name"].replace("'", "").replace("'", "")
                        : ""}
                    </TableCell>
                    <TableCell sx={{ "font-size": "20px" }}>
                      <Button
                        variant="contained"
                        type="submit"
                        size={is_mobile ? "small" : "medium"}
                        onClick={(e) => onClear(item, is_test, forceFetchData)}
                      >
                        {is_mobile ? (
                          <>
                            呼び出し
                            <br />
                            完了
                          </>
                        ) : (
                          "呼び出し完了"
                        )}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
          <br />
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "100px" }}
          >
            <Button
              variant="contained"
              type="submit"
              onClick={(e) => onClearAll(is_test, forceFetchData)}
            >
              全呼び出し完了
            </Button>
            &nbsp;&nbsp;
            <Button variant="contained" type="submit" onClick={(e) => ToBack()}>
              戻る
            </Button>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}

export default NotificationRequest;
