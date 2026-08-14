import React, { useCallback, useEffect, useState } from "react";
import checkStyles from "../styles/checks.module.css";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import {
  useMediaQuery,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableCell,
  TableContainer,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import { GetEventName } from "../lib/get_event_name";
import { FetchJson } from "../lib/fetch_json";
import { GameIdsData } from "../pages/api/get_game_ids_on_block";

export interface CurrentScheduleData {
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
  hide: boolean;
  has_live_stream?: boolean;
  current_schedule?: CurrentScheduleData;
}> = ({ block_number, hide, has_live_stream = false, current_schedule }) => {
  const [timeSchedules, setTimeSchedules] = useState<TimeScheduleData[]>([]);
  const [games, setGames] = useState<GameIdsData[]>([]);
  const [scheduleTables, setScheduleTables] = useState<JSX.Element[]>([]);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));

  const fetchData = useCallback(async () => {
    try {
      const data = await FetchJson(
        "/api/get_time_schedule?block_number=" + block_number,
      );
      if (!Array.isArray(data)) {
        throw new Error("Invalid time schedule response");
      }
      setTimeSchedules(data);
    } catch (error) {
      console.error("Failed to update time schedule", error);
    }
    try {
      const data = await FetchJson(
        "/api/get_game_ids_on_block?block_number=" + block_number,
      );
      if (!Array.isArray(data)) {
        throw new Error("Invalid game IDs response");
      }
      setGames(data);
    } catch (error) {
      console.error("Failed to update game IDs", error);
    }
  }, [block_number]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (
      current_schedule === undefined ||
      timeSchedules.length === 0 ||
      games.length === 0
    ) {
      setScheduleTables([]);
      return;
    }
    const tables: JSX.Element[] = timeSchedules.map((schedule) => {
      const isCurrentEvent = hide ? 0 : schedule.id === current_schedule.id;
      return (
        <TableRow
          key={schedule.id}
          className={checkStyles.column}
          style={{ backgroundColor: isCurrentEvent ? "#90caf9" : "white" }}
        >
          <TableCell>{schedule.time_schedule?.replace(/['"]+/g, "")}</TableCell>
          <TableCell>
            {GetEventName(schedule.event_id) == "dantai" ? (
              <>{schedule.name?.replace(/['"]+/g, "")}</>
            ) : (
              <a
                className="color-disabled"
                href={"results/" + GetEventName(schedule.event_id)}
              >
                {schedule.name?.replace(/['"]+/g, "")}
              </a>
            )}
          </TableCell>
          <TableCell
            sx={
              isMobile ? { whiteSpace: "normal", wordBreak: "break-word" } : {}
            }
          >
            {GetGamesText(schedule)}
          </TableCell>
          <TableCell>
            {isCurrentEvent
              ? games.find(
                  (game) =>
                    game.schedule_id === current_schedule.id &&
                    game.order_id === current_schedule.game_id,
                )?.game_id
              : "-"}
          </TableCell>
        </TableRow>
      );
    });
    setScheduleTables(tables);
  }, [block_number, current_schedule, timeSchedules, games, hide, isMobile]);

  return (
    <div
      style={{
        textAlign: "center",
        alignItems: "center",
        justifyItems: "center",
      }}
    >
      <Container
        maxWidth="md"
        sx={{ "padding-left": "0px", "padding-right": "0px" }}
      >
        <Box>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: isMobile ? "5px" : "80px" }}
          >
            {!isMobile && <h1>{block_number.toUpperCase() + "コート"}</h1>}
            {!isMobile && has_live_stream ? (
              <Button
                className="screen-only"
                variant="contained"
                color="error"
                href={`/live/${block_number}`}
                sx={{ ml: 2 }}
              >
                配信を見る
              </Button>
            ) : null}
          </Grid>
          {isMobile && has_live_stream ? (
            <Grid
              className="screen-only"
              container
              justifyContent="center"
              sx={{ mb: 1 }}
            >
              <Button
                variant="contained"
                color="error"
                href={`/live/${block_number}`}
              >
                配信を見る
              </Button>
            </Grid>
          ) : null}
          <TableContainer>
            <Table aria-label="schedule table">
              <TableHead>
                <TableRow className={checkStyles.column}>
                  <TableCell sx={{ width: "20%" }}>時間</TableCell>
                  <TableCell sx={{ width: "30%" }}>競技</TableCell>
                  <TableCell sx={{ width: "35%" }}>試合一覧</TableCell>
                  <TableCell sx={{ width: "20%" }}>次の試合</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>{scheduleTables}</TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Container>
    </div>
  );
};

export default ProgressOnBlock;
