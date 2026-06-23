function updateBlockPosition(sortedData, item, blockIndices, value, round) {
  if ("prev_left_id" in item) {
    updateBlockPosition(
      sortedData,
      sortedData[item.prev_left_id],
      blockIndices,
      value,
      round - 1,
    );
  }
  if (!("prev_left_id" in item) || !("prev_right_id" in item)) {
    if (value === "left") {
      blockIndices.push(item.id);
    } else {
      blockIndices.splice(0, 0, item.id);
    }
  }
  if ("prev_right_id" in item) {
    updateBlockPosition(
      sortedData,
      sortedData[item.prev_right_id],
      blockIndices,
      value,
      round - 1,
    );
  }
  item.round = round;
  item.block_pos = value;
}

export function applyTournamentLayout(rows) {
  const sortedData = rows
    .map((row) => ({ ...row }))
    .sort((a, b) => Number(a.id) - Number(b.id));

  const byId = new Map();
  for (const item of sortedData) {
    byId.set(Number(item.id), item);
    item.id = Number(item.id);
    item.next_left_id =
      item.next_left_id === "" || item.next_left_id == null
        ? null
        : Number(item.next_left_id);
    item.next_right_id =
      item.next_right_id === "" || item.next_right_id == null
        ? null
        : Number(item.next_right_id);
  }

  let roundNum = {};
  for (let i = 0; i < sortedData.length; i++) {
    if (i === sortedData.length - 2) {
      sortedData[i].fake_round = sortedData[i - 1].round + 1;
    } else if (!("round" in sortedData[i])) {
      if (i === 0 || sortedData[i - 1].round === 1) {
        sortedData[i].round = 1;
      } else {
        sortedData[i].round = 2;
      }
    }

    const nextLeftItem = byId.get(sortedData[i].next_left_id);
    if (nextLeftItem !== undefined) {
      nextLeftItem.has_left = true;
      let updateRound = sortedData[i].round + 1;
      if ("round" in nextLeftItem && nextLeftItem.round !== updateRound) {
        if (nextLeftItem.round < updateRound) {
          if ("prev_left_id" in nextLeftItem) {
            sortedData[nextLeftItem.prev_left_id].round = updateRound - 1;
          } else if ("prev_right_id" in nextLeftItem) {
            sortedData[nextLeftItem.prev_right_id].round = updateRound - 1;
          }
        } else {
          updateRound = nextLeftItem.round;
          if ("prev_left_id" in nextLeftItem) {
            sortedData[i].round = updateRound - 1;
          } else if ("prev_right_id" in nextLeftItem) {
            sortedData[i].round = updateRound - 1;
          }
        }
      }
      nextLeftItem.round = updateRound;
      nextLeftItem.prev_left_id = i;
    }

    const nextRightItem = byId.get(sortedData[i].next_right_id);
    if (nextRightItem !== undefined) {
      nextRightItem.has_right = true;
      let updateRound = sortedData[i].round + 1;
      if ("round" in nextRightItem && nextRightItem.round !== updateRound) {
        if (nextRightItem.round < updateRound) {
          if ("prev_left_id" in nextRightItem) {
            sortedData[nextRightItem.prev_left_id].round = updateRound - 1;
          } else if ("prev_right_id" in nextRightItem) {
            sortedData[nextRightItem.prev_right_id].round = updateRound - 1;
          }
        } else {
          updateRound = nextRightItem.round;
          if ("prev_left_id" in nextRightItem) {
            sortedData[i].round = updateRound - 1;
          } else if ("prev_right_id" in nextRightItem) {
            sortedData[i].round = updateRound - 1;
          }
        }
      }
      nextRightItem.round = updateRound;
      nextRightItem.prev_right_id = i;
    }
  }

  let leftBlockIndices = [];
  let rightBlockIndices = [];
  if (
    sortedData.length > 3 &&
    "prev_left_id" in sortedData[sortedData.length - 1] &&
    "prev_right_id" in sortedData[sortedData.length - 1]
  ) {
    sortedData[sortedData.length - 1].block_pos = "center";
    sortedData[sortedData.length - 2].block_pos = "center";
    const leftBlockId = sortedData[sortedData.length - 1].prev_left_id;
    const rightBlockId = sortedData[sortedData.length - 1].prev_right_id;
    updateBlockPosition(
      sortedData,
      sortedData[leftBlockId],
      leftBlockIndices,
      "left",
      sortedData[leftBlockId].round,
    );
    updateBlockPosition(
      sortedData,
      sortedData[rightBlockId],
      rightBlockIndices,
      "right",
      sortedData[rightBlockId].round,
    );
  }

  for (let i = 0; i < sortedData.length; i++) {
    if (roundNum[sortedData[i].round] === undefined) {
      roundNum[sortedData[i].round] = 1;
    } else {
      roundNum[sortedData[i].round] += 1;
    }
  }
  for (let i = 0; i < sortedData.length; i++) {
    let gameId = sortedData[i].id;
    const round = sortedData[i].round;
    for (let j = 0; j < round - 1; j++) {
      gameId -= roundNum[j + 1];
    }
    if (roundNum[round] > 1) {
      sortedData[i].game_id = gameId;
    }
  }

  let maxBeginY = 0;
  let beginY = 25;
  for (let i = 0; i < leftBlockIndices.length; i++) {
    const item = byId.get(leftBlockIndices[i]);
    if (!item) continue;
    if (item.round === 1) {
      item.left_begin_y = beginY;
      beginY += 40;
      item.right_begin_y = beginY;
      beginY += 40;
    } else {
      if (!("has_left" in item)) {
        item.left_begin_y = beginY;
        beginY += 40;
      }
      if (!("has_right" in item)) {
        item.right_begin_y = beginY;
        beginY += 40;
      }
    }
  }
  maxBeginY = beginY;
  beginY = 25;
  for (let i = 0; i < rightBlockIndices.length; i++) {
    const item = byId.get(rightBlockIndices[i]);
    if (!item) continue;
    if (item.round === 1) {
      item.right_begin_y = beginY;
      beginY += 40;
      item.left_begin_y = beginY;
      beginY += 40;
      if (item.next_left_id !== null) {
        const nextItem = byId.get(item.next_left_id);
        if (nextItem) {
          nextItem.left_begin_y = (item.left_begin_y + item.right_begin_y) / 2;
        }
      } else {
        const nextItem = byId.get(item.next_right_id);
        if (nextItem) {
          nextItem.right_begin_y = (item.left_begin_y + item.right_begin_y) / 2;
        }
      }
    } else {
      if (!("has_right" in item)) {
        item.right_begin_y = beginY;
        beginY += 40;
      }
      if (!("has_left" in item)) {
        item.left_begin_y = beginY;
        beginY += 40;
      }
    }
  }
  maxBeginY = Math.max(beginY, maxBeginY);

  let semiFinalRightId = -1;
  for (let i = 0; i < sortedData.length; i++) {
    if (sortedData[i].next_left_id !== null) {
      const nextItem = byId.get(sortedData[i].next_left_id);
      if (nextItem) {
        nextItem.left_begin_y =
          (sortedData[i].left_begin_y + sortedData[i].right_begin_y) / 2;
      }
    } else if (sortedData[i].next_right_id !== null) {
      const nextItem = byId.get(sortedData[i].next_right_id);
      if (nextItem) {
        nextItem.right_begin_y =
          (sortedData[i].left_begin_y + sortedData[i].right_begin_y) / 2;
      }
      if (sortedData[i].next_right_id === sortedData.length) {
        semiFinalRightId = i;
      }
    }
  }
  if (
    sortedData.length > 1 &&
    semiFinalRightId !== -1 &&
    sortedData[sortedData.length - 1].left_begin_y !==
      sortedData[sortedData.length - 1].right_begin_y
  ) {
    sortedData[semiFinalRightId].offset_y =
      sortedData[sortedData.length - 1].left_begin_y -
      sortedData[sortedData.length - 1].right_begin_y;
  }
  if (sortedData.length > 2) {
    sortedData[sortedData.length - 2].left_begin_y = maxBeginY + 50;
  }
  return sortedData;
}
