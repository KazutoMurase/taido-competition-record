import GetClient from "../../../lib/db_client";

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
  return String(value)
    .trim()
    .replace(/^'+|'+$/g, "");
}

function isFinishedEvent(row) {
  return (
    cleanText(row.name) === "全日程終了" ||
    cleanText(row.name_en) === "finished"
  );
}

export default async function LoadBlock(req, res) {
  try {
    const competition = String(req.query.competition || "");
    const block = String(req.query.block || "").toLowerCase();
    assertSafeName(competition, "competition");
    assertBlockName(block);

    const client = await GetClient();
    const eventResult = await client.query(
      "SELECT id, full_name, name, name_en, existence, order_id FROM event_type",
    );
    const events = eventResult.rows
      .filter((event) => Boolean(event.existence) || isFinishedEvent(event))
      .sort((a, b) => a.order_id - b.order_id)
      .map((event) => ({
        id: event.id,
        full_name: cleanText(event.full_name),
        name: cleanText(event.name),
        name_en: cleanText(event.name_en),
        existence: Boolean(event.existence),
        order_id: event.order_id,
      }));

    const blockTable = `block_${block}`;
    const gamesTable = `block_${block}_games`;
    const blockResult = await client.query(
      `SELECT id, event_id, time_schedule, before_final, final, players_checked, next_unused_num
       FROM ${blockTable}
       ORDER BY id`,
    );
    const gamesResult = await client.query(
      `SELECT schedule_id, game_id
       FROM ${gamesTable}
       ORDER BY schedule_id, order_id, id`,
    );

    const gameIdsBySchedule = {};
    for (const game of gamesResult.rows) {
      const scheduleId = Number(game.schedule_id);
      if (!gameIdsBySchedule[scheduleId]) {
        gameIdsBySchedule[scheduleId] = [];
      }
      gameIdsBySchedule[scheduleId].push(Number(game.game_id));
    }

    const rows = blockResult.rows.map((row) => ({
      id: Number(row.id),
      event_id: Number(row.event_id),
      time_schedule: cleanText(row.time_schedule),
      before_final: Number(row.before_final),
      final: Number(row.final),
      players_checked: Number(row.players_checked),
      next_unused_num: Number(row.next_unused_num),
      game_ids: gameIdsBySchedule[Number(row.id)] || [],
    }));

    res.json({ competition, block, events, rows });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: error.message || "Error loading block" });
  }
}
