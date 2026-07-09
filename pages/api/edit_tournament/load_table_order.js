import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import GetClient from "../../../lib/db_client";

function assertSafeName(value, label) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`invalid ${label}`);
  }
}

function cleanText(value) {
  if (value == null) {
    return "";
  }
  return String(value)
    .trim()
    .replace(/^'+|'+$/g, "");
}

function readCsv(filePath) {
  const fileData = fs.readFileSync(filePath, "utf-8");
  return parse(fileData, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function isTableOrderEvent(eventName) {
  return eventName.includes("dantai_hokei") || eventName.includes("tenkai");
}

function buildGroupMap(groupsRows) {
  const groupMap = {};
  for (const row of groupsRows) {
    groupMap[String(row.id)] = cleanText(row.name);
  }
  return groupMap;
}

function enrichRows(rows, teamRows, groupMap) {
  const teamsById = {};
  for (const row of teamRows) {
    teamsById[String(row.id)] = {
      id: cleanText(row.id),
      group_id: cleanText(row.group_id),
      name: cleanText(row.name),
      group_name: groupMap[String(row.group_id)] || "",
    };
  }
  return rows.map((row) => {
    const team = teamsById[String(row.group_id)] || {};
    return {
      ...row,
      id: Number(row.id),
      group_id: cleanText(row.group_id),
      round: Number(row.round),
      name: team.name || "",
      base_group_id: team.group_id || "",
      base_group_name: team.group_name || "",
    };
  });
}

function eventInfoFromRows(eventRows, eventName) {
  const event = eventRows.find((row) => cleanText(row.name_en) === eventName);
  if (!event) {
    return { full_name: eventName, description: [] };
  }
  return {
    full_name: cleanText(event.full_name) || eventName,
    description: cleanText(event.description)
      .split("|")
      .map((text) => text.trim())
      .filter(Boolean),
  };
}

async function loadFromDb(eventName) {
  const client = await GetClient();
  const eventResult = await client.query(
    "SELECT full_name, description FROM event_type WHERE name_en = $1",
    [eventName],
  );
  const eventInfo =
    eventResult.rows.length > 0
      ? {
          full_name: cleanText(eventResult.rows[0].full_name) || eventName,
          description: cleanText(eventResult.rows[0].description)
            .split("|")
            .map((text) => text.trim())
            .filter(Boolean),
        }
      : { full_name: eventName, description: [] };

  const groupsResult = await client.query("SELECT id, name FROM groups");
  const groupMap = {};
  for (const row of groupsResult.rows) {
    groupMap[String(row.id)] = cleanText(row.name);
  }

  const teamResult = await client.query(
    `SELECT id, group_id, name FROM ${eventName}_groups ORDER BY id`,
  );
  const rowsResult = await client.query(
    `SELECT * FROM ${eventName} ORDER BY id`,
  );

  return {
    eventInfo,
    rows: enrichRows(rowsResult.rows, teamResult.rows, groupMap),
  };
}

export default async function LoadTableOrder(req, res) {
  try {
    const competition = String(req.query.competition || "");
    const eventName = String(req.query.event_name || "");
    assertSafeName(competition, "competition");
    assertSafeName(eventName, "event_name");
    if (!isTableOrderEvent(eventName)) {
      throw new Error(
        `unsupported event_name for table order editor: ${eventName}`,
      );
    }

    if (process.env.EDIT_TOURNAMENT_LOAD_FROM_CSV !== "1") {
      const { eventInfo, rows } = await loadFromDb(eventName);
      res.json({
        competition,
        event_name: eventName,
        event_info: eventInfo,
        rows,
      });
      return;
    }

    const baseDir = path.join(process.cwd(), "data", competition);
    const originalDir = path.join(baseDir, "original");
    const staticDir = path.join(baseDir, "static");
    const groupMap = fs.existsSync(path.join(staticDir, "groups.csv"))
      ? buildGroupMap(readCsv(path.join(staticDir, "groups.csv")))
      : {};
    const eventInfo = fs.existsSync(path.join(staticDir, "event_type.csv"))
      ? eventInfoFromRows(
          readCsv(path.join(staticDir, "event_type.csv")),
          eventName,
        )
      : { full_name: eventName, description: [] };

    res.json({
      competition,
      event_name: eventName,
      event_info: eventInfo,
      rows: enrichRows(
        readCsv(path.join(originalDir, `${eventName}.csv`)),
        readCsv(path.join(originalDir, `${eventName}_groups.csv`)),
        groupMap,
      ),
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ error: error.message || "Error loading table order" });
  }
}
