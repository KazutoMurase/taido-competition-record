import React, { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import checkStyles from "../styles/checks.module.css";
import Summary from "./show_summary";
import tableStyles from "../styles/TableResult.module.css";
import { FetchJson } from "../lib/fetch_json";

function MakeTable(event_name, resultTable, title, show_caption) {
  return (
    <table className={tableStyles.table} align="center" border={1}>
      <thead>
        <tr>
          <td colSpan={15}>{title}</td>
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
              <td style={{ width: "50px" }}>
                開始
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
              {event_name === "dantai_hokei_newcommer" ? (
                <td style={{ width: "100px" }}>選択法形</td>
              ) : (
                <></>
              )}
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
  is_mobile: boolean;
  back_url: string;
  return_url: string;
  show_highlight?: boolean;
  show_live_stream_link?: boolean;
}> = ({
  update_interval = 10000,
  event_name = null,
  hide = false,
  editable = false,
  is_mobile = false,
  back_url = null,
  return_url = null,
  show_highlight = true,
  show_live_stream_link = false,
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
  const [courts, setCourts] = useState([]);
  const currentGamesRef = useRef({});
  const [eventInfo, setEventInfo] = useState({
    full_name: "",
    description: [],
  });

  const fetchData = useCallback(
    async (currentGames = currentGamesRef.current) => {
      try {
        const data = await FetchJson(
          "/api/get_table_result?event_name=" + event_name,
        );
        if (!Array.isArray(data)) {
          throw new Error("Invalid table result response");
        }
        const tables = {};
        const winners = {};
        let final_num = 0;
        let final_finished_num = 0;
        // check if final is confirmed or not
        let final_is_confirmed = false;
        for (let i = 0; i < data.length; i++) {
          if (data[i].is_final) {
            final_num += 1;
            if (data[i]["name"]) {
              final_is_confirmed = true;
            }
            if (data[i]["sum_score"] || data[i]["retire"]) {
              final_finished_num += 1;
            }
          }
        }
        data.forEach((elem) => {
          const group_name = elem.name?.replace(/['"]+/g, "");
          const currentCourtNames = Object.entries(currentGames)
            .filter(
              ([, game]: [string, any]) => Number(game?.id) === Number(elem.id),
            )
            .map(([court]) => court.toUpperCase());
          if (!(elem.round in tables)) {
            tables[elem.round] = [];
          }
          const visible =
            !hide && (elem.is_final || final_is_confirmed || editable);
          tables[elem.round].push(
            <tr
              key={elem.id}
              className={
                currentCourtNames.length > 0
                  ? tableStyles.currentGame
                  : undefined
              }
            >
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
                {currentCourtNames.length > 0 ? (
                  <span className={tableStyles.currentCourtLabel}>
                    {currentCourtNames.join("・")}
                  </span>
                ) : null}
              </td>
              {event_name.includes("tenkai") ? (
                <>
                  <td>
                    {elem.retire && visible ? (
                      <s>{group_name}</s>
                    ) : hide && elem.is_final ? (
                      <></>
                    ) : (
                      <>{group_name}</>
                    )}
                  </td>
                  <td>
                    {elem.main_score && visible
                      ? elem.main_score.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.sub1_score && visible
                      ? elem.sub1_score.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.sub2_score && visible
                      ? elem.sub2_score.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.sub3_score && visible
                      ? elem.sub3_score.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.sub4_score && visible
                      ? elem.sub4_score.toFixed(1)
                      : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sub5_score && visible
                      ? elem.sub5_score.toFixed(1)
                      : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sum_score_without_penalty && visible
                      ? elem.sum_score_without_penalty.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.elapsed_time && visible
                      ? elem.elapsed_time.toFixed(2)
                      : ""}
                  </td>
                  <td>
                    {elem.time_penalty && visible
                      ? elem.time_penalty.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.penalty && visible ? elem.penalty.toFixed(1) : ""}
                  </td>
                  <td>
                    {elem.start_penalty && visible
                      ? elem.start_penalty.toFixed(1)
                      : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sum_score && visible ? elem.sum_score.toFixed(1) : ""}
                  </td>
                  <td className={elem.winner ? checkStyles.winner : null}>
                    {visible ? elem.rank : ""}
                  </td>
                </>
              ) : (
                <>
                  <td>
                    {elem.retire && visible ? (
                      <s>{group_name}</s>
                    ) : hide && elem.is_final ? (
                      <></>
                    ) : (
                      <>{group_name}</>
                    )}
                  </td>
                  {event_name === "dantai_hokei_newcommer" ? (
                    <td>{elem.hokei_name}</td>
                  ) : (
                    <></>
                  )}
                  <td>
                    {elem.main_score && visible
                      ? elem.main_score.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.sub1_score && visible
                      ? elem.sub1_score.toFixed(1)
                      : ""}
                  </td>
                  <td>
                    {elem.sub2_score && visible
                      ? elem.sub2_score.toFixed(1)
                      : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.penalty && visible ? elem.penalty.toFixed(1) : ""}
                  </td>
                  <td className={checkStyles.border_right}>
                    {elem.sum_score && visible ? elem.sum_score.toFixed(1) : ""}
                  </td>
                  <td className={elem.winner ? checkStyles.winner : null}>
                    {visible ? elem.rank : ""}
                  </td>
                </>
              )}
            </tr>,
          );
          if (
            final_finished_num === final_num &&
            elem.rank &&
            elem.is_final &&
            visible
          ) {
            winners[elem.rank] = { group: group_name };
          }
        });
        setResultTable(tables);
        setResultWinners(winners);
      } catch (error) {
        console.error("Failed to update table result", error);
      }
    },
    [event_name, editable, hide, return_url],
  );

  const fetchCurrentGames = useCallback(async () => {
    const blockNumbers = courts
      .map((court) =>
        String(court.name || "")
          .replace(/['"コート]/g, "")
          .toLowerCase(),
      )
      .filter(Boolean);
    try {
      const games = await FetchJson(
        "/api/current_games_for_courts?type=table&event_name=" +
          encodeURIComponent(event_name) +
          "&block_numbers=" +
          encodeURIComponent(blockNumbers.join(",")),
      );
      if (!games || typeof games !== "object" || Array.isArray(games)) {
        throw new Error("Invalid current table games response");
      }
      const currentGames = { ...currentGamesRef.current };
      blockNumbers.forEach((blockNumber) => {
        if (!(blockNumber in games)) {
          return;
        }
        if (games[blockNumber]?.id) {
          currentGames[blockNumber] = games[blockNumber];
        } else {
          delete currentGames[blockNumber];
        }
      });
      currentGamesRef.current = currentGames;
      await fetchData(currentGames);
    } catch (error) {
      console.error("Failed to fetch current table games", error);
    }
  }, [courts, event_name, fetchData]);

  useEffect(() => {
    currentGamesRef.current = {};
    setCourts([]);
    if (hide || !show_highlight) {
      return;
    }
    const query = event_name.includes("test") ? "?is_test=true" : "";
    FetchJson("/api/get_courts" + query)
      .then((result) => {
        if (!Array.isArray(result)) {
          throw new Error("Invalid courts response");
        }
        setCourts(result);
      })
      .catch((error) => console.error("Failed to fetch courts", error));
  }, [event_name, fetchData, hide, show_highlight]);

  useEffect(() => {
    if (courts.length === 0 || hide || !show_highlight) {
      return;
    }
    fetchCurrentGames();
    if (update_interval > 0) {
      const interval = setInterval(fetchCurrentGames, update_interval);
      return () => clearInterval(interval);
    }
  }, [courts.length, fetchCurrentGames, hide, show_highlight, update_interval]);

  useEffect(() => {
    // Once courts are available, fetchCurrentGames also refreshes the result.
    // Keep this fallback for pages without highlighting and while courts load.
    if (!hide && show_highlight && courts.length > 0) {
      return;
    }
    fetchData();
    if (update_interval > 0) {
      const interval = setInterval(fetchData, update_interval);
      return () => {
        clearInterval(interval);
      };
    }
  }, [courts.length, fetchData, hide, show_highlight, update_interval]);

  const fetchEventInfo = useCallback(async () => {
    try {
      const result = await FetchJson(
        "/api/get_event_info?event_name=" +
          (event_name.includes("test")
            ? event_name.replace("test_", "")
            : event_name),
      );
      if (!Array.isArray(result)) {
        throw new Error("Invalid event information response");
      }
      if (
        result.length > 0 &&
        result[0]["full_name"] &&
        result[0]["description"]
      ) {
        setEventInfo({
          full_name: result[0]["full_name"].replace(/['"]+/g, ""),
          description: result[0]["description"]
            .replace(/['"]+/g, "")
            .split("|"),
        });
      }
    } catch (error) {
      console.error("Failed to update event information", error);
    }
  }, [event_name]);
  useEffect(() => {
    fetchEventInfo();
  }, [fetchEventInfo]);

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
    titles = {
      1: "予　　選　　(A組 No 1 ~ " + resultTable["1"].length + ")",
      2:
        "予　　選　　(B組 No " +
        (resultTable["1"].length + 1) +
        " ~ " +
        (resultTable["1"].length + resultTable["2"].length) +
        ")",
      3: "決　　勝",
    };
  } else if (length === 5) {
    titles = {
      1: "予選　Aコート",
      2: "予選　Bコート",
      3: "予選　Cコート",
      4: "予選　Dコート",
      5: "決勝戦",
    };
  }
  // TODO: make it optional
  let show_caption = false;
  const areaWidth = is_mobile ? "500px" : "850px";
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: areaWidth }}>
          {is_mobile ? (
            <></>
          ) : (
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "100px" }}
            >
              <h1>
                <u>{eventInfo.full_name + "　" + num_of_groups + "チーム"}</u>
              </h1>
            </Grid>
          )}
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
          {eventInfo.description.map((text, index) => (
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
          {is_mobile ? <></> : <Summary winners={resultWinners} />}
          {is_mobile ? (
            <></>
          ) : (
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "80px" }}
            >
              {show_live_stream_link ? (
                <Button
                  className="screen-only"
                  variant="contained"
                  color="error"
                  href="/live"
                  sx={{ mr: 2 }}
                >
                  ライブ配信を見る
                </Button>
              ) : null}
              <Button
                variant="contained"
                type="submit"
                onClick={(e) => onBack()}
              >
                戻る
              </Button>
            </Grid>
          )}
        </Box>
      </Container>
    </div>
  );
};

export default GetTableResult;
