import fs from "fs";
import path from "path";
import GetClient from "../../../lib/db_client";
import { MarkResultUpdated } from "../../../lib/result_cache";

const CSV_HEADER = [
  "id",
  "left_player_id",
  "right_player_id",
  "next_left_id",
  "next_right_id",
  "left_player_flag",
  "left_retire",
  "right_retire",
];

const DANTAI_CSV_HEADER = [
  "id",
  "left_group_id",
  "right_group_id",
  "next_left_id",
  "next_right_id",
  "left_group_flag",
  "left_retire",
  "right_retire",
];

function assertSafeName(value, label) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`invalid ${label}`);
  }
}

function cleanText(value) {
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function nullableInteger(value, label) {
  const text = cleanText(value);
  if (!text) {
    return null;
  }
  const parsed = Number(text);
  if (!Number.isInteger(parsed)) {
    throw new Error(`${label} must be an integer`);
  }
  return parsed;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

async function assertEventExists(client, eventName) {
  const result = await client.query(
    "SELECT 1 FROM event_type WHERE name_en = $1",
    [eventName],
  );
  if (result.rows.length === 0) {
    throw new Error(`unknown event_name: ${eventName}`);
  }
  if (
    (eventName.includes("dantai") && !eventName.includes("dantai_zissen")) ||
    eventName.includes("tenkai")
  ) {
    throw new Error(
      `unsupported event_name for tournament editor: ${eventName}`,
    );
  }
}

async function buildPlayerIds(client, eventName) {
  if (eventName.includes("dantai_zissen")) {
    const result = await client.query(
      `SELECT id AS player_id FROM ${eventName}_groups`,
    );
    return new Set(result.rows.map((row) => cleanText(row.player_id)));
  }

  const playerColumn = `${eventName}_player_id`;
  const result = await client.query(
    `SELECT ${playerColumn} AS player_id FROM players WHERE ${playerColumn} IS NOT NULL`,
  );
  return new Set(result.rows.map((row) => cleanText(row.player_id)));
}

function normalizeRows(rows, playerIds) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("rows is empty");
  }

  const idMap = {};
  for (const row of rows) {
    const originalId = nullableInteger(row.original_id, "original_id");
    const draftId = nullableInteger(row.draft_id, "draft_id");
    if (originalId == null || draftId == null) {
      throw new Error("all rows must have original_id and draft_id");
    }
    if (draftId < 1 || draftId > rows.length) {
      throw new Error(`game id ${draftId} is out of range`);
    }
    if (idMap[originalId]) {
      throw new Error(`duplicated original_id: ${originalId}`);
    }
    idMap[originalId] = draftId;
  }

  const seenGameIds = new Set();
  const seenPlayerIds = new Set();
  const normalizedRows = rows.map((row) => {
    const id = idMap[nullableInteger(row.original_id, "original_id")];
    if (seenGameIds.has(id)) {
      throw new Error(`duplicated game id: ${id}`);
    }
    seenGameIds.add(id);

    const leftPlayerId = cleanText(row.left_player_id);
    const rightPlayerId = cleanText(row.right_player_id);
    for (const playerId of [leftPlayerId, rightPlayerId].filter(Boolean)) {
      if (!playerIds.has(playerId)) {
        throw new Error(`unknown player id: ${playerId}`);
      }
      if (seenPlayerIds.has(playerId)) {
        throw new Error(`duplicated player id: ${playerId}`);
      }
      seenPlayerIds.add(playerId);
    }

    const nextLeftId =
      row.next_left_id == null || row.next_left_id === ""
        ? null
        : idMap[nullableInteger(row.next_left_id, "next_left_id")];
    const nextRightId =
      row.next_right_id == null || row.next_right_id === ""
        ? null
        : idMap[nullableInteger(row.next_right_id, "next_right_id")];
    if (
      nextLeftId == null &&
      row.next_left_id != null &&
      row.next_left_id !== ""
    ) {
      throw new Error(`unknown next_left_id: ${row.next_left_id}`);
    }
    if (
      nextRightId == null &&
      row.next_right_id != null &&
      row.next_right_id !== ""
    ) {
      throw new Error(`unknown next_right_id: ${row.next_right_id}`);
    }

    return {
      id,
      left_player_id: leftPlayerId ? Number(leftPlayerId) : null,
      right_player_id: rightPlayerId ? Number(rightPlayerId) : null,
      next_left_id: nextLeftId,
      next_right_id: nextRightId,
      left_player_flag: null,
      left_retire: null,
      right_retire: null,
    };
  });

  for (let id = 1; id <= rows.length; id++) {
    if (!seenGameIds.has(id)) {
      throw new Error(`missing game id: ${id}`);
    }
  }

  return normalizedRows.sort((a, b) => a.id - b.id);
}

