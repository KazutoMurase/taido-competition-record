import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import React from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";

function formatPlayer(player) {
  if (player?.free_name) {
    return player.free_name;
  }
  if (!player || !player.name) {
    return "未設定";
  }
  return (
    player.name +
    (player.name_kana ? " (" + player.name_kana + ")" : "") +
    (player.group ? " / " + player.group.replace(/['"]+/g, "") : "")
  );
}

export default function Awards() {
  const router = useRouter();
  const [awards, setAwards] = useState([]);
  const [queries, setQueries] = useState({});
  const [freeNames, setFreeNames] = useState({});
  const [candidates, setCandidates] = useState({});

  const fetchAwards = async () => {
    const response = await fetch("/api/get_awarded_players");
    const result = await response.json();
    setAwards(result);
    const nextFreeNames = {};
    result.forEach((award) => {
      nextFreeNames[award.id] = award.free_name || "";
    });
    setFreeNames(nextFreeNames);
  };

  useEffect(() => {
    fetchAwards();
  }, []);

  const searchPlayers = async (awardId) => {
    const q = queries[awardId] || "";
    const response = await fetch(
      "/api/search_players?q=" + encodeURIComponent(q),
    );
    const result = await response.json();
    setCandidates({ ...candidates, [awardId]: result });
  };

  const updateAward = async (awardId, playerId) => {
    const response = await fetch("/api/record_awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: awardId, player_id: playerId }),
    });
    if (!response.ok) {
      alert("褒章更新に失敗しました");
      return;
    }
    setCandidates({ ...candidates, [awardId]: [] });
    await fetchAwards();
  };

  const updateFreeName = async (awardId) => {
    const response = await fetch("/api/record_awards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id: awardId,
        free_name: freeNames[awardId] || "",
      }),
    });
    if (!response.ok) {
      alert("褒章更新に失敗しました");
      return;
    }
    setCandidates({ ...candidates, [awardId]: [] });
    await fetchAwards();
  };

  return (
    <div>
      <br />
      <Container maxWidth="md">
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "80px" }}
        >
          <h1>
            <u>褒章更新</u>
          </h1>
        </Grid>
        {awards.map((award) => {
          const awardCandidates = candidates[award.id] || [];
          return (
            <Box
              key={award.id}
              sx={{
                borderBottom: "1px solid #ddd",
                padding: "16px 0",
              }}
            >
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} sm={3}>
                  <b>{award.award_name}</b>
                </Grid>
                <Grid item xs={12} sm={3}>
                  {formatPlayer(award)}
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="選手ID・氏名・カナ"
                    value={queries[award.id] || ""}
                    onChange={(e) =>
                      setQueries({ ...queries, [award.id]: e.target.value })
                    }
                  />
                  &nbsp;
                  <Button
                    variant="contained"
                    type="submit"
                    onClick={(e) => searchPlayers(award.id)}
                  >
                    検索
                  </Button>
                  &nbsp;
                  <Button
                    variant="outlined"
                    color="error"
                    type="submit"
                    onClick={(e) => updateAward(award.id, null)}
                  >
                    解除
                  </Button>
                </Grid>
              </Grid>
              <Grid
                container
                spacing={2}
                alignItems="center"
                sx={{ marginTop: "8px" }}
              >
                <Grid item xs={12} sm={6} />
                <Grid item xs={12} sm={6}>
                  <TextField
                    size="small"
                    label="自由入力"
                    value={freeNames[award.id] || ""}
                    onChange={(e) =>
                      setFreeNames({
                        ...freeNames,
                        [award.id]: e.target.value,
                      })
                    }
                  />
                  &nbsp;
                  <Button
                    variant="outlined"
                    type="submit"
                    onClick={(e) => updateFreeName(award.id)}
                  >
                    保存
                  </Button>
                </Grid>
              </Grid>
              {awardCandidates.map((player) => (
                <Grid
                  key={player.id}
                  container
                  justifyContent="flex-end"
                  alignItems="center"
                  sx={{ marginTop: "8px" }}
                >
                  <Button
                    variant="outlined"
                    type="submit"
                    onClick={(e) => updateAward(award.id, player.id)}
                  >
                    {player.id}: {formatPlayer(player)}
                  </Button>
                </Grid>
              ))}
            </Box>
          );
        })}
        <Grid
          container
          justifyContent="center"
          alignItems="center"
          style={{ height: "100px" }}
        >
          <Button
            variant="outlined"
            type="submit"
            onClick={(e) => router.push("/admin/corrections")}
          >
            戻る
          </Button>
        </Grid>
      </Container>
    </div>
  );
}
