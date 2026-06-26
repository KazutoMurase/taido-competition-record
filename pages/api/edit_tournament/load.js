import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { applyTournamentLayout } from "../../../lib/tournament_layout";

function assertSafeName(value, label) {
  if (!value || !/^[A-Za-z0-9_-]+$/.test(value)) {
    throw new Error(`invalid ${label}`);
  }
}

function readCsv(filePath) {
  const fileData = fs.readFileSync(filePath, "utf-8");
  return parse(fileData, {
    columns: true,
    skip_empty_lines: true,
    bom: true,
  });
}

function cleanText(value) {
  if (value == null) {
    return "";
  }
  return String(value)
    .trim()
    .replace(/^'+|'+$/g, "");
}

function nullableNumber(value) {
  if (value === "" || value == null) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function buildGroupMap(groupsRows) {
  const groupMap = {};
  for (const row of groupsRows) {
    groupMap[String(row.id)] = cleanText(row.name);
  }
  return groupMap;
}

function buildPlayerMap(playersRows, eventName, groupMap) {
  const playerColumn = `${eventName}_player_id`;
  const playerMap = {};
  for (const row of playersRows) {
    const playerId = cleanText(row[playerColumn]);
    if (!playerId) {
      continue;
    }
    playerMap[playerId] = {
      player_id: playerId,
      name: cleanText(row.name),
      name_kana: cleanText(row.name_kana),
      group_id: cleanText(row.group_id),
      group_name: groupMap[String(row.group_id)] || "",
      mvp: cleanText(row.mvp),
      rank_group: cleanText(row[`${eventName}_rank_group`]),
      rank_lastyear: cleanText(row[`${eventName}_rank_lastyear`]),
      rank_total: cleanText(row[`${eventName}_rank_total`]),
    };
  }
  return playerMap;
}

function enrichRows(rows, playerMap) {
  return rows.map((row) => {
    const leftPlayer = playerMap[cleanText(row.left_player_id)] || {};
    const rightPlayer = playerMap[cleanText(row.right_player_id)] || {};
    return {
      original_id: Number(row.id),
      id: Number(row.id),
      draft_id: Number(row.id),
      left_player_id: cleanText(row.left_player_id),
      right_player_id: cleanText(row.right_player_id),
      next_left_id: nullableNumber(row.next_left_id),
      next_right_id: nullableNumber(row.next_right_id),
      left_player_flag: nullableNumber(row.left_player_flag),
      left_retire: nullableNumber(row.left_retire),
      right_retire: nullableNumber(row.right_retire),
      left_name: leftPlayer.name || "",
      left_name_kana: leftPlayer.name_kana || "",
      left_group_id: leftPlayer.group_id || "",
      left_group_name: leftPlayer.group_name || "",
      left_mvp: leftPlayer.mvp || "",
      left_rank_group: leftPlayer.rank_group || "",
      left_rank_lastyear: leftPlayer.rank_lastyear || "",
      left_rank_total: leftPlayer.rank_total || "",
      right_name: rightPlayer.name || "",
      right_name_kana: rightPlayer.name_kana || "",
      right_group_id: rightPlayer.group_id || "",
      right_group_name: rightPlayer.group_name || "",
      right_mvp: rightPlayer.mvp || "",
      right_rank_group: rightPlayer.rank_group || "",
      right_rank_lastyear: rightPlayer.rank_lastyear || "",
      right_rank_total: rightPlayer.rank_total || "",
    };
  });
}

function findEventInfo(eventRows, eventName) {
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

export default function LoadTournament(req, res) {
  try {
    const competition = String(req.query.competition || "");
    const eventName = String(req.query.event_name || "");
    assertSafeName(competition, "competition");
    assertSafeName(eventName, "event_name");

    const baseDir = path.join(process.cwd(), "data", competition);
    const tournamentCsv = path.join(baseDir, "original", `${eventName}.csv`);
    const playersCsv = path.join(baseDir, "static", "players.csv");
    const groupsCsv = path.join(baseDir, "static", "groups.csv");
    const eventTypeCsv = path.join(baseDir, "static", "event_type.csv");

    const rows = readCsv(tournamentCsv);
    const playersRows = readCsv(playersCsv);
    const groupMap = fs.existsSync(groupsCsv)
      ? buildGroupMap(readCsv(groupsCsv))
      : {};
    const playerMap = buildPlayerMap(playersRows, eventName, groupMap);
    const eventInfo = fs.existsSync(eventTypeCsv)
      ? findEventInfo(readCsv(eventTypeCsv), eventName)
      : { full_name: eventName, description: [] };
    const enrichedRows = enrichRows(rows, playerMap);

    res.json({
      competition,
      event_name: eventName,
      event_info: eventInfo,
      rows: enrichedRows,
      layout_rows: applyTournamentLayout(enrichedRows),
      players: Object.values(playerMap).sort(
        (a, b) => Number(a.player_id) - Number(b.player_id),
      ),
      groups: groupMap,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Error loading CSV" });
  }
}
