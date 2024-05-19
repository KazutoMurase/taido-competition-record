import React, { useCallback, useEffect, useState } from "react";

import { CurrentProgressInfo } from "../pages/api/get_current_progress";

const ProgressOnBlock: React.FC<{
  block_number: string;
  update_interval: number;
  return_url: string;
}> = ({ block_number, update_interval, return_url }) => {
  const [progressInfo, setProgressInfo] = useState<CurrentProgressInfo>({
    schedules: [],
  });

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
  return (
    <>{`block ${block_number}: current game is number ${progressInfo.currentGameId} in ${progressInfo.schedules[progressInfo.currentScheduleIdx].eventName}, which is scheduled in ${progressInfo.schedules[progressInfo.currentScheduleIdx].timeSpan}, with game numbers = ${progressInfo.schedules[progressInfo.currentScheduleIdx].gameIds}`}</>
  );
};

export default ProgressOnBlock;
