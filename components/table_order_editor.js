import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Typography,
} from "@mui/material";

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

function headerForEvent(eventName) {
  return eventName.includes("tenkai") ? TENKAI_HEADER : DANTAI_HOKEI_HEADER;
}

function rowsToCsv(rows, eventName) {
  const header = headerForEvent(eventName);
  const outputRows = rows.map((row, index) => ({
    ...row,
    id: index + 1,
  }));
  return [
    header.join(","),
    ...outputRows.map((row) =>
      header.map((column) => csvEscape(row[column])).join(","),
    ),
  ].join("\n");
}

function moveItem(items, fromIndex, toIndex) {
  if (
    fromIndex === toIndex ||
    fromIndex < 0 ||
    toIndex < 0 ||
    fromIndex >= items.length ||
    toIndex >= items.length
  ) {
    return items;
  }
  const nextItems = [...items];
  const [item] = nextItems.splice(fromIndex, 1);
  nextItems.splice(toIndex, 0, item);
  return nextItems;
}

function isEntryRow(row) {
  return Boolean(row.group_id);
}

function detectFinalRound(rows) {
  const blankRounds = rows
    .filter((row) => !isEntryRow(row))
    .map((row) => Number(row.round))
    .filter((round) => Number.isFinite(round) && round > 0);
  if (blankRounds.length > 0) {
    return Math.max(...blankRounds);
  }
  return Math.max(
    2,
    ...rows
      .map((row) => Number(row.round))
      .filter((round) => Number.isFinite(round) && round > 0),
  );
}

function detectCourtCount(rows) {
  return Math.max(1, Math.min(3, detectFinalRound(rows) - 1));
}

function normalizeRowsForCourtCount(rows, courtCount) {
  const finalRound = courtCount + 1;
  const preliminaryRounds = Array.from(
    { length: courtCount },
    (_, index) => index + 1,
  );
  return rows.map((row) => {
    if (!isEntryRow(row)) {
      return { ...row, round: finalRound };
    }
    const round = Number(row.round);
    return {
      ...row,
      round: preliminaryRounds.includes(round) ? round : 1,
    };
  });
}

function sortRowsForSave(rows) {
  return rows
    .map((row, index) => ({ row, index }))
    .sort((a, b) => {
      const roundDiff = Number(a.row.round) - Number(b.row.round);
      if (roundDiff !== 0) {
        return roundDiff;
      }
      return a.index - b.index;
    })
    .map(({ row }) => row);
}

function defaultBreakPositions(totalRows, courtCount) {
  if (courtCount <= 1 || totalRows <= 1) {
    return [];
  }
  const maxBreaks = Math.min(courtCount - 1, totalRows - 1);
  return Array.from({ length: maxBreaks }, (_, index) =>
    Math.round(((index + 1) * totalRows) / courtCount),
  ).map((position, index, positions) => {
    const min = index + 1;
    const max = totalRows - positions.length + index;
    return Math.max(min, Math.min(max, position));
  });
}

function breakPositionsFromRows(entryRows, courtCount) {
  const breaks = [];
  let count = 0;
  for (let round = 1; round < courtCount; round += 1) {
    count += entryRows.filter((row) => Number(row.round) === round).length;
    breaks.push(count);
  }
  const validBreaks = breaks
    .filter((position) => Number.isInteger(position))
    .filter((position) => position > 0 && position < entryRows.length);
  if (validBreaks.length !== courtCount - 1) {
    return defaultBreakPositions(entryRows.length, courtCount);
  }
  return validBreaks;
}

function applyBreakPositions(entryRows, breakPositions, courtCount) {
  const sortedBreaks = [...breakPositions].sort((a, b) => a - b);
  return entryRows.map((row, index) => {
    const round =
      sortedBreaks.filter((position) => index >= position).length + 1;
    return { ...row, round: Math.min(round, courtCount) };
  });
}

