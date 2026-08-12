import GetClient from "./db_client";

const COURT_PATTERN = /^[a-z]$/;

export function NormalizeCourt(value) {
  const court = Array.isArray(value) ? value[0] : value;
  const normalized = String(court || "")
    .trim()
    .toLowerCase();
  return COURT_PATTERN.test(normalized) ? normalized : null;
}

function CleanText(value) {
  return value == null ? "" : String(value).replace(/['"]+/g, "").trim();
}

function BuildDisplayText(competitionName, matchNumber, participantNames) {
  const parts = [competitionName];
  if (matchNumber != null) {
    parts.push(`第${matchNumber}試合`);
  }
  if (participantNames.length > 0) {
    parts.push(participantNames.join(" vs "));
  }
  return parts.filter(Boolean).join("｜");
}

export async function GetCurrentMatchForCourt(court) {
  const client = await GetClient();
  const courtId = court.charCodeAt(0) - 96;
  const courtResult = await client.query(
    "SELECT id, name FROM court_type WHERE id = $1",
    [courtId],
  );

  if (courtResult.rows.length === 0) {
    return null;
  }

  // Table identifiers cannot be query parameters, so `court` is restricted to
  // one lowercase ASCII letter by NormalizeCourt before reaching this function.
  const blockTable = `block_${court}`;
  const currentTable = `current_${blockTable}`;
  const gamesTable = `${blockTable}_games`;
  const currentResult = await client.query(
    `SELECT current_position.id AS schedule_id,
            current_position.game_id AS court_match_order,
            scheduled.event_id,
            event.name AS competition_name,
            event.name_en AS competition_code,
            games.game_id AS match_number
       FROM ${currentTable} AS current_position
       JOIN ${blockTable} AS scheduled
         ON scheduled.id = current_position.id
       JOIN event_type AS event
         ON event.id = scheduled.event_id
       LEFT JOIN ${gamesTable} AS games
         ON games.schedule_id = current_position.id
        AND games.order_id = current_position.game_id`,
  );

  if (currentResult.rows.length === 0) {
    return null;
  }

  const current = currentResult.rows[0];
  const competitionName = CleanText(current.competition_name);
  const common = {
    active: Number(current.event_id) !== 0 && current.match_number != null,
    court,
    court_name:
      CleanText(courtResult.rows[0].name) || `${court.toUpperCase()}コート`,
    schedule_id: current.schedule_id,
    court_match_order: current.court_match_order,
    match_number: current.match_number,
    competition_id: current.event_id,
    competition_code: current.competition_code,
    competition_name: competitionName,
  };

  if (!common.active) {
    return {
      ...common,
      participant_names: [],
      display_text: competitionName,
    };
  }

  const eventTable = current.competition_code;
  if (!/^[a-z][a-z0-9_]*$/.test(eventTable)) {
    throw new Error(`Invalid event table name: ${eventTable}`);
  }

  let participantResult;
  if (eventTable.includes("dantai_hokei") || eventTable.includes("tenkai")) {
    participantResult = await client.query(
      `SELECT participant.name
         FROM ${eventTable} AS game
         LEFT JOIN ${eventTable}_groups AS participant
           ON participant.id = game.group_id
        WHERE game.id = $1`,
      [current.match_number],
    );
  } else if (eventTable.includes("dantai")) {
    participantResult = await client.query(
      `SELECT left_participant.name AS left_name,
              right_participant.name AS right_name
         FROM ${eventTable} AS game
         LEFT JOIN ${eventTable}_groups AS left_participant
           ON left_participant.id = game.left_group_id
         LEFT JOIN ${eventTable}_groups AS right_participant
           ON right_participant.id = game.right_group_id
        WHERE game.id = $1`,
      [current.match_number],
    );
  } else {
    participantResult = await client.query(
      `SELECT left_participant.name AS left_name,
              right_participant.name AS right_name
         FROM ${eventTable} AS game
         LEFT JOIN players AS left_participant
           ON left_participant.${eventTable}_player_id = game.left_player_id
         LEFT JOIN players AS right_participant
           ON right_participant.${eventTable}_player_id = game.right_player_id
        WHERE game.id = $1`,
      [current.match_number],
    );
  }

  const participant = participantResult.rows[0] || {};
  const participantNames =
    "name" in participant
      ? [CleanText(participant.name) || "未定"]
      : [
          CleanText(participant.left_name) || "未定",
          CleanText(participant.right_name) || "未定",
        ];

  return {
    ...common,
    participant_names: participantNames,
    display_text: BuildDisplayText(
      competitionName,
      current.match_number,
      participantNames,
    ),
  };
}
