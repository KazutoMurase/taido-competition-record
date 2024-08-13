import React, { useCallback, useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";

const GetTableResult: React.FC<{
  update_interval: number;
  event_name: string;
  hide: boolean;
}> = ({ update_interval = 10000, event_name = null, hide = false }) => {
  const [resultTable, setResultTable] = useState([]);

  const fetchData = useCallback(async () => {
    fetch("/api/get_table_result?event_name=" + event_name)
      .then((response) => response.json())
      .then((data) => {
        const tables: JSX.Element[] = [];
        data.forEach((elem) => {
          tables.push(
            <tr key={elem.id}>
              <td>{elem.id}</td>
              <td>{elem.name.replace(/['"]+/g, "")}</td>
              <td>{elem.main_score}</td>
              <td>{elem.sub1_score}</td>
              <td>{elem.sub2_score}</td>
              <td className={checkStyles.border_right}>{elem.penalty}</td>
              <td className={checkStyles.border_right}>{elem.sum_score}</td>
              <td>{elem.rank}</td>
            </tr>,
          );
        });
        setResultTable(tables);
      });
  }, [event_name]);
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
          </table>
        </Box>
      </Container>
    </div>
  );
};

export default GetTableResult;
