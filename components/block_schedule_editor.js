import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  CircularProgress,
  Container,
  FormControl,
  FormControlLabel,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";

const emptyForm = {
  event_id: "",
  time_schedule: "",
  before_final: false,
  final: false,
  next_unused_num: 0,
  game_ids: "",
};

function formatGameIds(gameIds) {
  if (!gameIds || gameIds.length === 0) {
    return "";
  }
  const ids = [...new Set(gameIds.map(Number))]
    .filter((id) => Number.isInteger(id))
    .sort((a, b) => a - b);
  if (ids.length === 0) {
    return "";
  }

  const ranges = [];
  let start = ids[0];
  let end = ids[0];
  for (const id of ids.slice(1)) {
    if (id === end + 1) {
      end = id;
      continue;
    }
    ranges.push(start === end ? String(start) : `${start}-${end}`);
    start = id;
    end = id;
  }
  ranges.push(start === end ? String(start) : `${start}-${end}`);
  return ranges.join(",");
}

function parseGameIds(text) {
  const ids = [];
  for (const part of String(text || "").split(",")) {
    const trimmed = part.trim();
    if (!trimmed) {
      continue;
    }
    if (trimmed.includes("-")) {
      const [startText, endText] = trimmed.split("-");
      const start = Number(startText);
      const end = Number(endText);
      if (!Number.isInteger(start) || !Number.isInteger(end) || start > end) {
        throw new Error(`invalid game id range: ${trimmed}`);
      }
      for (let id = start; id <= end; id += 1) {
        ids.push(id);
      }
    } else {
      const id = Number(trimmed);
      if (!Number.isInteger(id)) {
        throw new Error(`invalid game id: ${trimmed}`);
      }
      ids.push(id);
    }
  }
  return [...new Set(ids)].sort((a, b) => a - b);
}