export default function TableOrderEditor({
  competition,
  eventName,
  onBackToList = null,
}) {
  const [rows, setRows] = useState([]);
  const [eventInfo, setEventInfo] = useState({
    full_name: "",
    description: [],
  });
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [courtCount, setCourtCount] = useState(1);

  const loadOrder = useCallback(
    async (showLoading = true) => {
      setError("");
      if (showLoading) {
        setIsLoading(true);
      }
      const response = await fetch(
        `/api/edit_tournament/load_table_order?competition=${competition}&event_name=${eventName}`,
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "failed to load table order");
      }
      const detectedCourtCount = detectCourtCount(result.rows);
      setCourtCount(detectedCourtCount);
      setRows(normalizeRowsForCourtCount(result.rows, detectedCourtCount));
      setEventInfo(result.event_info);
    },
    [competition, eventName],
  );

  useEffect(() => {
    if (!competition || !eventName) {
      return;
    }
    loadOrder()
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [competition, eventName, loadOrder]);

  const entryRows = useMemo(() => rows.filter(isEntryRow), [rows]);
  const fixedRows = useMemo(
    () => rows.filter((row) => !isEntryRow(row)),
    [rows],
  );
  const breakPositions = useMemo(
    () => breakPositionsFromRows(entryRows, courtCount),
    [courtCount, entryRows],
  );

  const setEntryRows = (nextEntryRows) => {
    setRows(sortRowsForSave([...nextEntryRows, ...fixedRows]));
    setSaveStatus(null);
  };

  const handleMove = (fromIndex, toIndex) => {
    setEntryRows(
      applyBreakPositions(
        moveItem(entryRows, fromIndex, toIndex),
        breakPositions,
        courtCount,
      ),
    );
  };

  const handleCourtCountChange = (event) => {
    const nextCourtCount = Number(event.target.value);
    setCourtCount(nextCourtCount);
    setRows((currentRows) => {
      const normalizedRows = normalizeRowsForCourtCount(
        currentRows,
        nextCourtCount,
      );
      const normalizedEntryRows = normalizedRows.filter(isEntryRow);
      const normalizedFixedRows = normalizedRows.filter(
        (row) => !isEntryRow(row),
      );
      return sortRowsForSave([
        ...applyBreakPositions(
          normalizedEntryRows,
          defaultBreakPositions(normalizedEntryRows.length, nextCourtCount),
          nextCourtCount,
        ),
        ...normalizedFixedRows,
      ]);
    });
    setSaveStatus(null);
  };

  const handleSeparatorMove = (separatorIndex, direction) => {
    const nextBreakPositions = breakPositions.map((position, index) =>
      index === separatorIndex ? position + direction : position,
    );
    const uniqueBreaks = [...new Set(nextBreakPositions)].sort((a, b) => a - b);
    if (uniqueBreaks.length !== breakPositions.length) {
      return;
    }
    if (
      uniqueBreaks.some(
        (position) => position <= 0 || position >= entryRows.length,
      )
    ) {
      return;
    }
    setEntryRows(applyBreakPositions(entryRows, uniqueBreaks, courtCount));
  };

  const handleDragStart = (event, index) => {
    event.dataTransfer.setData("row-index", String(index));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData("row-index"));
    if (Number.isInteger(fromIndex)) {
      handleMove(fromIndex, index);
    }
  };

  const handleExportCsv = () => {
    downloadText(
      `${eventName}.csv`,
      `${rowsToCsv(sortRowsForSave(rows), eventName)}\n`,
    );
  };

  const handleSave = async () => {
    if (rows.length === 0 || isSaving) {
      return;
    }
    const confirmed = window.confirm(
      `${eventName}.csv とDBを現在の順序で保存します。よろしいですか？`,
    );
    if (!confirmed) {
      return;
    }

    setIsSaving(true);
    setSaveStatus(null);
    try {
      const response = await fetch("/api/edit_tournament/save_table_order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          competition,
          event_name: eventName,
          rows: sortRowsForSave(rows),
        }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "failed to save table order");
      }
      setSaveStatus({
        type: "success",
        text: result.csv_warning
          ? `DB保存済み。${result.csv_warning}`
          : "保存しました。",
      });
      await loadOrder(false);
    } catch (e) {
      setSaveStatus({ type: "error", text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Stack spacing={2}>
        <Box sx={{ textAlign: "center" }}>
          <Typography variant="h4" component="h1">
            <u>{eventInfo.full_name || eventName}</u>
          </Typography>
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {saveStatus ? (
          <Alert severity={saveStatus.type}>{saveStatus.text}</Alert>
        ) : null}
        <Stack direction="row" spacing={1}>
          {onBackToList ? (
            <Button variant="outlined" onClick={onBackToList}>
              競技一覧へ戻る
            </Button>
          ) : null}
          <Button variant="outlined" onClick={handleExportCsv}>
            CSVダウンロード
          </Button>
          <Button variant="contained" onClick={handleSave} disabled={isSaving}>
            {isSaving ? "保存中..." : "保存"}
          </Button>
        </Stack>

        <Paper sx={{ p: 2 }} elevation={1}>
          <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
            <FormControl size="small" sx={{ minWidth: 240 }}>
              <InputLabel id="court-count-label">コート数</InputLabel>
              <Select
                labelId="court-count-label"
                label="コート数"
                value={courtCount}
                onChange={handleCourtCountChange}
              >
                {[1, 2, 3].map((count) => (
                  <MenuItem
                    key={count}
                    value={count}
                    disabled={entryRows.length < count}
                  >
                    {count}コート
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Stack>
        </Paper>

        <Paper sx={{ p: 1 }} elevation={1}>
          <Stack spacing={0}>
            {entryRows.map((row, index) => {
              const gapPosition = index + 1;
              const separatorIndex = breakPositions.indexOf(gapPosition);
              return (
                <React.Fragment key={row.group_id}>
                  <Box
                    draggable
                    onDragStart={(event) => handleDragStart(event, index)}
                    onDragOver={(event) => event.preventDefault()}
                    onDrop={(event) => handleDrop(event, index)}
                    sx={{
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "40px 1fr",
                        sm: "48px 1fr auto auto",
                      },
                      gap: 1,
                      alignItems: "center",
                      px: 1,
                      py: 0.5,
                      borderBottom: "1px solid #eee",
                      cursor: "grab",
                      userSelect: "none",
                      "&:hover": { backgroundColor: "#f7f7f7" },
                    }}
                  >
                    <Typography variant="body2" sx={{ textAlign: "right" }}>
                      {index + 1}
                    </Typography>
                    <Typography variant="body2">
                      {row.name || `group_id=${row.group_id}`}
                    </Typography>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={index === 0}
                      onClick={() => handleMove(index, index - 1)}
                      sx={{ minWidth: 52, py: 0.25 }}
                    >
                      上へ
                    </Button>
                    <Button
                      variant="outlined"
                      size="small"
                      disabled={index === entryRows.length - 1}
                      onClick={() => handleMove(index, index + 1)}
                      sx={{ minWidth: 52, py: 0.25 }}
                    >
                      下へ
                    </Button>
                  </Box>
                  {separatorIndex >= 0 ? (
                    <Box
                      sx={{
                        height: 38,
                        display: "flex",
                        alignItems: "center",
                        px: 1,
                        borderBottom: "2px solid #1976d2",
                      }}
                    >
                      <Box
                        sx={{
                          display: "flex",
                          alignItems: "center",
                          gap: 1,
                          px: 1,
                          py: 0.25,
                          bgcolor: "primary.main",
                          color: "primary.contrastText",
                          borderRadius: 1,
                        }}
                      >
                        <Typography variant="caption">
                          ここから コート{separatorIndex + 2}
                        </Typography>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={gapPosition <= 1}
                          onClick={() =>
                            handleSeparatorMove(separatorIndex, -1)
                          }
                          sx={{
                            minWidth: 48,
                            py: 0,
                            bgcolor: "primary.contrastText",
                            color: "primary.main",
                            "&:hover": { bgcolor: "primary.contrastText" },
                          }}
                        >
                          上へ
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          disabled={gapPosition >= entryRows.length - 1}
                          onClick={() => handleSeparatorMove(separatorIndex, 1)}
                          sx={{
                            minWidth: 48,
                            py: 0,
                            bgcolor: "primary.contrastText",
                            color: "primary.main",
                            "&:hover": { bgcolor: "primary.contrastText" },
                          }}
                        >
                          下へ
                        </Button>
                      </Box>
                    </Box>
                  ) : null}
                </React.Fragment>
              );
            })}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
