export class CurrentGameConflictError extends Error {}

export async function LockCurrentPosition(
  client,
  block,
  expectedEventName,
  expectedGameId,
) {
  const currentTable = `current_block_${block}`;
  const scheduleTable = `block_${block}`;
  const gamesTable = `block_${block}_games`;
  const currentResult = await client.query(
    `SELECT id, game_id FROM ${currentTable} FOR UPDATE`,
  );
  if (currentResult.rows.length !== 1) {
    throw new Error(`Expected one current position for court ${block}.`);
  }

  const position = {
    scheduleId: Number(currentResult.rows[0].id),
    orderId: Number(currentResult.rows[0].game_id),
  };
  const gameResult = await client.query(
    `SELECT games.game_id, events.name_en AS event_name
       FROM ${gamesTable} AS games
       JOIN ${scheduleTable} AS schedules ON schedules.id = games.schedule_id
       JOIN event_type AS events ON events.id = schedules.event_id
      WHERE games.schedule_id = $1 AND games.order_id = $2`,
    [position.scheduleId, position.orderId],
  );
  const currentGameId = Number(gameResult.rows[0]?.game_id);
  const currentEventName = gameResult.rows[0]?.event_name;
  const normalizedExpectedEventName = expectedEventName.replace(/^test_/, "");
  if (
    gameResult.rows.length !== 1 ||
    currentGameId !== expectedGameId ||
    currentEventName !== normalizedExpectedEventName
  ) {
    throw new CurrentGameConflictError(
      `Current game changed for court ${block}: expected=${expectedEventName}:${expectedGameId}, actual=${currentEventName ?? "none"}:${gameResult.rows[0]?.game_id ?? "none"}.`,
    );
  }

  return position;
}

export async function AdvanceCurrentPosition(client, block, position) {
  const currentTable = `current_block_${block}`;
  const gamesTable = `block_${block}_games`;
  const nextOrderId = position.orderId + 1;
  const nextResult = await client.query(
    `SELECT 1 FROM ${gamesTable} WHERE schedule_id = $1 AND order_id = $2`,
    [position.scheduleId, nextOrderId],
  );

  if (nextResult.rows.length === 0) {
    await client.query(
      `UPDATE ${currentTable} SET id = id + 1, game_id = 1 WHERE id = $1 AND game_id = $2`,
      [position.scheduleId, position.orderId],
    );
    return true;
  }

  await client.query(
    `UPDATE ${currentTable} SET game_id = $1 WHERE id = $2 AND game_id = $3`,
    [nextOrderId, position.scheduleId, position.orderId],
  );
  return false;
}
