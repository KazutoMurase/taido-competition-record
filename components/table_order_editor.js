import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
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
      setRows(result.rows);
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

  const editableRows = useMemo(
    () => rows.filter((row) => Number(row.round) === 1 && row.group_id),
    [rows],
  );
  const fixedRows = useMemo(
    () => rows.filter((row) => Number(row.round) !== 1 || !row.group_id),
    [rows],
  );

  const setEditableRows = (nextEditableRows) => {
    setRows([...nextEditableRows, ...fixedRows]);
    setSaveStatus(null);
  };

  const handleMove = (fromIndex, toIndex) => {
    setEditableRows(moveItem(editableRows, fromIndex, toIndex));
  };

  const handleDragStart = (event, index) => {
    event.dataTransfer.setData("text/plain", String(index));
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event, index) => {
    event.preventDefault();
    const fromIndex = Number(event.dataTransfer.getData("text/plain"));
    if (Number.isInteger(fromIndex)) {
      handleMove(fromIndex, index);
    }
  };

  const handleExportCsv = () => {
    downloadText(`${eventName}.csv`, `${rowsToCsv(rows, eventName)}\n`);
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
          rows,
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

        <Paper sx={{ p: 1 }} elevation={1}>
          <Stack spacing={0}>
            {editableRows.map((row, index) => (
              <Box
                key={row.group_id}
                draggable
                onDragStart={(event) => handleDragStart(event, index)}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => handleDrop(event, index)}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "48px 1fr auto auto",
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
                  disabled={index === editableRows.length - 1}
                  onClick={() => handleMove(index, index + 1)}
                  sx={{ minWidth: 52, py: 0.25 }}
                >
                  下へ
                </Button>
              </Box>
            ))}
          </Stack>
        </Paper>
      </Stack>
    </Container>
  );
}
