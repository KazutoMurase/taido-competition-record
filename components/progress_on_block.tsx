import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Button from "@mui/material/Button";
import checkStyles from "../styles/checks.module.css";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";
import { GetEventName } from "../lib/get_event_name";
import { StaticGameData } from "../pages/api/get_static_games_on_block";

interface CurrentScheduleData {
  // corresponds to schedule_id in block_<block_number>_games table and id in block_<block_number> table
  id: number;
  // corresponds to "order_id" (not "game_id") in block_<block_number>_games table
  game_id: number;
}

// data in block_<block_number> table
interface TimeScheduleData {
  id: number;
  event_id: number;
  name: string;
  time_schedule: string;
  games_text: string;
  before_final: number;
  final: number;
  players_checked: number;
}

// TODO: 実大会競技名が固まったら別ファイルにMap作成
const test_event_id_vs_event_name: Map<number, string> = new Map([
  [0, "全日程終了"],
  [1, "段位男子実戦"],
  [2, "段位男子法形"],
  [3, "段位女子実戦"],
  [4, "段位女子法形"],
  [5, "壮年法形"],
  [6, "女子団体実戦"],
  [7, "男子団体実戦"],
  [8, "男子団体法形"],
  [9, "女子団体法形"],
  [10, "男子団体展開"],
  [11, "女子団体展開"],
  [12, "新人法形"],
  [13, "男子級位個人実戦"],
  [14, "男子級位個人法形"],
  [15, "女子級位個人実戦"],
  [16, "女子級位個人法形"],
  [17, "団体実戦"],
  [18, "団体法形"],
  [19, "団体展開"],
  [20, "級位法形"],
  [21, "壮年男子実戦"],
  [22, "壮年女子実戦"],
  [23, "制の法形"],
  [24, "命 段位法形"],
  [25, "命 新人級位"],
  [26, "新人団体法形"],
]);

function GetGamesText(schedule) {
  if (!schedule.games_text) {
    return "";
  }
  if (schedule.before_final && schedule.final) {
    return "【三決・決勝】" + schedule.games_text;
  }
  if (schedule.before_final) {
    return "【三決】" + schedule.games_text;
  }
  if (schedule.final) {
    return "【決勝】" + schedule.games_text;
  }
  return schedule.games_text;
}

const ProgressOnBlock: React.FC<{
  block_number: string;
  update_interval: number;
  return_url: string;
  hide: boolean;
}> = ({ block_number, update_interval, hide }) => {
  const [currentScheduleData, setCurrentScheduleData] =
    useState<CurrentScheduleData>();
  const [timeSchedules, setTimeSchedules] = useState<TimeScheduleData[]>([]);
  const [games, setGames] = useState<StaticGameData[]>([]);
  const [scheduleTables, setScheduleTables] = useState<JSX.Element[]>([]);

  const fetchData = useCallback(async () => {
    fetch("/api/get_time_schedule?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => {
        setTimeSchedules(data);
      });
    fetch("/api/get_static_games_on_block?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => setGames(data));
  }, [block_number]);

  const fetchCurentSchedule = useCallback(async () => {
    fetch("/api/current_schedule?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => {
        setCurrentScheduleData(data);
      });
  }, [block_number]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    fetchCurentSchedule();
    if (update_interval > 0) {
      const interval = setInterval(() => {
        fetchCurentSchedule();
      }, update_interval);
      return () => {
        clearInterval(interval);
      };
    }
  }, [fetchCurentSchedule, update_interval]);

  useEffect(() => {
    if (
      currentScheduleData === undefined ||
      timeSchedules.length === 0 ||
      games.length === 0
    ) {
      setScheduleTables([]);
      return;
    }
    const tables: JSX.Element[] = [];
    timeSchedules.forEach((schedule) => {
      const isCurrentEvent = hide ? 0 : schedule.id === currentScheduleData.id;
      tables.push(
        <tr
          key={schedule.id}
          className={checkStyles.column}
          style={{ backgroundColor: isCurrentEvent ? "yellow" : "white" }}
        >
          <td>{schedule.time_schedule?.replace(/['"]+/g, "")}</td>
          <td>
            {GetEventName(schedule.event_id) === "dantai" ? (
              <>{test_event_id_vs_event_name.get(schedule.event_id)}</>
            ) : (
              <a
                className="color-disabled"
                href={"results/" + GetEventName(schedule.event_id)}
              >
                {test_event_id_vs_event_name.get(schedule.event_id)}
              </a>
            )}
          </td>
          <td>{GetGamesText(schedule)}</td>
          <td>
            {isCurrentEvent
              ? games.find(
                  (game) =>
                    game.schedule_id === currentScheduleData.id &&
                    game.order_id === currentScheduleData.game_id,
                )?.game_id
              : "-"}
          </td>
        </tr>,
      );
    });
    setScheduleTables(tables);
  }, [block_number, currentScheduleData, timeSchedules, games, hide]);

  return (
    <div
      style={{
        textAlign: "center",
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      <Box style={{ minWidth: "500px" }}>
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "80px" }}
        >
          <h1>{block_number.toUpperCase() + "コート"}</h1>
        </Grid>
        <table align="center" border={1}>
          <thead>
            <tr className={checkStyles.column}>
              <th>時間</th>
              <th>競技</th>
              <th>試合一覧</th>
              <th>次の試合</th>
            </tr>
          </thead>
          <tbody>{scheduleTables}</tbody>
        </table>
      </Box>
    </div>
  );
};

export default ProgressOnBlock;
