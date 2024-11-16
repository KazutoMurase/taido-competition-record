import React, { useCallback, useEffect, useState } from "react";
import checkStyles from "../styles/checks.module.css";
import Box from "@mui/material/Box";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { GetEventName } from "../lib/get_event_name";
import { GameIdsData } from "../pages/api/get_game_ids_on_block";

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
  const [games, setGames] = useState<GameIdsData[]>([]);
  const [scheduleTables, setScheduleTables] = useState<JSX.Element[]>([]);

  const fetchData = useCallback(async () => {
    fetch("/api/get_time_schedule?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => {
        setTimeSchedules(data);
      });
    fetch("/api/get_game_ids_on_block?block_number=" + block_number)
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
            {
              <a
                className="color-disabled"
                href={"results/" + GetEventName(schedule.event_id)}
              >
                {schedule.name?.replace(/['"]+/g, "")}
              </a>
            }
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
      <Container maxWidth="md">
        <Box>
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
      </Container>
    </div>
  );
};

export default ProgressOnBlock;
