import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";
import { applyTournamentLayout } from "../../../lib/tournament_layout";
import GetClient from "../../../lib/db_client";

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
      comment: cleanText(row[`${eventName}_comment`]),
    };
  }
  return playerMap;
}

function buildDantaiPlayerMap(groupRows, groupMap) {
  const playerMap = {};
  for (const row of groupRows) {
    const playerId = cleanText(row.id);
    if (!playerId) {
      continue;
    }
    playerMap[playerId] = {
      player_id: playerId,
      name: cleanText(row.name),
      name_kana: "",
      group_id: cleanText(row.group_id),
      group_name: groupMap[String(row.group_id)] || "",
      mvp: "",
      rank_group: "",
      rank_lastyear: "",
      rank_total: "",
      comment: "",
    };
  }
  return playerMap;
}

function normalizeDantaiRows(rows) {
  return rows.map((row) => ({
    id: row.id,
    left_player_id: row.left_group_id,
    right_player_id: row.right_group_id,
    next_left_id: row.next_left_id,
    next_right_id: row.next_right_id,
    left_player_flag: row.left_group_flag,
    left_retire: row.left_retire,
    right_retire: row.right_retire,
  }));
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
      left_comment: leftPlayer.comment || "",
      right_name: rightPlayer.name || "",
      right_name_kana: rightPlayer.name_kana || "",
      right_group_id: rightPlayer.group_id || "",
      right_group_name: rightPlayer.group_name || "",
      right_mvp: rightPlayer.mvp || "",
      right_rank_group: rightPlayer.rank_group || "",
      right_rank_lastyear: rightPlayer.rank_lastyear || "",
      right_rank_total: rightPlayer.rank_total || "",
      right_comment: rightPlayer.comment || "",
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

async function loadFromDb(eventName) {
  const client = await GetClient();
  if (eventName.includes("dantai_zissen")) {
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
    const groups = {};
    for (const row of groupsResult.rows) {
      groups[String(row.id)] = cleanText(row.name);
    }

    const dantaiGroupsResult = await client.query(
      `SELECT id, group_id, name FROM ${eventName}_groups ORDER BY id`,
    );
    const playerMap = buildDantaiPlayerMap(dantaiGroupsResult.rows, groups);
    const rowsResult = await client.query(
      `SELECT id, left_group_id, right_group_id, next_left_id, next_right_id,
        left_group_flag, left_retire, right_retire
      FROM ${eventName}
      ORDER BY id`,
    );
    const rows = enrichRows(normalizeDantaiRows(rowsResult.rows), playerMap);

    return {
      eventInfo,
      rows,
      players: Object.values(playerMap).sort(
        (a, b) => Number(a.player_id) - Number(b.player_id),
      ),
      groups,
    };
  }

  const playerColumn = `${eventName}_player_id`;
  const rankGroupColumn = `${eventName}_rank_group`;
  const rankLastyearColumn = `${eventName}_rank_lastyear`;
  const rankTotalColumn = `${eventName}_rank_total`;
  const commentColumn = `${eventName}_comment`;

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

  const playersResult = await client.query(
    `SELECT
      p.${playerColumn} AS player_id,
      p.name,
      p.name_kana,
      p.group_id,
      g.name AS group_name,
      p.mvp,
      p.${rankGroupColumn} AS rank_group,
      p.${rankLastyearColumn} AS rank_lastyear,
      p.${rankTotalColumn} AS rank_total,
      p.${commentColumn} AS comment
    FROM players AS p
    LEFT JOIN groups AS g ON p.group_id = g.id
    WHERE p.${playerColumn} IS NOT NULL`,
  );

  const players = playersResult.rows.map((row) => ({
    player_id: cleanText(row.player_id),
    name: cleanText(row.name),
    name_kana: cleanText(row.name_kana),
    group_id: cleanText(row.group_id),
    group_name: cleanText(row.group_name),
    mvp: cleanText(row.mvp),
    rank_group: cleanText(row.rank_group),
    rank_lastyear: cleanText(row.rank_lastyear),
    rank_total: cleanText(row.rank_total),
    comment: cleanText(row.comment),
  }));
  const playerMap = {};
  for (const player of players) {
    playerMap[player.player_id] = player;
  }

  const rowsResult = await client.query(
    `SELECT id, left_player_id, right_player_id, next_left_id, next_right_id,
      left_player_flag, left_retire, right_retire
    FROM ${eventName}
    ORDER BY id`,
  );
  const rows = enrichRows(rowsResult.rows, playerMap);

  const groupsResult = await client.query("SELECT id, name FROM groups");
  const groups = {};
  for (const row of groupsResult.rows) {
    groups[String(row.id)] = cleanText(row.name);
  }

  return {
    eventInfo,
    rows,
    players: players.sort((a, b) => Number(a.player_id) - Number(b.player_id)),
    groups,
  };
}

export default async function LoadTournament(req, res) {
  try {
    const competition = String(req.query.competition || "");
    const eventName = String(req.query.event_name || "");
    assertSafeName(competition, "competition");
    assertSafeName(eventName, "event_name");

    if (process.env.EDIT_TOURNAMENT_LOAD_FROM_CSV !== "1") {
      const { eventInfo, rows, players, groups } = await loadFromDb(eventName);
      res.json({
        competition,
        event_name: eventName,
        event_info: eventInfo,
        rows,
        layout_rows: applyTournamentLayout(rows),
        players,
        groups,
      });
      return;
    }

    const baseDir = path.join(process.cwd(), "data", competition);
    const tournamentCsv = path.join(baseDir, "original", `${eventName}.csv`);
    const playersCsv = path.join(baseDir, "static", "players.csv");
    const groupsCsv = path.join(baseDir, "static", "groups.csv");
    const eventTypeCsv = path.join(baseDir, "static", "event_type.csv");

    const rows = readCsv(tournamentCsv);
    const groupMap = fs.existsSync(groupsCsv)
      ? buildGroupMap(readCsv(groupsCsv))
      : {};
    const playerMap = eventName.includes("dantai_zissen")
      ? buildDantaiPlayerMap(
          readCsv(path.join(baseDir, "original", `${eventName}_groups.csv`)),
          groupMap,
        )
      : buildPlayerMap(readCsv(playersCsv), eventName, groupMap);
    const eventInfo = fs.existsSync(eventTypeCsv)
      ? findEventInfo(readCsv(eventTypeCsv), eventName)
      : { full_name: eventName, description: [] };
    const enrichedRows = enrichRows(
      eventName.includes("dantai_zissen") ? normalizeDantaiRows(rows) : rows,
      playerMap,
    );

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
