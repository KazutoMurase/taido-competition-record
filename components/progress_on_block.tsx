import React, { useCallback, useEffect, useState } from "react";

import Typography from "@mui/material/Typography";

import { CurrentProgressInfo } from "../pages/api/get_current_progress";

const ProgressOnBlock: React.FC<{
  block_number: string;
  update_interval: number;
  return_url: string;
}> = ({ block_number }) => {
  const [progressInfo, setProgressInfo] = useState<CurrentProgressInfo>();
  const [scheduleTables, setScheduleTables] = useState<JSX.Element[]>([]);

  const fetchData = useCallback(async () => {
    fetch("/api/get_current_progress?block_number=" + block_number)
      .then((response) => response.json())
      .then((data) => {
        setProgressInfo(data);
      });
  }, [block_number]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (progressInfo === undefined) {
      setScheduleTables([]);
      return;
    }
    const tables: JSX.Element[] = [];
    progressInfo.schedules.forEach((schedule, idx) => {
      const isCurrentSchedule =
        progressInfo.currentScheduleIdx === idx ||
        (progressInfo.currentScheduleIdx === undefined &&
          idx === progressInfo.schedules.length - 1);
      tables.push(
        <tr
          key={schedule.timeSpan}
          style={{ backgroundColor: isCurrentSchedule ? "#FFEDB3" : "#ffffff" }}
        >
          <td>{schedule.timeSpan.replace(/['"]+/g, "")}</td>
          <td>{schedule.eventName.replace(/['"]+/g, "")}</td>
          <td>{schedule.gameIds.join(",")}</td>
          <td>{isCurrentSchedule ? progressInfo.currentGameId : "-"}</td>
        </tr>,
      );
    });
    setScheduleTables(tables);
  }, [block_number, progressInfo]);

  // return <>{displayStr}</>;
  return (
    <div
      style={{
        textAlign: "center",
        alignItems: "center",
        justifyItems: "center",
        alignContent: "center",
      }}
    >
      <Typography variant="h4">{"Block " + block_number}</Typography>
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
