import fs from "fs";
import path from "path";
import GetClient from "../../../lib/db_client";
import { MarkResultUpdated } from "../../../lib/result_cache";

const DANTAI_HOKEI_HEADER = [
  "id",
  "group_id",
  "round",
  "main_score",
  "sub1_score",
  "sub2_score",
  "penalty",
  "retire",
];

const TENKAI_HEADER = [
  "id",
  "group_id",
  "round",
  "main_score",
  "sub1_score",
  "sub2_score",
  "sub3_score",
  "sub4_score",
  "sub5_score",
  "elapsed_time",
  "penalty",
  "start_penalty",
  "retire",
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

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function isTableOrderEvent(eventName) {
  return eventName.includes("dantai_hokei") || eventName.includes("tenkai");
}

function headerForEvent(eventName) {
  return eventName.includes("tenkai") ? TENKAI_HEADER : DANTAI_HOKEI_HEADER;
}

function normalizeRows(rows, validTeamIds) {
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("rows is empty");
  }

  const seenTeamIds = new Set();
  const normalizedRows = rows.map((row, index) => {
    const groupId = cleanText(row.group_id);
    if (groupId) {
      if (!validTeamIds.has(groupId)) {
        throw new Error(`unknown group_id: ${groupId}`);
      }
      if (seenTeamIds.has(groupId)) {
        throw new Error(`duplicated group_id: ${groupId}`);
      }
      seenTeamIds.add(groupId);
    }
    return {
      ...row,
      id: index + 1,
      group_id: groupId || null,
      round: Number(row.round) || 1,
    };
  });

  return normalizedRows;
}

function rowsToCsv(rows, eventName) {
  const header = headerForEvent(eventName);
  return [
    header.join(","),
    ...rows.map((row) =>
      header.map((column) => csvEscape(row[column])).join(","),
    ),
  ].join("\n");
}

function valueForDb(value) {
  return value === "" || value == null ? null : value;
}

async function assertEventExists(client, eventName) {
  const result = await client.query(
    "SELECT 1 FROM event_type WHERE name_en = $1",
    [eventName],
  );
  if (result.rows.length === 0) {
    throw new Error(`unknown event_name: ${eventName}`);
  }
  if (!isTableOrderEvent(eventName)) {
    throw new Error(
      `unsupported event_name for table order editor: ${eventName}`,
    );
  }
}

async function buildTeamIds(client, eventName) {
  const result = await client.query(`SELECT id FROM ${eventName}_groups`);
  return new Set(result.rows.map((row) => cleanText(row.id)));
}

async function replaceEventTable(pool, eventName, rows) {
  const header = headerForEvent(eventName);
  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`DELETE FROM ${eventName}`);
    for (const row of rows) {
      await client.query({
        text: `INSERT INTO ${eventName} (${header.join(", ")}) VALUES (${header
          .map((_, index) => `$${index + 1}`)
          .join(", ")})`,
        values: header.map((column) => valueForDb(row[column])),
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

function tryWriteCsv(originalDir, tableCsv, csv, timestamp) {
  if (!fs.existsSync(originalDir)) {
    return {
      savedCsv: null,
      backupCsv: null,
      csvWarning: `skipped CSV write because ${originalDir} does not exist`,
    };
  }

  const backupCsv = `${tableCsv}.${timestamp}.bak`;
  const temporaryCsv = `${tableCsv}.${timestamp}.tmp`;
  try {
    if (fs.existsSync(tableCsv)) {
      fs.copyFileSync(tableCsv, backupCsv);
    }
    fs.writeFileSync(temporaryCsv, csv, "utf-8");
    fs.renameSync(temporaryCsv, tableCsv);
    return {
      savedCsv: path.relative(process.cwd(), tableCsv),
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

export default async function SaveTableOrder(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "method not allowed" });
    return;
  }

  try {
    const competition = String(req.body.competition || "");
    const eventName = String(req.body.event_name || "");
    assertSafeName(competition, "competition");
    assertSafeName(eventName, "event_name");

    const pool = GetClient();
    await assertEventExists(pool, eventName);
    const rows = normalizeRows(
      req.body.rows,
      await buildTeamIds(pool, eventName),
    );
    const csv = `${rowsToCsv(rows, eventName)}\n`;
    const timestamp = Date.now();

    await replaceEventTable(pool, eventName, rows);
    await MarkResultUpdated(eventName);

    const originalDir = path.join(
      process.cwd(),
      "data",
      competition,
      "original",
    );
    const csvResult = tryWriteCsv(
      originalDir,
      path.join(originalDir, `${eventName}.csv`),
      csv,
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
    res
      .status(500)
      .json({ error: error.message || "Error saving table order" });
  }
}
