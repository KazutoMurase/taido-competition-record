import React, { useCallback, useEffect, useState } from "react";

import Typography from "@mui/material/Typography";

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
  before_final: number;
  final: number;
  players_checked: number;
}

// TODO: 実大会競技名が固まったら別ファイルにMap作成
const test_event_id_vs_event_name: Map<number, string> = new Map([
  [0, "全日程終了"],
  [1, "男子個人実戦"],
  [2, "男子個人法形"],
  [3, "女子個人実戦"],
  [4, "女子個人法形"],
  [5, "壮年法形"],
  [6, "女子団体実戦"],
  [7, "男子団体実戦"],
]);

const ProgressOnBlock: React.FC<{
  block_number: string;
  update_interval: number;
  return_url: string;
}> = ({ block_number }) => {
  const [currentScheduleData, setCurrentScheduleData] =
    useState<CurrentScheduleData>();
  const [timeSchedules, setTimeSchedules] = useState<TimeScheduleData[]>([]);
  const [games, setGames] = useState<StaticGameData[]>([]);
  const [scheduleTables, setScheduleTables] = useState<JSX.Element[]>([]);

  const fetchData = useCallback(async () => {
    fetch("/api/current_schedule?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => {
        setCurrentScheduleData(data);
      });
    fetch("/api/get_time_schedule?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => {
        setTimeSchedules(data);
      });
    fetch("/api/get_static_games_on_block?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => setGames(data));
  }, [block_number]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

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
      const isCurrentEvent = schedule.id === currentScheduleData.id;
      tables.push(
        <tr
          key={schedule.id}
          style={{ backgroundColor: isCurrentEvent ? "#FFEDB3" : "#FFFFFF" }}
        >
          <td>{schedule.time_schedule.replace(/['"]+/g, "")}</td>
          <td>{test_event_id_vs_event_name.get(schedule.event_id)}</td>
          <td>
            {games
              .filter((game) => game.schedule_id === schedule.id)
              .map((game) => game.game_id)
              .join(",")}
          </td>
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
  }, [block_number, fetchData, currentScheduleData, timeSchedules, games]);

  return (
    <div
      style={{
        textAlign: "center",
        alignItems: "center",
        justifyItems: "center",
        alignContent: "center",
      }}
    >
      <Typography variant="h4">{block_number + "コート"}</Typography>
      <table align="center">
        <thead>
          <tr>
            <td>時間</td>
            <td>競技</td>
            <td>試合一覧</td>
            <td>次の試合</td>
          </tr>
        </thead>
        <tbody>{scheduleTables}</tbody>
      </table>
    </div>
  );
};

export default ProgressOnBlock;