function rowsToCsv(rows) {
  return [
    CSV_HEADER.join(","),
    ...rows.map((row) =>
      CSV_HEADER.map((header) => csvEscape(row[header])).join(","),
    ),
  ].join("\n");
}

function dantaiRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    left_group_id: row.left_player_id,
    right_group_id: row.right_player_id,
    next_left_id: row.next_left_id,
    next_right_id: row.next_right_id,
    left_group_flag: row.left_player_flag,
    left_retire: row.left_retire,
    right_retire: row.right_retire,
  }));
}

function rowsToDantaiCsv(rows) {
  const convertedRows = dantaiRows(rows);
  return [
    DANTAI_CSV_HEADER.join(","),
    ...convertedRows.map((row) =>
      DANTAI_CSV_HEADER.map((header) => csvEscape(row[header])).join(","),
    ),
  ].join("\n");
}

async function replaceEventTable(pool, eventName, rows) {
  const isDantaiZissen = eventName.includes("dantai_zissen");
  const header = isDantaiZissen ? DANTAI_CSV_HEADER : CSV_HEADER;
  const insertRows = isDantaiZissen ? dantaiRows(rows) : rows;
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${eventName}`);
    for (const row of insertRows) {
      await client.query({
        text: `INSERT INTO ${eventName} (${header.join(", ")}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        values: header.map((column) => row[column]),
      });
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

function tryWriteCsv(originalDir, tournamentCsv, csv, timestamp) {
  if (!fs.existsSync(originalDir)) {
    return {
      savedCsv: null,
      backupCsv: null,
      csvWarning: `skipped CSV write because ${originalDir} does not exist`,
    };
  }

  const backupCsv = `${tournamentCsv}.${timestamp}.bak`;
  const temporaryCsv = `${tournamentCsv}.${timestamp}.tmp`;
  try {
    if (fs.existsSync(tournamentCsv)) {
      fs.copyFileSync(tournamentCsv, backupCsv);
    }
    fs.writeFileSync(temporaryCsv, csv, "utf-8");
    fs.renameSync(temporaryCsv, tournamentCsv);
    return {
      savedCsv: path.relative(process.cwd(), tournamentCsv),
      backupCsv: fs.existsSync(backupCsv)
        ? path.relative(process.cwd(), backupCsv)
        : null,
      csvWarning: null,
    };
  } catch (error) {
    console.log(error);
    return {
      savedCsv: null,
      backupCsv: null,
      csvWarning: `DB saved, but CSV write failed: ${
        error.message || "unknown error"
      }`,
    };
  }
}

export default async function SaveTournament(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const competition = String(req.body.competition || "");
    const eventName = String(req.body.event_name || "");
    assertSafeName(competition, "competition");
    assertSafeName(eventName, "event_name");

    const baseDir = path.join(process.cwd(), "data", competition);
    const originalDir = path.join(baseDir, "original");
    const tournamentCsv = path.join(originalDir, `${eventName}.csv`);

    const pool = GetClient();
    await assertEventExists(pool, eventName);
    const playerIds = await buildPlayerIds(pool, eventName);
    const rows = normalizeRows(req.body.rows, playerIds);
    const csv = `${
      eventName.includes("dantai_zissen")
        ? rowsToDantaiCsv(rows)
        : rowsToCsv(rows)
    }\n`;

    const timestamp = Date.now();
    await replaceEventTable(pool, eventName, rows);
    await MarkResultUpdated(eventName);
    const csvResult = tryWriteCsv(originalDir, tournamentCsv, csv, timestamp);

    res.json({
      ok: true,
      saved_csv: csvResult.savedCsv,
      backup_csv: csvResult.backupCsv,
      csv_warning: csvResult.csvWarning,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Error saving tournament" });
  }
}
