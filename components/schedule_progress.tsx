import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import Typography from "@mui/material/Typography";
import {
  GetScheduleProgress,
  ParseProgressTime,
} from "../lib/schedule_progress";

type Schedule = {
  id: number;
  time_schedule: string;
  game_count?: number;
};

export default function ScheduleProgress({
  schedules,
  current,
}: {
  schedules: Schedule[];
  current?: { id: number; game_id: number };
}) {
  const router = useRouter();
  const previewMinutes = ParseProgressTime(router.query.progress_time);
  const [nowMinutes, setNowMinutes] = useState<number | null>(null);

  useEffect(() => {
    const update = () => {
      // Tournament schedules use Japan time, including for overseas viewers.
      const now = new Date();
      setNowMinutes(((now.getUTCHours() + 9) % 24) * 60 + now.getUTCMinutes());
    };
    update();
    const timer = window.setInterval(update, 10000);
    return () => window.clearInterval(timer);
  }, []);

  const calculationMinutes = previewMinutes ?? nowMinutes;
  const progress =
    calculationMinutes === null
      ? null
      : GetScheduleProgress(schedules, current, calculationMinutes);

  if (!progress) return null;

  return (
    <Typography
      variant="caption"
      color="text.secondary"
      component="div"
      sx={{ textAlign: "right", minHeight: "1.5em", mx: 1, mb: 0.5 }}
      title="予定時間を試合数で等分し、終了済みの試合数から算出した目安です。"
    >
      {`進行目安：${progress}`}
    </Typography>
  );
}
