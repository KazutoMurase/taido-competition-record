import React, { useEffect, useState } from "react";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import { useRouter } from "next/router";
import checkStyles from "../styles/checks.module.css";
import { GetEventName } from "../lib/get_event_name";

export const getServerSideProps = async (context) => {
  const params = {
    production_test: process.env.PRODUCTION_TEST,
    title: process.env.COMPETITION_TITLE,
  };
  return {
    props: { params },
  };
};

const Total: React.FC<{ params }> = ({ params }) => {
  const router = useRouter();
  const ToBack = () => {
    router.back();
  };
  const [events, setEvents] = useState([]);

  const fetchEvents = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    setEvents(result);
  };
  useEffect(() => {
    fetchEvents();
  }, []);
  // Perhaps score definition should be statics or database in future
  const use_different_personal_scores = params.title.includes("全国学生");
  const event_ids = [1, 2, 3, 4, 5, 7, 8, 10, 6, 9, 11, 26];
  let personal_span = 0;
  let dantai_span = 0;
  let row_span = 1;
  let header1 = [];
  let header2 = [];
  let human_type = "";
  let same_human_type_length = 0;
  for (const id of event_ids) {
    let event_info = events.find((item) => item.id === id);
    if (!event_info || !event_info.existence) {
      continue;
    }
    const event_name = GetEventName(id);
    if (event_name.includes("dantai") || event_name.includes("tenkai")) {
      dantai_span += 1;
    } else {
      personal_span += 1;
    }
    if (event_name.includes("sonen")) {
      if (human_type === "壮年") {
        same_human_type_length += 1;
      } else if (same_human_type_length >= 1) {
        header1.push(
          <td
            style={{ width: "50px", padding: 2 }}
            colSpan={same_human_type_length}
            rowSpan={row_span}
          >
            {human_type}
          </td>,
        );
        same_human_type_length = 1;
      } else {
        same_human_type_length = 1;
      }
      human_type = "壮年";
      row_span = 1;
    } else if (event_name.includes("newcommer")) {
      if (human_type === "新人") {
        same_human_type_length += 1;
      } else if (same_human_type_length >= 1) {
        header1.push(
          <td
            style={{ width: "50px", padding: 2 }}
            colSpan={same_human_type_length}
            rowSpan={row_span}
          >
            {human_type}
          </td>,
        );
        same_human_type_length = 1;
      } else {
        same_human_type_length = 1;
      }
      human_type = "新人";
      row_span = 2;
    } else if (event_name.includes("woman")) {
      if (human_type === "女子") {
        same_human_type_length += 1;
      } else if (same_human_type_length >= 1) {
        header1.push(
          <td
            style={{ width: "50px", padding: 2 }}
            colSpan={same_human_type_length}
            rowSpan={row_span}
          >
            {human_type}
          </td>,
        );
        same_human_type_length = 1;
      } else {
        same_human_type_length = 1;
      }
      human_type = "女子";
      row_span = 1;
    } else if (event_name.includes("man")) {
      if (human_type === "男子") {
        same_human_type_length += 1;
      } else if (same_human_type_length >= 1) {
        header1.push(
          <td
            style={{ width: "50px", padding: 2 }}
            colSpan={same_human_type_length}
            rowSpan={row_span}
          >
            {human_type}
          </td>,
        );
        same_human_type_length = 1;
      } else {
        same_human_type_length = 1;
      }
      human_type = "男子";
      row_span = 1;
    }
    if (row_span === 2) {
      // do nothing
    } else if (event_name.includes("zissen")) {
      header2.push(<td style={{ width: "50px", padding: 2 }}>実戦</td>);
    } else if (event_name.includes("hokei")) {
      header2.push(<td style={{ width: "50px", padding: 2 }}>法形</td>);
    } else if (event_name.includes("tenkai")) {
      header2.push(<td style={{ width: "50px", padding: 2 }}>展開</td>);
    }
  }
  if (same_human_type_length >= 1) {
    header1.push(
      <td
        style={{ width: "50px", padding: 2 }}
        colSpan={same_human_type_length}
        rowSpan={row_span}
      >
        {human_type === "新人" ? (
          <>
            新人
            <br />
            団法
          </>
        ) : (
          <>{human_type}</>
        )}
      </td>,
    );
  }
  const [data, setData] = useState([]);
  useEffect(() => {
    async function fetchData() {
      const response = await fetch(
        "/api/get_total?use_different_personal_scores=" +
          use_different_personal_scores,
      );
      const result = await response.json();
      setData(result);
    }
    fetchData();
  }, []);
  return (
    <>
      <Container maxWidth="md">
        <Box style={{ minWidth: "850px" }}>
          <Grid container justifyContent="center" alignItems="center">
            <h2>得点表＜総合＞</h2>
            <table align="center" border={1}>
              <thead>
                <tr>
                  <td style={{ width: "150px", padding: 2 }} rowSpan={3}>
                    地区名
                  </td>
                  <td colSpan={personal_span} style={{ padding: 2 }}>
                    個人種目競技
                  </td>
                  <td colSpan={dantai_span} style={{ padding: 2 }}>
                    団体種目競技
                  </td>
                  <td rowSpan={3} style={{ width: "70px", padding: 2 }}>
                    合計点
                  </td>
                  <td rowSpan={3} style={{ width: "50px", padding: 2 }}>
                    順位
                  </td>
                </tr>
                <tr>{header1}</tr>
                <tr>{header2}</tr>
              </thead>
              <tbody>
                {data.map((elem) => {
                  return (
                    <tr key={elem.id}>
                      <td style={{ padding: 1 }}>
                        {elem.name?.replace(/['"]+/g, "")}
                      </td>
                      {event_ids.map((id) => {
                        let event_info = events.find((item) => item.id === id);
                        if (!event_info || !event_info.existence) {
                          return <></>;
                        }
                        return (
                          <td key={id} className={checkStyles.total}>
                            {elem[id] ? elem[id] : ""}
                          </td>
                        );
                      })}
                      <td className={checkStyles.total}>
                        {elem.total === 0 ? "" : elem.total}
                      </td>
                      <td
                        className={
                          elem.rank <= 3
                            ? checkStyles.total_winner
                            : checkStyles.total
                        }
                      >
                        {elem.rank}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            * １位・・・１０点 ２位・・・６点 ３位・・・３点 ４位・・・１点
            <br />
            　　　　同位の場合には、優勝→２位→３位→４位の順で多い方を上位とし、それでも同位の場合は、
            <br />
            　　　　団体競技種目での入賞が多い方を上位とします。
          </Grid>
        </Box>
      </Container>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "80px" }}
      >
        <Button variant="contained" type="submit" onClick={(e) => ToBack()}>
          戻る
        </Button>
      </Grid>
    </>
  );
};

export default Total;
