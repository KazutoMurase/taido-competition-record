import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
React.useLayoutEffect = React.useEffect;
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Container,
  Divider,
  FormControlLabel,
  Grid,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { Group, Layer, Rect, Stage, Text } from "react-konva";
import { applyTournamentLayout } from "../lib/tournament_layout";

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

const GROUP_COLORS = [
  "#fff59d",
  "#ffcc80",
  "#ef9a9a",
  "#ce93d8",
  "#9fa8da",
  "#90caf9",
  "#80cbc4",
  "#a5d6a7",
  "#e6ee9c",
  "#bcaaa4",
  "#b0bec5",
  "#f48fb1",
];

const PRINT_STAGE_WIDTH = 850;
const EDIT_STAGE_WIDTH = 930;
const EDIT_STAGE_OFFSET_X = 40;
const ALL_GROUPS_VALUE = "__all_groups__";

function cleanNumber(value) {
  const parsed = Number(value);
  return Number.isInteger(parsed) ? parsed : null;
}

function csvEscape(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
}

function downloadText(filename, text) {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function getSplitName(name) {
  if (!name) {
    return "";
  }
  if (name.length > 9) {
    return `${name.slice(0, 9)}\n${name.slice(9)}`;
  }
  return name;
}

function getGroupName(groupName) {
  if (!groupName) {
    return "";
  }
  return `【${groupName}】`;
}

function getGroupFontSize(groupName) {
  if (!groupName) {
    return 10;
  }
  if (groupName.length < 8) {
    return 14;
  }
  if (groupName.length < 10) {
    return 12;
  }
  return 10;
}

function buildPlayerMap(players) {
  const map = {};
  for (const player of players) {
    map[player.player_id] = player;
  }
  return map;
}

function enrichRows(rows, playerMap) {
  return rows.map((row) => {
    const left = playerMap[row.left_player_id] || {};
    const right = playerMap[row.right_player_id] || {};
    return {
      ...row,
      id: Number(row.original_id),
      left_name: left.name || "",
      left_name_kana: left.name_kana || "",
      left_group_id: left.group_id || "",
      left_group_name: left.group_name || "",
      left_mvp: left.mvp || "",
      left_rank_group: left.rank_group || "",
      left_rank_lastyear: left.rank_lastyear || "",
      left_rank_total: left.rank_total || "",
      right_name: right.name || "",
      right_name_kana: right.name_kana || "",
      right_group_id: right.group_id || "",
      right_group_name: right.group_name || "",
      right_mvp: right.mvp || "",
      right_rank_group: right.rank_group || "",
      right_rank_lastyear: right.rank_lastyear || "",
      right_rank_total: right.rank_total || "",
    };
  });
}

function getGroupColor(
  groupName,
  groupColorMap,
  colorByGroup,
  highlightedGroupName,
) {
  if (!colorByGroup || !groupName) {
    return null;
  }
  if (
    highlightedGroupName.length === 0 ||
    !highlightedGroupName.includes(groupName)
  ) {
    return null;
  }
  return groupColorMap[groupName] || null;
}

function isEditableSide(item, side) {
  if (side === "left") {
    return !("has_left" in item);
  }
  return !("has_right" in item);
}

function getMvpLabel(value) {
  if (value === 1 || value === "1") {
    return "最優秀";
  }
  if (value === 2 || value === "2") {
    return "優秀";
  }
  return "";
}

function getAuxiliaryLabel(item, prefix, auxiliaryMode) {
  if (auxiliaryMode === "total") {
    const value = item[`${prefix}_rank_total`];
    return value ? `全体${value}位` : "";
  }
  if (auxiliaryMode === "lastyear") {
    const value = item[`${prefix}_rank_lastyear`];
    return value ? `昨年度${value}位` : "";
  }
  if (auxiliaryMode === "group") {
    const value = item[`${prefix}_rank_group`];
    return value ? `団体内${value}位` : "";
  }
  if (auxiliaryMode === "mvp") {
    return getMvpLabel(item[`${prefix}_mvp`]);
  }
  return "";
}

function getAuxiliaryColor(item, prefix, auxiliaryMode) {
  if (auxiliaryMode === "group") {
    const value = item[`${prefix}_rank_group`];
    const colors = {
      1: "#d32f2f",
      2: "#1976d2",
      3: "#f57c00",
      4: "#388e3c",
    };
    return colors[value] || "#5f6368";
  }
  if (auxiliaryMode === "total" || auxiliaryMode === "lastyear") {
    return item[`${
      prefix
    }_${auxiliaryMode === "total" ? "rank_total" : "rank_lastyear"}`]
      ? "#d32f2f"
      : "#5f6368";
  }
  if (auxiliaryMode === "mvp") {
    return "#d32f2f";
  }
  return "#5f6368";
}

function PlayerText({
  item,
  side,
  y,
  isLeftBlock,
  yPadding,
  selectedSlot,
  onSelectSlot,
  groupColorMap,
  colorByGroup,
  highlightedGroupName,
  showPlayerIds,
  auxiliaryMode,
}) {
  const prefix = side === "left" ? "left" : "right";
  const name = item[`${prefix}_name`];
  const kana = item[`${prefix}_name_kana`];
  const playerId = item[`${prefix}_player_id`];
  const groupName = item[`${prefix}_group_name`];
  const x = isLeftBlock ? 0 : 630;
  const groupX = isLeftBlock ? 120 : 750;
  const playerIdX = isLeftBlock ? x - 32 : 850;
  const auxiliaryLabel = getAuxiliaryLabel(item, prefix, auxiliaryMode);
  const auxiliaryColor = getAuxiliaryColor(item, prefix, auxiliaryMode);
  const selected =
    selectedSlot &&
    selectedSlot.original_id === item.original_id &&
    selectedSlot.side === side;
  const fill = getGroupColor(
    groupName,
    groupColorMap,
    colorByGroup,
    highlightedGroupName,
  );
  const textY = y + yPadding;

  return (
    <>
      {fill ? (
        <Rect
          x={x - 4}
          y={textY - 22}
          width={isLeftBlock ? 205 : 220}
          height={38}
          fill={fill}
          opacity={0.45}
          cornerRadius={3}
        />
      ) : null}
      {selected ? (
        <Rect
          x={x - 5}
          y={textY - 24}
          width={isLeftBlock ? 210 : 225}
          height={42}
          stroke="#1976d2"
          strokeWidth={2}
          cornerRadius={3}
        />
      ) : null}
      <Text
        x={x}
        y={textY - 20}
        text={kana}
        fontSize={10}
        listening={true}
        onClick={() => onSelectSlot(item.original_id, side)}
        onTap={() => onSelectSlot(item.original_id, side)}
      />
      {showPlayerIds && playerId ? (
        <>
          <Rect
            x={playerIdX - 2}
            y={textY - 12}
            width={28}
            height={18}
            fill="#eef2f6"
            stroke="#9aa7b4"
            strokeWidth={1}
            cornerRadius={3}
            listening={true}
            onClick={() => onSelectSlot(item.original_id, side)}
            onTap={() => onSelectSlot(item.original_id, side)}
          />
          <Text
            x={playerIdX}
            y={textY - 9}
            text={playerId}
            width={24}
            align="center"
            fill="#4b5b68"
            fontSize={10}
            fontStyle="bold"
            listening={true}
            onClick={() => onSelectSlot(item.original_id, side)}
            onTap={() => onSelectSlot(item.original_id, side)}
          />
        </>
      ) : null}
      <Text
        x={x}
        y={textY - 7}
        text={getSplitName(name)}
        fontSize={name && name.length < 8 ? 18 : 14}
        listening={true}
        onClick={() => onSelectSlot(item.original_id, side)}
        onTap={() => onSelectSlot(item.original_id, side)}
      />
      <Text
        x={groupX}
        y={textY - 18}
        text={auxiliaryLabel}
        fontSize={11}
        fill={auxiliaryColor}
        fontStyle="bold"
        listening={Boolean(auxiliaryLabel)}
        onClick={() => onSelectSlot(item.original_id, side)}
        onTap={() => onSelectSlot(item.original_id, side)}
      />
      <Text
        x={groupX}
        y={textY - 2}
        text={getGroupName(groupName)}
        fontSize={getGroupFontSize(groupName)}
        listening={true}
        onClick={() => onSelectSlot(item.original_id, side)}
        onTap={() => onSelectSlot(item.original_id, side)}
      />
    </>
  );
}

function GameShape({
  item,
  lineWidth,
  maxHeight,
  yPadding,
  selectedGameId,
  onSelectGame,
}) {
  const isLeft = item.block_pos === "left";
  const isRight = item.block_pos === "right";
  const isCenter = !isLeft && !isRight;
  const displayId = item.draft_id || item.id;

  if (isCenter) {
    if (!("left_begin_y" in item)) {
      return null;
    }
    const round = item.round || item.fake_round || 2;
    const x = 220 + lineWidth + (round - 2) * 30;
    const width = 620 - lineWidth - (round - 2) * 30 - x;
    const centerX = x + width / 2;
    const isThirdPlace = "fake_round" in item;
    return (
      <>
        <Rect
          x={x}
          y={item.left_begin_y + yPadding}
          width={width}
          height={1}
          fill="black"
        />
        <Rect
          x={centerX}
          y={item.left_begin_y + yPadding}
          width={1}
          height={-50 + (isThirdPlace ? 0 : 20)}
          fill="black"
        />
        <Text
          x={centerX - 20}
          y={item.left_begin_y - 70 + (isThirdPlace ? 0 : 20) + yPadding}
          text={isThirdPlace ? "三決" : "決勝"}
          fontSize={18}
        />
        {selectedGameId === item.original_id ? (
          <Rect
            x={centerX - 16}
            y={item.left_begin_y - 5 + yPadding}
            width={30}
            height={30}
            stroke="#1976d2"
            strokeWidth={2}
            cornerRadius={3}
          />
        ) : null}
        <Text
          x={centerX - 8}
          y={item.left_begin_y + 5 + yPadding}
          text={String(displayId)}
          fill={selectedGameId === item.original_id ? "#1976d2" : "gray"}
          fontSize={12}
          listening={true}
          onClick={() => onSelectGame(item.original_id)}
          onTap={() => onSelectGame(item.original_id)}
        />
      </>
    );
  }

  if (!("left_begin_y" in item) || !("right_begin_y" in item)) {
    return null;
  }
  const pointX = isLeft ? 220 : 620;
  const hasLeft = "has_left" in item;
  const hasRight = "has_right" in item;
  const joinX =
    pointX + (lineWidth + (item.round - 1) * 30) * (isLeft ? 1 : -1);
  const joinY =
    (item.left_begin_y + item.right_begin_y) * 0.5 +
    (item.offset_y || 0) +
    yPadding;

  return (
    <>
      <Rect
        x={
          pointX +
          (hasLeft ? lineWidth + (item.round - 2) * 30 : 0) * (isLeft ? 1 : -1)
        }
        y={item.left_begin_y + yPadding}
        width={
          (hasLeft ? 30 : lineWidth + (item.round - 1) * 30) * (isLeft ? 1 : -1)
        }
        height={1}
        fill="black"
      />
      <Rect
        x={
          pointX +
          (hasRight ? lineWidth + (item.round - 2) * 30 : 0) * (isLeft ? 1 : -1)
        }
        y={item.right_begin_y + yPadding}
        width={
          (hasRight ? 30 : lineWidth + (item.round - 1) * 30) *
          (isLeft ? 1 : -1)
        }
        height={1}
        fill="black"
      />
      <Rect
        x={joinX}
        y={(isLeft ? item.left_begin_y : item.right_begin_y) + yPadding}
        width={1}
        height={
          (item.left_begin_y - item.right_begin_y) * 0.5 * (isLeft ? -1 : 1) +
          (item.offset_y || 0)
        }
        fill="black"
      />
      <Rect
        x={joinX}
        y={joinY}
        width={1}
        height={
          (item.left_begin_y - item.right_begin_y) * 0.5 * (isLeft ? -1 : 1) -
          (item.offset_y || 0)
        }
        fill="black"
      />
      {selectedGameId === item.original_id ? (
        <Rect
          x={isLeft ? joinX - 22 : joinX - 3}
          y={joinY - 15}
          width={30}
          height={30}
          stroke="#1976d2"
          strokeWidth={2}
          cornerRadius={3}
        />
      ) : null}
      <Text
        x={isLeft ? joinX - 15 : joinX + 5}
        y={joinY - 5}
        text={String(displayId)}
        fill={selectedGameId === item.original_id ? "#1976d2" : "gray"}
        fontSize={12}
        listening={true}
        onClick={() => onSelectGame(item.original_id)}
        onTap={() => onSelectGame(item.original_id)}
      />
    </>
  );
}

function TournamentCanvas({
  rows,
  colorByGroup,
  highlightedGroupName,
  auxiliaryMode,
  printMode,
  selectedSlot,
  selectedGameId,
  onSelectSlot,
  onSelectGame,
}) {
  const roundNum = Math.max(
    1,
    ...rows.map((row) => Number(row.round)).filter((value) => !isNaN(value)),
  );
  const lineWidth = roundNum > 6 ? 25 : 50;
  const maxHeight = rows.reduce((height, row) => {
    return Math.max(height, row.left_begin_y || 0, row.right_begin_y || 0);
  }, 0);
  const yPadding = maxHeight < 200 ? 50 : 0;
  const stageWidth = printMode ? PRINT_STAGE_WIDTH : EDIT_STAGE_WIDTH;
  const stageOffsetX = printMode ? 0 : EDIT_STAGE_OFFSET_X;
  const groupColorMap = useMemo(() => {
    const groupNames = Array.from(
      new Set(
        rows
          .flatMap((row) => [row.left_group_name, row.right_group_name])
          .filter(Boolean),
      ),
    ).sort();
    return Object.fromEntries(
      groupNames.map((name, index) => [
        name,
        GROUP_COLORS[index % GROUP_COLORS.length],
      ]),
    );
  }, [rows]);

  return (
    <Box
      className="tournament-print-area"
      sx={{
        width: `${stageWidth}px`,
        minHeight: maxHeight + 70 + yPadding,
        overflow: "hidden",
        margin: "0 auto",
      }}
    >
      <Stage width={stageWidth} height={maxHeight + 70 + yPadding}>
        <Layer>
          <Group x={stageOffsetX}>
            {rows.map((item) => (
              <GameShape
                key={`game-${item.original_id}`}
                item={item}
                lineWidth={lineWidth}
                maxHeight={maxHeight}
                yPadding={yPadding}
                selectedGameId={selectedGameId}
                onSelectGame={onSelectGame}
              />
            ))}
            {rows.map((item) => {
              const isLeftBlock = item.block_pos === "left";
              const isRightBlock = item.block_pos === "right";
              if (!isLeftBlock && !isRightBlock) {
                return null;
              }
              return (
                <React.Fragment key={`players-${item.original_id}`}>
                  {isEditableSide(item, "left") ? (
                    <PlayerText
                      item={item}
                      side="left"
                      y={item.left_begin_y}
                      isLeftBlock={isLeftBlock}
                      yPadding={yPadding}
                      selectedSlot={selectedSlot}
                      onSelectSlot={onSelectSlot}
                      groupColorMap={groupColorMap}
                      colorByGroup={colorByGroup && !printMode}
                      highlightedGroupName={highlightedGroupName}
                      showPlayerIds={!printMode}
                      auxiliaryMode={printMode ? "none" : auxiliaryMode}
                    />
                  ) : null}
                  {isEditableSide(item, "right") ? (
                    <PlayerText
                      item={item}
                      side="right"
                      y={item.right_begin_y}
                      isLeftBlock={isLeftBlock}
                      yPadding={yPadding}
                      selectedSlot={selectedSlot}
                      onSelectSlot={onSelectSlot}
                      groupColorMap={groupColorMap}
                      colorByGroup={colorByGroup && !printMode}
                      highlightedGroupName={highlightedGroupName}
                      showPlayerIds={!printMode}
                      auxiliaryMode={printMode ? "none" : auxiliaryMode}
                    />
                  ) : null}
                </React.Fragment>
              );
            })}
          </Group>
        </Layer>
      </Stage>
    </Box>
  );
}

function validateRows(rows, players) {
  const warnings = [];
  const playerIds = new Set(players.map((player) => player.player_id));
  const usedPlayerIds = rows
    .flatMap((row) => [row.left_player_id, row.right_player_id])
    .filter(Boolean);
  const usedCounts = {};
  for (const playerId of usedPlayerIds) {
    usedCounts[playerId] = (usedCounts[playerId] || 0) + 1;
  }
  for (const [playerId, count] of Object.entries(usedCounts)) {
    if (count > 1) {
      warnings.push({
        type: "error",
        text: `選手ID ${playerId} が ${count} 箇所に入っています。`,
      });
    }
    if (!playerIds.has(playerId)) {
      warnings.push({
        type: "error",
        text: `選手ID ${playerId} は players.csv の対象カラムに存在しません。`,
      });
    }
  }
  const missingPlayers = players
    .map((player) => player.player_id)
    .filter((playerId) => !usedCounts[playerId]);
  if (missingPlayers.length > 0) {
    warnings.push({
      type: "warning",
      text: `未配置の選手IDがあります: ${missingPlayers.join(", ")}`,
    });
  }

  const draftIds = rows.map((row) => cleanNumber(row.draft_id));
  const idCounts = {};
  for (const draftId of draftIds) {
    if (draftId == null) {
      warnings.push({ type: "error", text: "数字でない試合番号があります。" });
      continue;
    }
    idCounts[draftId] = (idCounts[draftId] || 0) + 1;
    if (draftId < 1 || draftId > rows.length) {
      warnings.push({
        type: "error",
        text: `試合番号 ${draftId} は 1〜${rows.length} の範囲外です。`,
      });
    }
  }
  for (const [draftId, count] of Object.entries(idCounts)) {
    if (count > 1) {
      warnings.push({
        type: "error",
        text: `試合番号 ${draftId} が ${count} 箇所にあります。`,
      });
    }
  }
  const missingIds = [];
  for (let id = 1; id <= rows.length; id++) {
    if (!idCounts[id]) {
      missingIds.push(id);
    }
  }
  if (missingIds.length > 0) {
    warnings.push({
      type: "error",
      text: `欠けている試合番号があります: ${missingIds.join(", ")}`,
    });
  }
  return warnings;
}

function rowsToCsv(rows) {
  const idMap = {};
  for (const row of rows) {
    idMap[row.original_id] = cleanNumber(row.draft_id);
  }
  const outputRows = rows
    .map((row) => ({
      id: idMap[row.original_id],
      left_player_id: row.left_player_id || "",
      right_player_id: row.right_player_id || "",
      next_left_id: row.next_left_id ? idMap[row.next_left_id] || "" : "",
      next_right_id: row.next_right_id ? idMap[row.next_right_id] || "" : "",
      left_player_flag: row.left_player_flag ?? "",
      left_retire: row.left_retire ?? "",
      right_retire: row.right_retire ?? "",
    }))
    .sort((a, b) => Number(a.id) - Number(b.id));
  return [
    CSV_HEADER.join(","),
    ...outputRows.map((row) =>
      CSV_HEADER.map((header) => csvEscape(row[header])).join(","),
    ),
  ].join("\n");
}

function getSelectedPlayerDetails(row, side) {
  if (!row || !side) {
    return null;
  }
  return {
    player_id: row[`${side}_player_id`] || "",
    name: row[`${side}_name`] || "",
    name_kana: row[`${side}_name_kana`] || "",
    group_name: row[`${side}_group_name`] || "",
    rank_group: row[`${side}_rank_group`] || "",
    rank_lastyear: row[`${side}_rank_lastyear`] || "",
    rank_total: row[`${side}_rank_total`] || "",
    mvp: row[`${side}_mvp`] || "",
  };
}

export default function TournamentEditor({ competition, eventName }) {
  const [rows, setRows] = useState([]);
  const [players, setPlayers] = useState([]);
  const [eventInfo, setEventInfo] = useState({
    full_name: "",
    description: [],
  });
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [selectedGameId, setSelectedGameId] = useState(null);
  const [colorByGroup, setColorByGroup] = useState(false);
  const [highlightedGroupName, setHighlightedGroupName] = useState([]);
  const [auxiliaryMode, setAuxiliaryMode] = useState("none");
  const [printMode, setPrintMode] = useState(false);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const playerInputRef = useRef(null);
  const gameInputRef = useRef(null);

  const playerMap = useMemo(() => buildPlayerMap(players), [players]);
  const layoutRows = useMemo(
    () => applyTournamentLayout(enrichRows(rows, playerMap)),
    [rows, playerMap],
  );
  const warnings = useMemo(() => validateRows(rows, players), [rows, players]);
  const groupOptions = useMemo(() => {
    return Array.from(
      new Set(
        layoutRows
          .flatMap((row) => [row.left_group_name, row.right_group_name])
          .filter(Boolean),
      ),
    ).sort();
  }, [layoutRows]);
  const allGroupsSelected =
    groupOptions.length > 0 &&
    highlightedGroupName.length === groupOptions.length;
  const selectedRow = selectedSlot
    ? rows.find((row) => row.original_id === selectedSlot.original_id)
    : null;
  const selectedLayoutRow = selectedSlot
    ? layoutRows.find((row) => row.original_id === selectedSlot.original_id)
    : null;
  const selectedGame = selectedGameId
    ? rows.find((row) => row.original_id === selectedGameId)
    : null;
  const selectedPlayerDetails =
    selectedLayoutRow && selectedSlot
      ? getSelectedPlayerDetails(selectedLayoutRow, selectedSlot.side)
      : null;
  const hasFatalWarnings = warnings.some((warning) => warning.type === "error");

  const loadTournament = useCallback(async () => {
    setError("");
    const response = await fetch(
      `/api/edit_tournament/load?competition=${competition}&event_name=${eventName}`,
    );
    const result = await response.json();
    if (!response.ok) {
      throw new Error(result.error || "failed to load tournament");
    }
    setRows(result.rows);
    setPlayers(result.players);
    setEventInfo(result.event_info);
  }, [competition, eventName]);

  useEffect(() => {
    if (!competition || !eventName) {
      return;
    }
    loadTournament().catch((e) => setError(e.message));
  }, [competition, eventName, loadTournament]);

  useEffect(() => {
    const enterPrintMode = () => setPrintMode(true);
    const leavePrintMode = () => setPrintMode(false);
    window.addEventListener("beforeprint", enterPrintMode);
    window.addEventListener("afterprint", leavePrintMode);
    return () => {
      window.removeEventListener("beforeprint", enterPrintMode);
      window.removeEventListener("afterprint", leavePrintMode);
    };
  }, []);

  const updateRow = (originalId, patch) => {
    setRows((prevRows) =>
      prevRows.map((row) =>
        row.original_id === originalId ? { ...row, ...patch } : row,
      ),
    );
  };

  const handleSelectSlot = (originalId, side) => {
    setSelectedSlot({ original_id: originalId, side });
    setSelectedGameId(null);
    window.setTimeout(() => {
      playerInputRef.current?.focus();
      playerInputRef.current?.select();
    }, 0);
  };

  const handleSelectGame = (originalId) => {
    setSelectedGameId(originalId);
    setSelectedSlot(null);
    window.setTimeout(() => {
      gameInputRef.current?.focus();
      gameInputRef.current?.select();
    }, 0);
  };

  const handlePlayerChange = (value) => {
    if (!selectedSlot) {
      return;
    }
    updateRow(selectedSlot.original_id, {
      [`${selectedSlot.side}_player_id`]: value.trim(),
    });
  };

  const handleExportCsv = () => {
    if (hasFatalWarnings) {
      return;
    }
    downloadText(`${eventName}.csv`, `${rowsToCsv(rows)}\n`);
  };

  const handleSave = async () => {
    if (hasFatalWarnings || rows.length === 0 || isSaving) {
      return;
    }
    const confirmed = window.confirm(
      `${eventName}.csv とDBを現在の編集内容で保存します。よろしいですか？`,
    );
    if (!confirmed) {
      return;
    }
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const response = await fetch("/api/edit_tournament/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition,
          event_name: eventName,
          rows,
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "failed to save tournament");
      }
      await loadTournament();
      setSelectedSlot(null);
      setSelectedGameId(null);
      setSaveStatus({
        type: "success",
        text: `保存しました。CSV: ${result.saved_csv}`,
      });
    } catch (e) {
      setSaveStatus({
        type: "error",
        text: e.message,
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handlePrint = () => {
    setPrintMode(true);
    window.setTimeout(() => window.print(), 0);
  };

  return (
    <Container className="edit-page-root" maxWidth={false} sx={{ py: 2 }}>
      <style jsx global>{`
        @media print {
          .edit-controls {
            display: none !important;
          }
          body {
            background: white !important;
          }
          .edit-page-root {
            padding: 0 !important;
            margin: 0 auto !important;
          }
          .edit-layout {
            margin: 0 !important;
            width: auto !important;
            display: block !important;
          }
          .edit-main {
            padding: 0 !important;
            max-width: none !important;
            width: 100% !important;
            flex-basis: 100% !important;
          }
          .edit-paper {
            padding: 0 !important;
            box-shadow: none !important;
            overflow: visible !important;
          }
          .tournament-print-area {
            margin: 0 auto !important;
          }
        }
      `}</style>
      <Grid className="edit-layout" container spacing={2}>
        <Grid className="edit-main" item xs={12} lg={9}>
          <Paper
            className="edit-paper"
            sx={{ p: 2, overflowX: "auto" }}
            elevation={1}
          >
            <Box sx={{ textAlign: "center", mb: 1 }}>
              <Grid
                container
                justifyContent="center"
                alignItems="center"
                style={{ height: "70px" }}
              >
                <h1>
                  <u>{eventInfo.full_name || eventName}</u>
                </h1>
              </Grid>
              {eventInfo.description.map((text, index) => (
                <Grid
                  key={index}
                  container
                  justifyContent="center"
                  alignItems="center"
                  style={{ height: "20px" }}
                >
                  {text}
                </Grid>
              ))}
            </Box>
            {error ? (
              <Alert severity="error">{error}</Alert>
            ) : (
              <TournamentCanvas
                rows={layoutRows}
                colorByGroup={colorByGroup}
                highlightedGroupName={highlightedGroupName}
                auxiliaryMode={auxiliaryMode}
                printMode={printMode}
                selectedSlot={printMode ? null : selectedSlot}
                selectedGameId={printMode ? null : selectedGameId}
                onSelectSlot={handleSelectSlot}
                onSelectGame={handleSelectGame}
              />
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} lg={3} className="edit-controls">
          <Paper sx={{ p: 2, position: "sticky", top: 16 }} elevation={1}>
            <Stack spacing={2}>
              <Box>
                <Typography variant="h6">編集</Typography>
                <Typography variant="body2" color="text.secondary">
                  選手名または試合番号をクリックして編集します。
                </Typography>
              </Box>
              <FormControlLabel
                control={
                  <Checkbox
                    checked={colorByGroup}
                    onChange={(event) => setColorByGroup(event.target.checked)}
                  />
                }
                label="所属色を表示"
              />
              <TextField
                select
                label="所属色の対象"
                value={highlightedGroupName}
                onChange={(event) => {
                  const value = event.target.value;
                  const selected = Array.isArray(value)
                    ? value
                    : value.split(",");
                  if (selected.includes(ALL_GROUPS_VALUE)) {
                    setHighlightedGroupName(
                      allGroupsSelected ? [] : groupOptions,
                    );
                    return;
                  }
                  setHighlightedGroupName(
                    Array.isArray(value) ? value : value.split(","),
                  );
                }}
                fullWidth
                size="small"
                disabled={!colorByGroup}
                SelectProps={{
                  multiple: true,
                  displayEmpty: true,
                  renderValue: (selected) =>
                    selected.length === 0 ? "なし" : selected.join(", "),
                }}
              >
                <MenuItem value={ALL_GROUPS_VALUE}>
                  <Checkbox checked={allGroupsSelected} size="small" />
                  全選択
                </MenuItem>
                {groupOptions.map((groupName) => (
                  <MenuItem key={groupName} value={groupName}>
                    <Checkbox
                      checked={highlightedGroupName.includes(groupName)}
                      size="small"
                    />
                    {groupName}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="補助表示"
                value={auxiliaryMode}
                onChange={(event) => setAuxiliaryMode(event.target.value)}
                fullWidth
                size="small"
              >
                <MenuItem value="none">なし</MenuItem>
                <MenuItem value="total">全体</MenuItem>
                <MenuItem value="lastyear">昨年度</MenuItem>
                <MenuItem value="group">団体内</MenuItem>
                <MenuItem value="mvp">MVP</MenuItem>
              </TextField>
              <Divider />
              {selectedRow && selectedSlot ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    選手位置
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    元試合ID: {selectedRow.original_id} /{" "}
                    {selectedSlot.side === "left" ? "左" : "右"}
                  </Typography>
                  <TextField
                    inputRef={playerInputRef}
                    label="選手ID"
                    value={selectedRow[`${selectedSlot.side}_player_id`] || ""}
                    onChange={(event) => handlePlayerChange(event.target.value)}
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                  <TextField
                    select
                    label="players.csv から選択"
                    value={selectedRow[`${selectedSlot.side}_player_id`] || ""}
                    onChange={(event) => handlePlayerChange(event.target.value)}
                    fullWidth
                    size="small"
                  >
                    <MenuItem value="">空欄</MenuItem>
                    {players.map((player) => (
                      <MenuItem key={player.player_id} value={player.player_id}>
                        {player.player_id} {player.name}{" "}
                        {getGroupName(player.group_name)}
                      </MenuItem>
                    ))}
                  </TextField>
                  {selectedPlayerDetails ? (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="subtitle2" sx={{ mb: 0.5 }}>
                        選手情報
                      </Typography>
                      <Typography variant="body2">
                        氏名: {selectedPlayerDetails.name || "-"}
                      </Typography>
                      <Typography variant="body2">
                        ふりがな: {selectedPlayerDetails.name_kana || "-"}
                      </Typography>
                      <Typography variant="body2">
                        所属: {selectedPlayerDetails.group_name || "-"}
                      </Typography>
                      <Typography variant="body2">
                        団体内ランク: {selectedPlayerDetails.rank_group || "-"}
                      </Typography>
                      <Typography variant="body2">
                        昨年度同大会ランク:{" "}
                        {selectedPlayerDetails.rank_lastyear || "-"}
                      </Typography>
                      <Typography variant="body2">
                        全体ランク:{" "}
                        {selectedPlayerDetails.rank_total || "-"}
                      </Typography>
                      <Typography variant="body2">
                        MVP: {getMvpLabel(selectedPlayerDetails.mvp) || "-"}
                      </Typography>
                    </Box>
                  ) : null}
                </Box>
              ) : selectedGame ? (
                <Box>
                  <Typography variant="subtitle1" sx={{ mb: 1 }}>
                    試合順
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    元試合ID: {selectedGame.original_id}
                  </Typography>
                  <TextField
                    inputRef={gameInputRef}
                    label="表示/出力する試合番号"
                    value={selectedGame.draft_id}
                    onChange={(event) =>
                      updateRow(selectedGame.original_id, {
                        draft_id: event.target.value,
                      })
                    }
                    fullWidth
                    margin="normal"
                    size="small"
                  />
                </Box>
              ) : (
                <Alert severity="info">
                  トーナメント上の選手または試合番号を選択してください。
                </Alert>
              )}
              <Divider />
              <Box>
                <Typography variant="subtitle1" sx={{ mb: 1 }}>
                  警告
                </Typography>
                <Stack spacing={1}>
                  {warnings.length === 0 ? (
                    <Alert severity="success">CSV出力可能です。</Alert>
                  ) : (
                    warnings.map((warning, index) => (
                      <Alert severity={warning.type} key={index}>
                        {warning.text}
                      </Alert>
                    ))
                  )}
                </Stack>
              </Box>
              <Divider />
              <Stack direction="row" spacing={1}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleSave}
                  disabled={hasFatalWarnings || rows.length === 0 || isSaving}
                >
                  {isSaving ? "保存中" : "保存"}
                </Button>
                <Button
                  variant="outlined"
                  onClick={handleExportCsv}
                  disabled={hasFatalWarnings || rows.length === 0}
                >
                  CSV出力
                </Button>
                <Button variant="outlined" onClick={handlePrint}>
                  PDF出力
                </Button>
              </Stack>
              {saveStatus ? (
                <Alert severity={saveStatus.type}>{saveStatus.text}</Alert>
              ) : null}
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
}
