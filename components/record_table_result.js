import { useCallback, useEffect, useState, useRef } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import TextField from "@mui/material/TextField";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Typography from "@mui/material/Typography";

function onSubmitRetire(data, block_number, event_name) {
  let post = {
    id: data.id,
    event_name: event_name,
    update_block: block_number,
    main_score: null,
    sub1_score: null,
    sub2_score: null,
    retire: true,
  };
  if (event_name.includes("tenkai")) {
    post["sub3_score"] = null;
    post["sub4_score"] = null;
    post["sub5_score"] = null;
    post["elapsed_time"] = null;
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
  for (let i = 0; i < 19; i++) {
    if (values[i] === null && initialValues[i] !== "") {
      values[i] = initialValues[i];
    }
  }
  if (
    values[0] !== null &&
    values[1] !== null &&
    values[2] !== null &&
    values[3] !== null
  ) {
    post["elapsed_time"] =
      (parseInt(values[0]) * 1000 +
        parseInt(values[1]) * 100 +
        parseInt(values[2]) * 10 +
        parseInt(values[3])) /
      100;
  }
  if (values[5] !== null && values[6] !== null) {
    post["main_score"] =
      ((values[4] !== null ? parseInt(values[4]) * 100 : 0) +
        parseInt(values[5]) * 10 +
        parseInt(values[6])) /
      10;
  }
  if (values[7] !== null && values[8] !== null) {
    post["sub1_score"] = (parseInt(values[7]) * 10 + parseInt(values[8])) / 10;
  }
  if (values[9] !== null && values[10] !== null) {
    post["sub2_score"] = (parseInt(values[9]) * 10 + parseInt(values[10])) / 10;
  }
  if (values[11] !== null && values[12] !== null) {
    post["sub3_score"] =
      (parseInt(values[11]) * 10 + parseInt(values[12])) / 10;
  }
  if (values[13] !== null && values[14] !== null) {
    post["sub4_score"] =
      (parseInt(values[13]) * 10 + parseInt(values[14])) / 10;
  }
  if (values[15] !== null && values[16] !== null) {
    post["sub5_score"] =
      (parseInt(values[15]) * 10 + parseInt(values[16])) / 10;
  }
  if (values[17] !== null && values[18] !== null) {
    post["penalty"] = -(parseInt(values[17]) * 10 + parseInt(values[18])) / 10;
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

function ScoreField(
  title,
  values,
  initialValues,
  refs,
  start_index,
  period_index,
  last_index,
  handleChange,
) {
  const fields = [];
  for (let i = start_index; i <= last_index; i++) {
    fields.push(
      <TextField
        value={values[i] !== null ? values[i] : initialValues[i]}
        onChange={(event) => handleChange(i, event)}
        inputRef={refs[i]}
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
      />,
    );
    if (i === period_index) {
      fields.push(
        <Typography variant="h3" sx={{ mx: 1 }}>
          .
        </Typography>,
      );
    }
  }
  return (
    <Box display="flex" flexDirection="column" alignItems="center">
      <Typography variant="h4">{title}</Typography>
      <Box display="flex" flexDirection="row" alignItems="flex-end">
        {fields}
      </Box>
    </Box>
  );
}

function CalcSum(values, initialValues) {
  let sum = 0.0;
  let elapsed_time = 0.0;
  if (values[0] !== null) {
    elapsed_time += values[0] ? parseInt(values[0] * 1000) : 0;
  } else if (initialValues[0] !== "") {
    elapsed_time += parseInt(initialValues[0]) * 1000;
  }
  if (values[1] !== null) {
    elapsed_time += values[1] ? parseInt(values[1] * 100) : 0;
  } else if (initialValues[1] !== "") {
    elapsed_time += parseInt(initialValues[1] * 100);
  }
  if (values[2] !== null) {
    elapsed_time += values[2] ? parseInt(values[2]) * 10 : 0;
  } else if (initialValues[2] !== "") {
    elapsed_time += parseInt(initialValues[2]) * 10;
  }
  if (values[3] !== null) {
    elapsed_time += values[3] ? parseInt(values[3]) : 0;
  } else if (initialValues[3] !== "") {
    elapsed_time += parseInt(initialValues[3]);
  }
  elapsed_time /= 100;
  if (elapsed_time > 0.0) {
    if (elapsed_time >= 30.0) {
      sum -= Math.ceil((elapsed_time - 30.0) * 2) * 0.5 * 10;
    } else if (elapsed_time <= 25.0) {
      sum -= Math.ceil((25.0 - elapsed_time) * 2) * 0.5 * 10;
    }
  }
  if (values[4] !== null) {
    sum += (values[4] ? parseInt(values[4]) : 0) * 100;
  } else if (initialValues[4] !== "") {
    sum += parseInt(initialValues[4]) * 100;
  }
  for (let i = 5; i < 17; i++) {
    const scale = i % 2 ? 10 : 1;
    if (values[i] !== null) {
      sum += (values[i] ? parseInt(values[i]) : 0) * scale;
    } else if (initialValues[i] !== "") {
      sum += parseInt(initialValues[i]) * scale;
    }
  }
  if (values[17] !== null) {
    sum -= (values[17] ? parseInt(values[17]) : 0) * 10;
  } else if (initialValues[17] !== "") {
    sum -= parseInt(initialValues[17]) * 10;
  }
  if (values[18] !== null) {
    sum -= values[18] ? parseInt(values[18]) : values[18];
  } else if (initialValues[18] !== "") {
    sum -= parseInt(initialValues[18]);
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
  is_mobile,
}) {
  // time x4, main x3, sub1 x2, sub2 x2, sub3 x2, sub4 x2, sub5 x2, penalty x2
  const [values, setValues] = useState([
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
    null,
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
    "",
    "",
    "",
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
    useRef(null),
    useRef(null),
    useRef(null),
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
    let initialValues = [
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
      "",
    ];
    if (result.elapsed_time) {
      initialValues[0] = parseInt(result.elapsed_time / 10);
      initialValues[1] = parseInt(result.elapsed_time % 10);
      initialValues[2] = parseInt(result.elapsed_time * 10) % 10;
      initialValues[3] = parseInt(result.elapsed_time * 100) % 10;
    }
    if (result.main_score) {
      initialValues[4] = parseInt(result.main_score / 10);
      initialValues[5] = parseInt(result.main_score % 10);
      initialValues[6] = parseInt(result.main_score * 10) % 10;
    }
    if (result.sub1_score) {
      initialValues[7] = parseInt(result.sub1_score);
      initialValues[8] = parseInt(result.sub1_score * 10) % 10;
    }
    if (result.sub2_score) {
      initialValues[9] = parseInt(result.sub2_score);
      initialValues[10] = parseInt(result.sub2_score * 10) % 10;
    }
    if (result.sub3_score) {
      initialValues[11] = parseInt(result.sub3_score);
      initialValues[12] = parseInt(result.sub3_score * 10) % 10;
    }
    if (result.sub4_score) {
      initialValues[13] = parseInt(result.sub4_score);
      initialValues[14] = parseInt(result.sub4_score * 10) % 10;
    }
    if (result.sub5_score) {
      initialValues[15] = parseInt(result.sub5_score);
      initialValues[16] = parseInt(result.sub5_score * 10) % 10;
    }
    if (result.penalty) {
      initialValues[17] = parseInt(-result.penalty);
      initialValues[18] = parseInt(-result.penalty * 10) % 10;
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
      for (let i = index + 1; i < inputRefs.length; i++) {
        if (inputRefs[i].current !== null) {
          inputRefs[i].current.focus();
          break;
        }
      }
    } else if (value === "") {
      const newValues = [...values];
      newValues[index] = "";
      setValues(newValues);
    }
  };
  const main_score_start_index = event_name.includes("tenkai") ? 4 : 5;
  const minWidth = is_mobile ? "300px" : "850px";
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: minWidth }}>
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
            style={{ height: "80px" }}
          >
            <Button
              variant="contained"
              type="submit"
              onClick={(e) => onSubmitRetire(data, block_number, event_name)}
              style={{ backgroundColor: "gray" }}
            >
              棄権
            </Button>
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
        {event_name.includes("tenkai") ? (
          <Box display="flex" alignItems="center" justifyContent="center">
            {ScoreField(
              "時間",
              values,
              initialValues,
              inputRefs,
              0,
              1,
              3,
              handleChange,
            )}
          </Box>
        ) : (
          <></>
        )}
        {is_mobile ? (
          <>
            <Box display="flex" alignItems="center" justifyContent="center">
              {ScoreField(
                "主審",
                values,
                initialValues,
                inputRefs,
                main_score_start_index,
                5,
                6,
                handleChange,
              )}
            </Box>
            <Box display="flex" alignItems="center" justifyContent="center">
              {ScoreField(
                "副審1",
                values,
                initialValues,
                inputRefs,
                7,
                7,
                8,
                handleChange,
              )}
            </Box>
            <Box display="flex" alignItems="center" justifyContent="center">
              {ScoreField(
                "副審2",
                values,
                initialValues,
                inputRefs,
                9,
                9,
                10,
                handleChange,
              )}
            </Box>
            {event_name.includes("tenkai") ? (
              <Box display="flex" alignItems="center" justifyContent="center">
                {ScoreField(
                  "副審3",
                  values,
                  initialValues,
                  inputRefs,
                  11,
                  11,
                  12,
                  handleChange,
                )}
              </Box>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center">
                {ScoreField(
                  "場外減点",
                  values,
                  initialValues,
                  inputRefs,
                  17,
                  17,
                  18,
                  handleChange,
                )}
              </Box>
            )}
          </>
        ) : (
          <Box display="flex" alignItems="center" justifyContent="center">
            {ScoreField(
              "主審",
              values,
              initialValues,
              inputRefs,
              main_score_start_index,
              5,
              6,
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
              7,
              7,
              8,
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
              9,
              9,
              10,
              handleChange,
            )}
            {event_name.includes("tenkai") ? (
              <>
                <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
                  +
                </Typography>
                {ScoreField(
                  "副審3",
                  values,
                  initialValues,
                  inputRefs,
                  11,
                  11,
                  12,
                  handleChange,
                )}
              </>
            ) : (
              <>
                <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
                  -
                </Typography>
                {ScoreField(
                  "場外減点",
                  values,
                  initialValues,
                  inputRefs,
                  17,
                  17,
                  18,
                  handleChange,
                )}
              </>
            )}
          </Box>
        )}
        {event_name.includes("tenkai") ? (
          <>
            {is_mobile ? (
              <>
                <Box display="flex" alignItems="center" justifyContent="center">
                  {ScoreField(
                    "副審4",
                    values,
                    initialValues,
                    inputRefs,
                    13,
                    13,
                    14,
                    handleChange,
                  )}
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                  {ScoreField(
                    "副審5",
                    values,
                    initialValues,
                    inputRefs,
                    15,
                    15,
                    16,
                    handleChange,
                  )}
                </Box>
                <Box display="flex" alignItems="center" justifyContent="center">
                  {ScoreField(
                    "場外減点",
                    values,
                    initialValues,
                    inputRefs,
                    17,
                    17,
                    18,
                    handleChange,
                  )}
                </Box>
              </>
            ) : (
              <Box display="flex" alignItems="center" justifyContent="center">
                <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
                  +
                </Typography>
                {ScoreField(
                  "副審4",
                  values,
                  initialValues,
                  inputRefs,
                  13,
                  13,
                  14,
                  handleChange,
                )}
                <Typography variant="h4" sx={{ mx: 1, mt: 5 }}>
                  +
                </Typography>
                {ScoreField(
                  "副審5",
                  values,
                  initialValues,
                  inputRefs,
                  15,
                  15,
                  16,
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
                  17,
                  17,
                  18,
                  handleChange,
                )}
              </Box>
            )}
          </>
        ) : (
          <></>
        )}
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
