import { NextApiRequest, NextApiResponse } from "next";
import GetClient from "../../lib/db_client";

export interface GetCurrentProgressRequest extends NextApiRequest {
  query: {
    block_number: string;
  };
}

// TODO: 実大会競技名が固まったら別ファイルにMap作成
const event_id_vs_table_name: Map<number, string> = new Map([
  [1, "test_zissen_man"],
  [2, "test_hokei_man"],
  [3, "test_zissen_woman"],
  [4, "test_hokei_woman"],
  [5, "test_hokei_sonen"],
  // TODO: change to dantai_zissen
  [6, "test_dantai"],
]);

interface OneScheduleInfo {
  eventName: string;
  timeSpan: string;
  gameIds: number[];
}

export interface CurrentProgressInfo {
  schedules: OneScheduleInfo[];
  // 注意: DBと違って0スタート
  currentScheduleIdx?: number;
  currentGameId?: number;
}

const GetFromDB = async (req: GetCurrentProgressRequest) => {
  const client = await GetClient();
  const block_name = "block_" + req.query.block_number;
  const current_progress: CurrentProgressInfo = {
    schedules: [],
  };
  // 競技名取得
  let query = "select id, name from event_type";
  let result = await client.query(query);
  const event_names = result.rows.map((item) => item.name);

  // block_x_gamesのschedule_idはblock_xのidと対応付けられる→block_xのidごとにblock_x_gamesを総当たりして現状最終状態をチェックできるはず
  // 昇順に総当たりして、はじめて終わってない試合が最初に出てきたところが現在の試合
  query = "select id, event_id, time_schedule from " + block_name;
  result = await client.query(query);
  let schedule_and_event_ids_in_block = result.rows
    .map((item) => {
      return {
        schedule_id: item.id,
        event_id: item.event_id,
        time_schedule: item.time_schedule,
      };
    })
    .sort((a, b) => a.schedule_id - b.schedule_id);
  schedule_and_event_ids_in_block.map((item) => {
    current_progress.schedules.push({
      eventName: event_names[Number(item.event_id)],
      timeSpan: item.time_schedule,
      // gameIdsはここでは取れない
      gameIds: [],
    });
  });

  // 各時程総当たり
  let idx = 0;
  for (const ids of schedule_and_event_ids_in_block) {
    const table_name = event_id_vs_table_name.get(ids.event_id);
    if (table_name === undefined || table_name == "test_dantai") {
      // 全日程終了→テーブル無し, 団体→未実装
      continue;
    }
    query =
      "select t1.id, t1.left_player_flag FROM " +
      block_name +
      "_games AS t0 LEFT JOIN " +
      table_name +
      " AS t1 ON t0.game_id = t1.id WHERE t0.schedule_id = " +
      String(ids.schedule_id);
    // " AS t1 ON t0.game_id = t1.id";
    result = await client.query(query);
    let game_states_in_schedule = result.rows
      .map((item) => {
        current_progress.schedules[idx].gameIds.push(item.id);
        return { game_id: item.id, left_player_flag: item.left_player_flag };
      })
      .sort((a, b) => a.game_id - b.game_id);
    idx++;
    if (current_progress.currentScheduleIdx !== undefined) continue;
    for (const game of game_states_in_schedule) {
      // 負け側の旗数が記録されていない→試合未実施
      // TODO: check "left_group_flag" if dantai
      if (game.left_player_flag === null) {
        // schedule_idは1スタートで1ずつ増えると仮定
        // console.log(
        //   `current schedule on block ${block_name} is game ${game.game_id} in ${table_name}`,
        // );
        current_progress.currentScheduleIdx = ids.schedule_id - 1;
        current_progress.currentGameId = game.game_id;
        break;
      }
    }
  }

  return current_progress;
};

const GetCurrentProgress = async (
  req: GetCurrentProgressRequest,
  res: NextApiResponse,
) => {
  // TODO: use cache
  const data = await GetFromDB(req);
  res.json(data);
};

export default GetCurrentProgress;
