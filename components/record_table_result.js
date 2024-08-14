import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

function onSubmit(data, values, block_number, event_name, function_after_post) {
  let post = {
    id: data.id,
    event_name: event_name,
    update_block: block_number,
  };
  if (values[0] && values[1]) {
      post["main_score"] = (parseInt(values[0]) * 10 + parseInt(values[1])) / 10;
  }
  if (values[2] && values[3]) {
      post["sub1_score"] = (parseInt(values[2]) * 10 + parseInt(values[3])) / 10;
  }
  if (values[4] && values[5]) {
      post["sub2_score"] = (parseInt(values[4]) * 10 + parseInt(values[5])) / 10;
  }
  if (values[6] && values[7]) {
    post["penalty"] = -(parseInt(values[6]) * 10 + parseInt(values[7])) / 10;
  } else {
    post["penalty"] = null;
  }
  axios
    .post("/api/record_table", post)
    .then((response) => {
      window.location.reload();
    })
    .catch((e) => {
      console.log(e);
    });
}

function onBack(data, block_number, function_after_post) {
  let post = { id: data.id - 1, update_block: block_number };
  axios
    .post("/api/back", post)
    .then((response) => {
      function_after_post();
    })
    .catch((e) => {
      console.log(e);
    });
}

function ScoreField(title, values, refs, index, handleChange) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h4">{title}</Typography>
      <Box display="flex" flexDirection="row" alignItems="flex-end">
        <TextField
          value={values[index]}
          onChange={(event) => handleChange(index, event)}
          inputRef={refs[index]}
          inputProps={{
            maxLength: 1,
            style: { textAlign: "center", fontSize: "4rem" },
            inputMode: "numeric",
            pattern: "[0-9]*",
          }}
          variant="outlined"
          size="small"
          sx={{
            width: "4rem",
          }}
        />
        <Typography variant="h3" sx={{ mx: 1 }}>
          .
        </Typography>
        <TextField
          value={values[index + 1]}
          onChange={(event) => handleChange(index + 1, event)}
          inputRef={refs[index + 1]}
          inputProps={{
            maxLength: 1,
            style: { textAlign: "center", fontSize: "4rem" },
            inputMode: "numeric",
            pattern: "[0-9]*",
          }}
          variant="outlined"
          size="small"
          sx={{
            width: "4rem",
          }}
        />
      </Box>
    </Box>
  );
}

function CalcSum(values) {
  let sum = 0.0;
  if (values[0]) {
    sum += parseInt(values[0]) * 10;
  }
  if (values[1]) {
    sum += parseInt(values[1]);
  }
  if (values[2]) {
    sum += parseInt(values[2]) * 10;
  }
  if (values[3]) {
    sum += parseInt(values[3]);
  }
  if (values[4]) {
    sum += parseInt(values[4]) * 10;
  }
  if (values[5]) {
    sum += parseInt(values[5]);
  }
  if (values[6]) {
    sum -= parseInt(values[6]) * 10;
  }
  if (values[7]) {
    sum -= parseInt(values[7]);
  }
  return (
    <Typography variant="h1" color="red">
      {sum / 10}
    </Typography>
  );
}

function RecordTableResult({
  block_number,
  event_name,
  schedule_id,
  update_interval,
}) {
  // main, sub1, sub2, penalty
  const [values, setValues] = useState(["", "", "", "", "", "", "", ""]);
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ];
  const router = useRouter();

  const [data, setData] = useState([]);
  const fetchData = useCallback(async () => {
    const response = await fetch(
      "/api/current_game_on_table?block_number=" +
        block_number +
        "&schedule_id=" +
        schedule_id +
        "&event_name=" +
        event_name,
    );
    const result = await response.json();
    if (result.length === 0) {
      router.push("block?block_number=" + block_number);
    }
    setData(result);
  }, [block_number, schedule_id, event_name, router]);
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData();
    }, update_interval);
    fetchData();
    return () => {
      clearInterval(interval);
    };
  }, [fetchData, update_interval]);

  const forceFetchData = () => {
    fetchData();
  };

  const handleChange = (index, event) => {
    const value = event.target.value;
    if (/^[0-9]$/.test(value)) {
      const newValues = [...values];
      newValues[index] = value;
      setValues(newValues);
      if (index < inputRefs.length - 1) {
        inputRefs[index + 1].current.focus();
      }
    } else if (value === "") {
      const newValues = [...values];
      newValues[index] = "";
      setValues(newValues);
    }
  };
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: "850px" }}>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "50px" }}
          >
            <h2>
              <u>コート{block_number.toUpperCase()}</u>
            </h2>
          </Grid>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "40px" }}
          >
            <h2>第{data.id}試合</h2>
          </Grid>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "120px" }}
          >
            <h1>{data.name?.replace(/['"]+/g, "")}</h1>
          </Grid>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center">
          {ScoreField("主審", values, inputRefs, 0, handleChange)}
          <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
            +
          </Typography>
          {ScoreField("副審1", values, inputRefs, 2, handleChange)}
          <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
            +
          </Typography>
          {ScoreField("副審2", values, inputRefs, 4, handleChange)}
          <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
            -
          </Typography>
          {ScoreField("場外減点", values, inputRefs, 6, handleChange)}
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
              合計得点
            </Typography>
            {CalcSum(values)}
          </Box>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Button
            variant="contained"
            type="submit"
            onClick={(e) =>
              onSubmit(data, values, block_number, event_name, forceFetchData)
            }
          >
            決定
          </Button>
            &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;
            <Button
              variant="contained"
              type="submit"
              onClick={(e) => onBack(data, block_number, forceFetchData)}
            >
              戻る
            </Button>
        </Box>
      </Container>
    </div>
  );
}

export default RecordTableResult;
