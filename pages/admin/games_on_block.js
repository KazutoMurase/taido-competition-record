import React from "react";
import GamesOnBlock from "../../components/games_on_block";
import TableProgressOnBlock from "../../components/table_progress_on_block";
import GetResult from "../../components/get_result";
import GetTableResult from "../../components/get_table_result";
import { useRouter } from "next/router";
import { Box, Tabs, Tab, useMediaQuery } from "@mui/material";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import { useTheme } from "@mui/material/styles";
import { GetEventName } from "../../lib/get_event_name";

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tabIndex, setTabIndex] = React.useState(0);
  const { block_number, schedule_id, event_id } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  const onBack = () => {
    router.back();
  };
  const event_name = GetEventName(event_id);
  if (event_name.includes("dantai_hokei") || event_name.includes("tenkai")) {
    return (
      <div style={isMobile ? { width: "100%" } : {}}>
        {isMobile ? (
          <Box>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="Record Tabs"
            >
              <Tab key="main" label="記録" />
              <Tab key="result" label="トーナメント" />
            </Tabs>
            <Box>
              {tabIndex === 0 ? (
                <TableProgressOnBlock
                  block_number={block_number}
                  event_name={event_name}
                  schedule_id={schedule_id}
                  update_interval={3000}
                  is_mobile={isMobile}
                />
              ) : (
                <GetTableResult
                  updateInterval={3000}
                  event_name={event_name}
                  block_number={block_number}
                  is_mobile={isMobile}
                />
              )}
            </Box>
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "100px" }}
            >
              <Button variant="contained" type="submit" onClick={onBack}>
                戻る
              </Button>
            </Grid>
          </Box>
        ) : (
          <>
            <TableProgressOnBlock
              block_number={block_number}
              event_name={event_name}
              schedule_id={schedule_id}
              update_interval={3000}
            />
            <br />
            <GetTableResult
              updateInterval={3000}
              event_name={event_name}
              block_number={block_number}
            />
          </>
        )}
      </div>
    );
  } else {
    return (
      <div style={isMobile ? { width: "100%" } : {}}>
        {isMobile ? (
          <Box>
            <Tabs
              value={tabIndex}
              onChange={handleTabChange}
              aria-label="Record Tabs"
            >
              <Tab key="main" label="記録" />
              <Tab key="result" label="トーナメント" />
            </Tabs>
            <Box>
              {tabIndex === 0 ? (
                <GamesOnBlock
                  block_number={block_number}
                  event_name={event_name}
                  schedule_id={schedule_id}
                  update_interval={3000}
                  is_mobile={isMobile}
                />
              ) : (
                <GetResult
                  updateInterval={3000}
                  event_name={event_name}
                  block_number={block_number}
                  is_mobile={isMobile}
                />
              )}
            </Box>
            <Grid
              container
              justifyContent="center"
              alignItems="center"
              style={{ height: "100px" }}
            >
              <Button variant="contained" type="submit" onClick={onBack}>
                戻る
              </Button>
            </Grid>
          </Box>
        ) : (
          <>
            <GamesOnBlock
              block_number={block_number}
              event_name={event_name}
              schedule_id={schedule_id}
              update_interval={3000}
            />
            <br />
            <GetResult
              updateInterval={3000}
              event_name={event_name}
              block_number={block_number}
            />
          </>
        )}
      </div>
    );
  }
};

export default Home;
