import { parse } from "csv-parse/browser/esm/sync";

const BLOCK_HEADER = [
  "id",
  "event_id",
  "time_schedule",
  "before_final",
  "final",
  "players_checked",
  "next_unused_num",
];
const GAMES_HEADER = ["id", "schedule_id", "order_id", "game_id"];

function cleanText(value) {
  return value == null
    ? ""
    : String(value)
        .trim()
        .replace(/^'+|'+$/g, "");
}

function parseRecords(text, expectedHeader, label) {
  const records = parse(text, { bom: true, skip_empty_lines: true });
  if (records.length === 0) {
    throw new Error(`${label} が空です。`);
  }
  const header = records[0].map(cleanText);
  if (
    header.length !== expectedHeader.length ||
    header.some((column, index) => column !== expectedHeader[index])
  ) {
    throw new Error(
      `${label} のヘッダーが正しくありません。期待値: ${expectedHeader.join(",")}`,
    );
  }
  return records.slice(1).map((values, index) => {
    if (values.length !== expectedHeader.length) {
      throw new Error(`${label} の${index + 2}行目の列数が不正です。`);
    }
    return Object.fromEntries(
      expectedHeader.map((column, valueIndex) => [column, values[valueIndex]]),
    );
  });
}

function hasHeader(text, expectedHeader) {
  const records = parse(text, {
    bom: true,
    skip_empty_lines: true,
    to_line: 1,
  });
  const header = records[0]?.map(cleanText) || [];
  return (
    header.length === expectedHeader.length &&
    header.every((column, index) => column === expectedHeader[index])
  );
}

function integer(value, label, min = null) {
  const parsed = Number(cleanText(value));
  if (!Number.isInteger(parsed) || (min != null && parsed < min)) {
    throw new Error(`${label} は整数で指定してください。`);
  }
  return parsed;
}

function flag(value, label) {
  const normalized = cleanText(value).toLowerCase();
  if (normalized === "1" || normalized === "true") return 1;
  if (normalized === "0" || normalized === "false") return 0;
  throw new Error(`${label} は 0 または 1 で指定してください。`);
}

function escapeCsv(value) {
  const text = value == null ? "" : String(value);
  return /[",\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function identifyBlockScheduleCsv(fileContents, block) {
  const blockFile = fileContents.find(({ text }) =>
    hasHeader(text, BLOCK_HEADER),
  );
  const gamesFile = fileContents.find(({ text }) =>
    hasHeader(text, GAMES_HEADER),
  );
  if (!blockFile || !gamesFile || blockFile === gamesFile) {
    throw new Error(
      `block_${block}.csv と block_${block}_games.csv の形式の2ファイルを選択してください。`,
    );
  }
  return { blockText: blockFile.text, gamesText: gamesFile.text };
}

export function csvFilesToBlockRows(blockText, gamesText, eventIds) {
  const blockRecords = parseRecords(blockText, BLOCK_HEADER, "block CSV");
  const gamesRecords = parseRecords(gamesText, GAMES_HEADER, "block games CSV");
  if (blockRecords.length === 0) {
    throw new Error("block CSV にデータ行がありません。");
  }

  const rowsById = new Map();
  const rows = blockRecords.map((record, index) => {
    const line = index + 2;
    const id = integer(record.id, `block CSV ${line}行目のid`, 1);
    if (rowsById.has(id)) {
      throw new Error(`block CSV のid ${id} が重複しています。`);
    }
    const eventId = integer(
      record.event_id,
      `block CSV ${line}行目のevent_id`,
      0,
    );
    if (!eventIds.has(eventId)) {
      throw new Error(
        `block CSV ${line}行目のevent_id ${eventId} は大会に存在しません。`,
      );
    }
    const row = {
      event_id: eventId,
      time_schedule: cleanText(record.time_schedule),
      before_final: flag(
        record.before_final,
        `block CSV ${line}行目のbefore_final`,
      ),
      final: flag(record.final, `block CSV ${line}行目のfinal`),
      players_checked: 0,
      next_unused_num: integer(
        record.next_unused_num,
        `block CSV ${line}行目のnext_unused_num`,
        0,
      ),
      game_ids: [],
    };
    rowsById.set(id, row);
    return row;
  });

  gamesRecords
    .map((record, index) => {
      const line = index + 2;
      const scheduleId = integer(
        record.schedule_id,
        `block games CSV ${line}行目のschedule_id`,
        1,
      );
      if (!rowsById.has(scheduleId)) {
        throw new Error(
          `block games CSV ${line}行目のschedule_id ${scheduleId} はblock CSVに存在しません。`,
        );
      }
      return {
        scheduleId,
        orderId: integer(
          record.order_id,
          `block games CSV ${line}行目のorder_id`,
          1,
        ),
        gameId: integer(
          record.game_id,
          `block games CSV ${line}行目のgame_id`,
          1,
        ),
        csvIndex: index,
      };
    })
    .sort((a, b) =>
      a.scheduleId === b.scheduleId
        ? a.orderId - b.orderId || a.csvIndex - b.csvIndex
        : a.scheduleId - b.scheduleId,
    )
    .forEach(({ scheduleId, gameId }) => {
      rowsById.get(scheduleId).game_ids.push(gameId);
    });

  rows.forEach((row) => {
    row.game_ids = [...new Set(row.game_ids)];
  });
  return rows;
}

export function blockRowsToCsv(rows) {
  return [
    BLOCK_HEADER.join(","),
    ...rows.map((row, index) =>
      [
        index + 1,
        row.event_id,
        row.time_schedule || "",
        row.before_final ? 1 : 0,
        row.final ? 1 : 0,
        0,
        row.next_unused_num || 0,
      ]
        .map((value, valueIndex) =>
          valueIndex === 2 ? escapeCsv(value ? `'${value}'` : "''") : value,
        )
        .join(","),
    ),
  ].join("\n");
}

export function buildGamesRows(rows) {
  const gamesRows = [];
  rows.forEach((row, rowIndex) => {
    (row.game_ids || []).forEach((gameId, index) => {
      gamesRows.push({
        id: gamesRows.length + 1,
        schedule_id: rowIndex + 1,
        order_id: index + 1,
        game_id: gameId,
      });
    });
  });
  return gamesRows;
}

export function gamesRowsToCsv(rows) {
  return [
    GAMES_HEADER.join(","),
    ...rows.map((row) => GAMES_HEADER.map((column) => row[column]).join(",")),
  ].join("\n");
}
