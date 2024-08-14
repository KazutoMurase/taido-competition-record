import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";
import Summary from "./show_summary";

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

  const [resultTable, setResultTable] = useState([]);
  const [resultWinners, setResultWinners] = useState({});

  const fetchData = useCallback(async () => {
    fetch("/api/get_table_result?event_name=" + event_name)
      .then((response) => response.json())
      .then((data) => {
        const tables: JSX.Element[] = [];
        const winners = {};
        data.forEach((elem) => {
          const group_name = elem.name.replace(/['"]+/g, "");
          tables.push(
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
              <td>{elem.retire ? <s>{group_name}</s> : <>{group_name}</>}</td>
              <td>{elem.main_score ? elem.main_score.toFixed(1) : ""}</td>
              <td>{elem.sub1_score ? elem.sub1_score.toFixed(1) : ""}</td>
              <td>{elem.sub2_score ? elem.sub2_score.toFixed(1) : ""}</td>
              <td className={checkStyles.border_right}>
                {elem.penalty ? elem.penalty.toFixed(1) : ""}
              </td>
              <td className={checkStyles.border_right}>
                {elem.sum_score ? elem.sum_score.toFixed(1) : ""}
              </td>
              <td className={elem.rank < 4 ? checkStyles.winner : null}>
                {elem.rank}
              </td>
            </tr>,
          );
          if (elem.rank) {
            winners[elem.rank] = { group: group_name };
          }
        });
        setResultTable(tables);
        setResultWinners(winners);
      });
  }, [event_name, editable, return_url]);
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
  if (event_name.includes("dantai_hokei_man")) {
    event_full_name = "男子団体法形競技";
  } else if (event_name.includes("dantai_hokei_woman")) {
    event_full_name = "女子団体法形競技";
  } else if (event_name.includes("dantai_hokei")) {
    event_full_name = "団体法形競技";
  }
  let num_of_groups = resultTable.length;
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
          <table align="center" border={1}>
            <thead>
              <tr>
                <td colSpan={8}>決　　勝</td>
              </tr>
              <tr className={checkStyles.border_bottom}>
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
              </tr>
            </thead>
            <tbody>{resultTable}</tbody>
            <caption className={checkStyles.table_caption}>
              ※1：競技順番は実行委員会で抽選を行いました。
            </caption>
          </table>
        </Box>
      </Container>
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
    </div>
  );
};

export default GetTableResult;
