import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

function onSubmit(
  data,
  values,
  initialValues,
  block_number,
  event_name,
  function_after_post,
) {
  let post = {
    id: data.id,
    event_name: event_name,
    update_block: block_number,
  };
  for (let i = 0; i < 8; i++) {
    if (values[i] === null && initialValues[i] !== "") {
      values[i] = initialValues[i];
    }
  }
  if (values[0] !== null && values[1] !== null) {
    post["main_score"] = (parseInt(values[0]) * 10 + parseInt(values[1])) / 10;
  }
  if (values[2] !== null && values[3] !== null) {
    post["sub1_score"] = (parseInt(values[2]) * 10 + parseInt(values[3])) / 10;
  }
  if (values[4] !== null && values[5] !== null) {
    post["sub2_score"] = (parseInt(values[4]) * 10 + parseInt(values[5])) / 10;
  }
  if (values[6] !== null && values[7] !== null) {
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

function ScoreField(title, values, initialValues, refs, index, handleChange) {
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h4">{title}</Typography>
      <Box display="flex" flexDirection="row" alignItems="flex-end">
        <TextField
          value={values[index] !== null ? values[index] : initialValues[index]}
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
          value={
            values[index + 1] !== null
              ? values[index + 1]
              : initialValues[index + 1]
          }
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

function CalcSum(values, initialValues) {
  let sum = 0.0;
  if (values[0] !== null) {
    sum += (values[0] ? parseInt(values[0]) : 0) * 10;
  } else if (initialValues[0] !== "") {
    sum += parseInt(initialValues[0]) * 10;
  }
  if (values[1] !== null) {
    sum += values[1] ? parseInt(values[1]) : 0;
  } else if (initialValues[1] !== "") {
    sum += parseInt(initialValues[1]);
  }
  if (values[2] !== null) {
    sum += (values[2] ? parseInt(values[2]) : 0) * 10;
  } else if (initialValues[2] !== "") {
    sum += parseInt(initialValues[2]) * 10;
  }
  if (values[3] !== null) {
    sum += values[3] ? parseInt(values[3]) : 0;
  } else if (initialValues[3] !== "") {
    sum += parseInt(initialValues[3]);
  }
  if (values[4] !== null) {
    sum += (values[4] ? parseInt(values[4]) : 0) * 10;
  } else if (initialValues[4] !== "") {
    sum += parseInt(initialValues[4]) * 10;
  }
  if (values[5] !== null) {
    sum += values[5] ? parseInt(values[5]) : 0;
  } else if (initialValues[5] !== "") {
    sum += parseInt(initialValues[5]);
  }
  if (values[6] !== null) {
    sum -= (values[6] ? parseInt(values[6]) : 0) * 10;
  } else if (initialValues[6] !== "") {
    sum -= parseInt(initialValues[6]) * 10;
  }
  if (values[7] !== null) {
    sum -= values[7] ? parseInt(values[7]) : values[7];
  } else if (initialValues[7] !== "") {
    sum -= parseInt(initialValues[7]);
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
  const [values, setValues] = useState([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
  ]);
  const [initialValues, setInitialValues] = useState([
    "",
    "",
    "",
    "",
    "",
    "",
    "",
    "",
  ]);
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
    let initialValues = ["", "", "", "", "", "", "", ""];
    if (result.main_score) {
      initialValues[0] = parseInt(result.main_score);
      initialValues[1] = parseInt(result.main_score * 10) % 10;
    }
    if (result.sub1_score) {
      initialValues[2] = parseInt(result.sub1_score);
      initialValues[3] = parseInt(result.sub1_score * 10) % 10;
    }
    if (result.sub2_score) {
      initialValues[4] = parseInt(result.sub2_score);
      initialValues[5] = parseInt(result.sub2_score * 10) % 10;
    }
    if (result.penalty) {
      initialValues[6] = parseInt(-result.penalty);
      initialValues[7] = parseInt(-result.penalty * 10) % 10;
    }
    setInitialValues(initialValues);
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
            {data.retire ? (
              <s>
                <h1>{data.name?.replace(/['"]+/g, "")}</h1>
              </s>
            ) : (
              <h1>{data.name?.replace(/['"]+/g, "")}</h1>
            )}
          </Grid>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center">
          {ScoreField(
            "主審",
            values,
            initialValues,
            inputRefs,
            0,
            handleChange,
          )}
          <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
            +
          </Typography>
          {ScoreField(
            "副審1",
            values,
            initialValues,
            inputRefs,
            2,
            handleChange,
          )}
          <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
            +
          </Typography>
          {ScoreField(
            "副審2",
            values,
            initialValues,
            inputRefs,
            4,
            handleChange,
          )}
          <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
            -
          </Typography>
          {ScoreField(
            "場外減点",
            values,
            initialValues,
            inputRefs,
            6,
            handleChange,
          )}
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Box display="flex" flexDirection="column" alignItems="center">
            <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
              合計得点
            </Typography>
            {CalcSum(values, initialValues)}
          </Box>
        </Box>
        <Box display="flex" alignItems="center" justifyContent="center">
          <Button
            variant="contained"
            type="submit"
            onClick={(e) =>
              onSubmit(
                data,
                values,
                initialValues,
                block_number,
                event_name,
                forceFetchData,
              )
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
