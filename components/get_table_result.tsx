import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";
import Summary from "./show_summary";

function MakeTable(event_name, resultTable, title, show_caption) {
  return (
    <table align="center" border={1}>
      <thead>
        <tr>
          <td colSpan={14}>{title}</td>
        </tr>
        <tr className={checkStyles.border_bottom}>
          {event_name.includes("tenkai") ? (
            <>
              <td style={{ width: "50px" }}>No.</td>
              <td style={{ width: "150px" }}>団体名</td>
              <td style={{ width: "50px" }}>主審</td>
              <td style={{ width: "50px" }}>副審1</td>
              <td style={{ width: "50px" }}>副審2</td>
              <td style={{ width: "50px" }}>副審3</td>
              <td style={{ width: "50px" }}>副審4</td>
              <td
                className={checkStyles.border_right}
                style={{ width: "50px" }}
              >
                副審5
              </td>
              <td
                className={checkStyles.border_right}
                style={{ width: "50px" }}
              >
                合計
              </td>
              <td style={{ width: "50px" }}>タイム</td>
              <td style={{ width: "50px" }}>
                時間
                <br />
                減点
              </td>
              <td style={{ width: "50px" }}>
                場外
                <br />
                減点
              </td>
              <td
                className={checkStyles.border_right}
                style={{ width: "50px" }}
              >
                得点
              </td>
              <td style={{ width: "50px" }}>順位</td>
            </>
          ) : (
            <>
              <td style={{ width: "50px" }}>No.</td>
              <td style={{ width: "150px" }}>団体名</td>
              <td style={{ width: "100px" }}>主審</td>
              <td style={{ width: "100px" }}>副審</td>
              <td style={{ width: "100px" }}>副審</td>
              <td
                className={checkStyles.border_right}
                style={{ width: "100px" }}
              >
                場外減点
              </td>
              <td
                className={checkStyles.border_right}
                style={{ width: "100px" }}
              >
                合計得点
              </td>
              <td style={{ width: "100px" }}>順位</td>
            </>
          )}
        </tr>
      </thead>
      <tbody>{resultTable}</tbody>
      {show_caption ? (
        <caption className={checkStyles.table_caption}>
          ※1：競技順番は実行委員会で抽選を行いました。
        </caption>
      ) : (
        <></>
      )}
    </table>
  );
}

