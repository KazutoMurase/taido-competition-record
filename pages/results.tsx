import React from "react";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import { GetEventName } from "../lib/get_event_name";

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
  [8, "男子団体法形"],
  [9, "女子団体法形"],
  [10, "男子団体展開"],
  [11, "女子団体展開"],
  [12, "個人法形　新人"],
  [13, "男子級位個人実戦"],
  [14, "男子級位個人法形"],
  [15, "女子級位個人実戦"],
  [16, "女子級位個人法形"],
  [17, "団体実戦"],
  [18, "団体法形"],
  [19, "団体展開"],
  [20, "個人法形　級位"],
  [21, "壮年実戦　男子"],
  [22, "壮年実戦　女子"],
  [23, "個人法形　制の法形"],
  [24, "命法形（有段者）"],
  [25, "命法形（新人級位）"],
]);

const Results: React.FC = () => {
  const router = useRouter();
  const onBack = () => {
    router.back();
  };
  const ToResult = (event_name) => {
    router.push("/results/" + event_name);
  };
  // TODO: use api/get_events
  const event_ids = [1, 3, 2, 4, 12, 20, 24, 25, 23, 21, 22, 18, 19];
  return (
    <div>
      <Container maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "100px" }}
        >
          <h1>
            <u>競技結果一覧</u>
          </h1>
          {event_ids.map((id, index) => {
            const event_name = GetEventName(id);
            return (
              <Grid
                key={index}
                container
                justifyContent="center"
                alignItems="center"
                style={{ height: "60px" }}
              >
                <Button
                  variant="contained"
                  style={{ minWidth: "140px" }}
                  type="submit"
                  onClick={(e) => ToResult(event_name)}
                >
                  {test_event_id_vs_event_name.get(id)}
                </Button>
              </Grid>
            );
          })}
          <Button variant="contained" type="submit" onClick={(e) => onBack()}>
            戻る
          </Button>
        </Grid>
      </Container>
    </div>
  );
};

export default Results;
