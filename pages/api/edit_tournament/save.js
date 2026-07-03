import fs from "fs";
import path from "path";
import GetClient from "../../../lib/db_client";
import { Set as RedisSet } from "../../../lib/redis_client";

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
  if (eventName.includes("dantai") || eventName.includes("tenkai")) {
    throw new Error(
      `unsupported event_name for tournament editor: ${eventName}`,
    );
  }
}

async function buildPlayerIds(client, eventName) {
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

async function replaceEventTable(client, eventName, rows) {
  await client.query("BEGIN");
  try {
    await client.query(`DELETE FROM ${eventName}`);
    for (const row of rows) {
      await client.query({
        text: `INSERT INTO ${eventName} (${CSV_HEADER.join(", ")}) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        values: CSV_HEADER.map((header) => row[header]),
      });
    }
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
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

    const client = await GetClient();
    await assertEventExists(client, eventName);
    const playerIds = await buildPlayerIds(client, eventName);
    const rows = normalizeRows(req.body.rows, playerIds);
    const csv = `${rowsToCsv(rows)}\n`;

    const timestamp = Date.now();
    await replaceEventTable(client, eventName, rows);
    await RedisSet(
      `latest_update_result_for_${eventName}_timestamp`,
      timestamp,
    );
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