const GetTableResult: React.FC<{
  update_interval: number;
  event_name: string;
  hide: boolean;
  editable: boolean;
  back_url: string;
  return_url: string;
}> = ({
  update_interval = 10000,
  event_name = null,
  hide = false,
  editable = false,
  back_url = null,
  return_url = null,
}) => {
  const router = useRouter();
  if (return_url === null) {
    return_url = event_name + "_result";
  }
  const onBack = () => {
    if (back_url === null) {
      router.back();
    } else {
      router.push(back_url);
    }
  };

  const onConfirm = () => {
    let post = {
      event_name: event_name,
    };
    axios
      .post("/api/confirm_table_result", post)
      .then((response) => {
        window.location.reload();
      })
      .catch((e) => {
        console.log(e);
      });
  };

  const [resultTable, setResultTable] = useState({});
  const [resultWinners, setResultWinners] = useState({});

  const fetchData = useCallback(async () => {
    fetch("/api/get_table_result?event_name=" + event_name)
      .then((response) => response.json())
      .then((data) => {
        const tables = {};
        const winners = {};
        data.forEach((elem) => {
          const group_name = elem.name?.replace(/['"]+/g, "");
          if (!(elem.round in tables)) {
            tables[elem.round] = [];
          }
          tables[elem.round].push(
            <tr key={elem.id}>
              <td>
                {editable ? (
                  <a
                    className="color-disabled"
                    href={
                      "update_table_result?event_name=" +
                      event_name +
                      "&id=" +
                      elem.id +
                      "&return_url=" +
                      return_url
                    }
                  >
                    {elem.id}
                  </a>
                ) : (
                  <>{elem.id}</>
                )}
              </td>
              {event_name.includes("tenkai") ? (
                <>
                  <td>
                    {elem.retire && !hide ? (
                      <s>{group_name}</s>
                    ) : (
                      <>{group_name}</>
                    )}
                  </td>
                  <td>
                    {elem.main_score && !hide ? elem.main_score.toFixed(1) : ""}
                  </td>
                  <td>
                    {elem.sub1_score && !hide ? elem.sub1_score.toFixed(1) : ""}
                  </td>
                  <td>
                    {elem.sub2_score && !hide ? elem.sub2_score.toFixed(1) : ""}
                  </td>
                  <td>
                    {elem.sub3_score && !hide ? elem.sub3_score.toFixed(1) : ""}
                  </td>
                  <td>
                    {elem.sub4_score && !hide ? elem.sub4_score.toFixed(1) : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sub5_score && !hide ? elem.sub5_score.toFixed(1) : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sum_score_without_penalty && !hide
                      ? elem.sum_score_without_penalty.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.elapsed_time && !hide
                      ? elem.elapsed_time.toFixed(2)
                      : ""}
                  </td>
                  <td>
                    {elem.time_penalty && !hide
                      ? elem.time_penalty.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.penalty && !hide ? elem.penalty.toFixed(1) : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sum_score && !hide ? elem.sum_score.toFixed(1) : ""}
                  </td>
                  <td className={elem.rank < 4 ? checkStyles.winner : null}>
                    {!hide ? elem.rank : ""}
                  </td>
                </>
              ) : (
                <>
                  <td>
                    {elem.retire && !hide ? (
                      <s>{group_name}</s>
                    ) : (
                      <>{group_name}</>
                    )}
                  </td>
                  <td>
                    {elem.main_score && !hide ? elem.main_score.toFixed(1) : ""}
                  </td>
                  <td>
                    {elem.sub1_score && !hide ? elem.sub1_score.toFixed(1) : ""}
                  </td>
                  <td>
                    {elem.sub2_score && !hide ? elem.sub2_score.toFixed(1) : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.penalty && !hide ? elem.penalty.toFixed(1) : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sum_score && !hide ? elem.sum_score.toFixed(1) : ""}
                  </td>
                  <td className={elem.rank < 4 ? checkStyles.winner : null}>
                    {!hide ? elem.rank : ""}
                  </td>
                </>
              )}
            </tr>,
          );
          console.log(hide);
          if (elem.rank && elem.is_final && !hide) {
            winners[elem.rank] = { group: group_name };
          }
        });
        setResultTable(tables);
        setResultWinners(winners);
      });
  }, [event_name, editable, hide, return_url]);
  useEffect(() => {
    fetchData();
    if (update_interval > 0) {
      const interval = setInterval(() => {
        fetchData();
      }, update_interval);
      return () => {
        clearInterval(interval);
      };
    }
  }, [fetchData, update_interval]);
  let event_full_name;
  let event_description;
  if (event_name.includes("dantai_hokei_man")) {
    event_full_name = "男子団体法形競技";
    event_description = [];
  } else if (event_name.includes("dantai_hokei_woman")) {
    event_full_name = "女子団体法形競技";
    event_description = [];
  } else if (event_name.includes("dantai_hokei")) {
    event_full_name = "団体法形競技";
    event_description = ["躰道の法形から選択、段級位問わず"];
  } else if (event_name.includes("tenkai_man")) {
    event_full_name = "男子団体展開競技";
    event_description = [];
  } else if (event_name.includes("tenkai_woman")) {
    event_full_name = "女子団体展開競技";
    event_description = [];
  } else if (event_name.includes("tenkai")) {
    event_full_name = "団体展開競技";
    event_description = ["1チーム6名 男女混合可　背番号着用", "段級位問わず"];
  }
  let num_of_groups = 0;
  const entries = Object.entries(resultTable);
  const length = entries.length;
  for (let i = 0; i < (length === 1 ? 1 : length - 1); i++) {
    const [key, value] = entries[i];
    if (Array.isArray(value)) {
      num_of_groups += value.length;
    }
  }
  let titles = {};
  if (length === 1) {
    titles = { 1: "決　　勝" };
  } else if (length === 2) {
    titles = { 1: "予　　選", 2: "決　　勝" };
  } else if (length === 3) {
    titles = { 1: "予　　選　　A", 2: "予　　選　　B", 3: "決　　勝" };
  }
  // TODO: make it optional
  let show_caption = false;
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: "850px" }}>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "100px" }}
          >
            <h1>
              <u>{event_full_name + "　" + num_of_groups + "チーム"}</u>
            </h1>
          </Grid>
          {editable ? (
            <Grid
              key="confirm"
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "40px" }}
            >
              <Button
                variant="contained"
                type="submit"
                onClick={(e) => onConfirm()}
              >
                結果確定
              </Button>
            </Grid>
          ) : (
            <></>
          )}
          {event_description.map((text, index) => (
            <Grid
              key={index}
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "20px" }}
            >
              {text}
            </Grid>
          ))}
          <br />
          {Object.entries(resultTable).map(([key, table]) => (
            <>
              {MakeTable(event_name, table, titles[key], show_caption)}
              <p />
            </>
          ))}
          {}
          <p />
          <Summary winners={resultWinners} />
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <Button variant="contained" type="submit" onClick={(e) => onBack()}>
              戻る
            </Button>
          </Grid>
        </Box>
      </Container>
    </div>
  );
};

export default GetTableResult;
