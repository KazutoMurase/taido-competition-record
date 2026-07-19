import fs from "fs";
import path from "path";
import GetClient from "../../../lib/db_client";
import { TouchCacheVersion } from "../../../lib/versioned_cache";

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

function assertSafeName(value, label) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`invalid ${label}`);
  }
}

function assertBlockName(value) {
  if (!value || !/^[A-Za-z0-9]$/.test(value)) {
    throw new Error("invalid block");
  }
}

function cleanText(value) {
  if (value == null) {
    return "";
  }
  return String(value).trim();
}

function requiredInteger(value, label) {
  const parsed = Number(value);
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

function normalizeRows(rows, eventIds) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("rows is empty");
  }
  return rows.map((row, index) => {
    const eventId = requiredInteger(row.event_id, "event_id");
    if (!eventIds.has(eventId)) {
      throw new Error(`unknown event_id: ${eventId}`);
    }
    const gameIds = Array.isArray(row.game_ids) ? row.game_ids : [];
    const normalizedGameIds = [...new Set(gameIds.map(Number))].sort(
      (a, b) => a - b,
    );
    for (const gameId of normalizedGameIds) {
      if (!Number.isInteger(gameId) || gameId < 1) {
        throw new Error(`invalid game_id: ${gameId}`);
      }
    }
    return {
      id: index + 1,
      event_id: eventId,
      time_schedule: cleanText(row.time_schedule),
      before_final: row.before_final ? 1 : 0,
      final: row.final ? 1 : 0,
      players_checked: 0,
      next_unused_num: requiredInteger(
        row.next_unused_num || 0,
        "next_unused_num",
      ),
      game_ids: normalizedGameIds,
    };
  });
}

function buildGamesRows(rows) {
  const gamesRows = [];
  let id = 1;
  for (const row of rows) {
    row.game_ids.forEach((gameId, index) => {
      gamesRows.push({
        id,
        schedule_id: row.id,
        order_id: index + 1,
        game_id: gameId,
      });
      id += 1;
    });
  }
  return gamesRows;
}

function blockRowsToCsv(rows) {
  return [
    BLOCK_HEADER.join(","),
    ...rows.map((row) =>
      BLOCK_HEADER.map((column) =>
        column === "time_schedule"
          ? csvEscape(row[column] ? `'${row[column]}'` : "''")
          : csvEscape(row[column]),
      ).join(","),
    ),
  ].join("\n");
}

function gamesRowsToCsv(rows) {
  return [
    GAMES_HEADER.join(","),
    ...rows.map((row) =>
      GAMES_HEADER.map((column) => csvEscape(row[column])).join(","),
    ),
  ].join("\n");
}

async function eventIdsFromDb(client) {
  const result = await client.query("SELECT id FROM event_type");
  return new Set(result.rows.map((row) => Number(row.id)));
}

async function replaceBlockTables(client, block, rows, gamesRows) {
  const blockTable = `block_${block}`;
  const gamesTable = `block_${block}_games`;
  const currentTable = `current_block_${block}`;
  await client.query("BEGIN");
  try {
    await client.query(`DELETE FROM ${gamesTable}`);
    await client.query(`DELETE FROM ${currentTable}`);
    await client.query(`DELETE FROM ${blockTable}`);
    for (const row of rows) {
      await client.query({
        text: `INSERT INTO ${blockTable} (${BLOCK_HEADER.join(", ")})
               VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        values: BLOCK_HEADER.map((column) => row[column]),
      });
    }
    for (const row of gamesRows) {
      await client.query({
        text: `INSERT INTO ${gamesTable} (${GAMES_HEADER.join(", ")})
               VALUES ($1, $2, $3, $4)`,
        values: GAMES_HEADER.map((column) => row[column]),
      });
    }
    await client.query(
      `INSERT INTO ${currentTable} (id, game_id) VALUES ($1, $2)`,
      [rows[0].id, 1],
    );
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  }
}

function writeCsvWithBackup(originalDir, block, blockCsv, gamesCsv, timestamp) {
  if (!fs.existsSync(originalDir)) {
    return {
      savedCsv: [],
      backupCsv: [],
      csvWarning: `skipped CSV write because ${originalDir} does not exist`,
    };
  }

  const outputs = [
    { filePath: path.join(originalDir, `block_${block}.csv`), csv: blockCsv },
    {
      filePath: path.join(originalDir, `block_${block}_games.csv`),
      csv: gamesCsv,
    },
  ];
  const savedCsv = [];
  const backupCsv = [];
  try {
    for (const output of outputs) {
      const backupPath = `${output.filePath}.${timestamp}.bak`;
      const temporaryPath = `${output.filePath}.${timestamp}.tmp`;
      if (fs.existsSync(output.filePath)) {
        fs.copyFileSync(output.filePath, backupPath);
        backupCsv.push(path.relative(process.cwd(), backupPath));
      }
      fs.writeFileSync(temporaryPath, `${output.csv}\n`, "utf-8");
      fs.renameSync(temporaryPath, output.filePath);
      savedCsv.push(path.relative(process.cwd(), output.filePath));
    }
    return { savedCsv, backupCsv, csvWarning: null };
  } catch (error) {
    console.log(error);
    return {
      savedCsv: [],
      backupCsv: [],
      csvWarning: `DB saved, but CSV write failed: ${
        error.message || "unknown error"
      }`,
    };
  }
}

export default async function SaveBlock(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const competition = String(req.body.competition || "");
    const block = String(req.body.block || "").toLowerCase();
    assertSafeName(competition, "competition");
    assertBlockName(block);

    const client = await GetClient();
    const rows = normalizeRows(req.body.rows, await eventIdsFromDb(client));
    const gamesRows = buildGamesRows(rows);
    const blockCsv = blockRowsToCsv(rows);
    const gamesCsv = gamesRowsToCsv(gamesRows);
    const timestamp = Date.now();

    await replaceBlockTables(client, block, rows, gamesRows);
    await Promise.all([
      TouchCacheVersion(`latest_update_block_${block}_timestamp`),
      TouchCacheVersion(`change_event_order_for_block_${block}`),
      TouchCacheVersion(`change_order_for_block_${block}`),
      TouchCacheVersion(`update_complete_players_for_block_${block}`),
      TouchCacheVersion(`update_id_for_current_block_${block}`),
      TouchCacheVersion(`update_game_id_for_current_block_${block}`),
    ]);

    const originalDir = path.join(
      process.cwd(),
      "data",
      competition,
      "original",
    );
    const csvResult = writeCsvWithBackup(
      originalDir,
      block,
      blockCsv,
      gamesCsv,
      timestamp,
    );

    res.json({
      ok: true,
      saved_csv: csvResult.savedCsv,
      backup_csv: csvResult.backupCsv,
      csv_warning: csvResult.csvWarning,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Error saving block" });
  }
}