function rowToForm(row) {
  return {
    event_id: String(row.event_id),
    time_schedule: row.time_schedule || "",
    before_final: Boolean(row.before_final),
    final: Boolean(row.final),
    next_unused_num: Number(row.next_unused_num || 0),
    game_ids: formatGameIds(row.game_ids || []),
  };
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

function blockRowsToCsv(rows) {
  const header = [
    "id",
    "event_id",
    "time_schedule",
    "before_final",
    "final",
    "players_checked",
    "next_unused_num",
  ];
  return [
    header.join(","),
    ...rows.map((row, index) =>
      [
        index + 1,
        row.event_id,
        row.time_schedule || "",
        row.before_final ? 1 : 0,
        row.final ? 1 : 0,
        0,
        row.next_unused_num || 0,
      ]
        .map((value, valueIndex) =>
          valueIndex === 2 ? csvEscape(value ? `'${value}'` : "''") : value,
        )
        .join(","),
    ),
  ].join("\n");
}

function buildGamesRows(rows) {
  const gamesRows = [];
  let id = 1;
  rows.forEach((row, rowIndex) => {
    const scheduleId = rowIndex + 1;
    (row.game_ids || []).forEach((gameId, index) => {
      gamesRows.push({
        id,
        schedule_id: scheduleId,
        order_id: index + 1,
        game_id: gameId,
      });
      id += 1;
    });
  });
  return gamesRows;
}

function gamesRowsToCsv(rows) {
  const header = ["id", "schedule_id", "order_id", "game_id"];
  return [
    header.join(","),
    ...rows.map((row) => header.map((column) => row[column]).join(",")),
  ].join("\n");
}

export default function BlockScheduleEditor({
  competition,
  block,
  onBackToList = null,
}) {
  const [events, setEvents] = useState([]);
  const [rows, setRows] = useState([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState("");
  const [saveStatus, setSaveStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const blockLabel = block ? `${String(block).toUpperCase()}コート` : "";
  const eventNameById = useMemo(() => {
    const names = {};
    for (const event of events) {
      names[event.id] = event.name || event.full_name || event.name_en;
    }
    return names;
  }, [events]);

  const loadBlock = useCallback(
    async (showLoading = true) => {
      setError("");
      if (showLoading) {
        setIsLoading(true);
      }
      const response = await fetch(
        `/api/edit_tournament/load_block?competition=${competition}&block=${block}`,
      );
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "failed to load block");
      }
      setEvents(result.events);
      setRows(result.rows);
      setSelectedIndex(-1);
      setForm(emptyForm);
    },
    [competition, block],
  );

  useEffect(() => {
    if (!competition || !block) {
      return;
    }
    loadBlock()
      .catch((e) => setError(e.message))
      .finally(() => setIsLoading(false));
  }, [competition, block, loadBlock]);

  const selectRow = (index) => {
    setSelectedIndex(index);
    setForm(rowToForm(rows[index]));
    setSaveStatus(null);
  };

  const updateForm = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setSaveStatus(null);
  };

  const normalizedFormRow = () => {
    if (!form.event_id) {
      throw new Error("種目を選択してください。");
    }
    return {
      event_id: Number(form.event_id),
      time_schedule: form.time_schedule,
      before_final: form.before_final ? 1 : 0,
      final: form.final ? 1 : 0,
      players_checked: 0,
      next_unused_num: Number(form.next_unused_num || 0),
      game_ids: parseGameIds(form.game_ids),
    };
  };

  const addRow = () => {
    try {
      const nextRow = normalizedFormRow();
      const insertIndex = selectedIndex >= 0 ? selectedIndex + 1 : rows.length;
      const nextRows = [...rows];
      nextRows.splice(insertIndex, 0, nextRow);
      setRows(nextRows);
      setSelectedIndex(insertIndex);
    } catch (e) {
      setSaveStatus({ type: "error", text: e.message });
    }
  };

  const updateSelectedRow = () => {
    if (selectedIndex < 0) {
      setSaveStatus({ type: "error", text: "更新する行を選択してください。" });
      return;
    }
    try {
      const nextRows = [...rows];
      nextRows[selectedIndex] = normalizedFormRow();
      setRows(nextRows);
    } catch (e) {
      setSaveStatus({ type: "error", text: e.message });
    }
  };

  const deleteSelectedRow = () => {
    if (selectedIndex < 0) {
      setSaveStatus({ type: "error", text: "削除する行を選択してください。" });
      return;
    }
    if (!window.confirm("選択した行を削除します。よろしいですか？")) {
      return;
    }
    const nextRows = rows.filter((_, index) => index !== selectedIndex);
    setRows(nextRows);
    setSelectedIndex(-1);
    setForm(emptyForm);
    setSaveStatus(null);
  };

  const moveSelectedRow = (offset) => {
    const nextIndex = selectedIndex + offset;
    if (
      selectedIndex < 0 ||
      nextIndex < 0 ||
      selectedIndex >= rows.length ||
      nextIndex >= rows.length
    ) {
      return;
    }
    const nextRows = [...rows];
    const [row] = nextRows.splice(selectedIndex, 1);
    nextRows.splice(nextIndex, 0, row);
    setRows(nextRows);
    setSelectedIndex(nextIndex);
    setSaveStatus(null);
  };

  const handleSave = async () => {
    if (rows.length === 0 || isSaving) {
      return;
    }
    if (
      !window.confirm(
        `block_${block}.csv、block_${block}_games.csv とDBを保存します。よろしいですか？`,
      )
    ) {
      return;
    }
    setIsSaving(true);
    setSaveStatus(null);
    try {
      const response = await fetch("/api/edit_tournament/save_block", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competition, block, rows }),
      });
      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "failed to save block");
      }
      setSaveStatus({
        type: "success",
        text: result.csv_warning
          ? `DB保存済み。${result.csv_warning}`
          : "保存しました。",
      });
      await loadBlock(false);
    } catch (e) {
      setSaveStatus({ type: "error", text: e.message });
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportCsv = () => {
    downloadText(`block_${block}.csv`, `${blockRowsToCsv(rows)}\n`);
    downloadText(
      `block_${block}_games.csv`,
      `${gamesRowsToCsv(buildGamesRows(rows))}\n`,
    );
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
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Stack spacing={2}>
        <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
          <Box>
            <Typography variant="h4" component="h1">
              {blockLabel} 編集
            </Typography>
            <Typography color="text.secondary">{competition}</Typography>
          </Box>
          {onBackToList ? (
            <Button variant="outlined" onClick={onBackToList}>
              一覧へ戻る
            </Button>
          ) : null}
        </Box>

        {error ? <Alert severity="error">{error}</Alert> : null}
        {saveStatus ? (
          <Alert severity={saveStatus.type}>{saveStatus.text}</Alert>
        ) : null}

        <Grid container spacing={2}>
          <Grid item xs={12} lg={8}>
            <Paper sx={{ overflowX: "auto" }} elevation={1}>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>ID</TableCell>
                    <TableCell>種類</TableCell>
                    <TableCell>時間</TableCell>
                    <TableCell>三決</TableCell>
                    <TableCell>決勝</TableCell>
                    <TableCell>Next</TableCell>
                    <TableCell>Game IDs</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {rows.map((row, index) => (
                    <TableRow
                      hover
                      key={`${index}-${row.event_id}-${row.time_schedule}`}
                      selected={index === selectedIndex}
                      onClick={() => selectRow(index)}
                      sx={{ cursor: "pointer" }}
                    >
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>
                        {row.event_id}: {eventNameById[row.event_id] || ""}
                      </TableCell>
                      <TableCell>{row.time_schedule}</TableCell>
                      <TableCell>{row.before_final ? "Yes" : "No"}</TableCell>
                      <TableCell>{row.final ? "Yes" : "No"}</TableCell>
                      <TableCell>{row.next_unused_num}</TableCell>
                      <TableCell>{formatGameIds(row.game_ids)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </Paper>
          </Grid>

          <Grid item xs={12} lg={4}>
            <Paper sx={{ p: 2 }} elevation={1}>
              <Stack spacing={2}>
                <FormControl fullWidth size="small">
                  <InputLabel id="block-event-label">種類</InputLabel>
                  <Select
                    labelId="block-event-label"
                    label="種類"
                    value={form.event_id}
                    onChange={(e) => updateForm("event_id", e.target.value)}
                  >
                    {events.map((event) => (
                      <MenuItem key={event.id} value={String(event.id)}>
                        {event.id}: {event.name || event.full_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  label="タイムスケジュール"
                  size="small"
                  value={form.time_schedule}
                  onChange={(e) => updateForm("time_schedule", e.target.value)}
                />
                <Box sx={{ display: "flex", gap: 2 }}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.before_final}
                        onChange={(e) =>
                          updateForm("before_final", e.target.checked)
                        }
                      />
                    }
                    label="三決"
                  />
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={form.final}
                        onChange={(e) => updateForm("final", e.target.checked)}
                      />
                    }
                    label="決勝"
                  />
                </Box>
                <TextField
                  label="Next Unused Num"
                  size="small"
                  type="number"
                  inputProps={{ min: 0 }}
                  value={form.next_unused_num}
                  onChange={(e) =>
                    updateForm("next_unused_num", e.target.value)
                  }
                />
                <TextField
                  label="Game IDs"
                  size="small"
                  value={form.game_ids}
                  placeholder="1-5,6,10-17"
                  onChange={(e) => updateForm("game_ids", e.target.value)}
                />
                <Grid container spacing={1}>
                  <Grid item xs={6}>
                    <Button fullWidth variant="contained" onClick={addRow}>
                      追加
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={updateSelectedRow}
                    >
                      更新
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => moveSelectedRow(-1)}
                    >
                      上へ
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={() => moveSelectedRow(1)}
                    >
                      下へ
                    </Button>
                  </Grid>
                  <Grid item xs={12}>
                    <Button
                      fullWidth
                      color="error"
                      variant="outlined"
                      onClick={deleteSelectedRow}
                    >
                      削除
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="outlined"
                      onClick={handleExportCsv}
                    >
                      CSV出力
                    </Button>
                  </Grid>
                  <Grid item xs={6}>
                    <Button
                      fullWidth
                      variant="contained"
                      color="success"
                      disabled={isSaving || rows.length === 0}
                      onClick={handleSave}
                    >
                      {isSaving ? "保存中" : "保存"}
                    </Button>
                  </Grid>
                </Grid>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>
    </Container>
  );
}
