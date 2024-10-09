import React from "react";
import CheckPlayers from "../../components/check_players_on_block";
import CheckDantai from "../../components/check_dantai_on_block";
import CheckTable from "../../components/check_table_on_block";
import GetResult from "../../components/get_result";
import GetTableResult from "../../components/get_table_result";
import { useRouter } from "next/router";
import { GetEventName } from "../../lib/get_event_name";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { Box, Tabs, Tab, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tabIndex, setTabIndex] = React.useState(1);
  const { block_number, schedule_id, event_id } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = GetEventName(event_id);
  const localStateKey =
    "retire_states_" + block_number + "_" + schedule_id + "_" + event_id;
  const leftLocalStateKey =
    "left_retire_states_" + block_number + "_" + schedule_id + "_" + event_id;
  const rightLocalStateKey =
    "right_retire_states_" + block_number + "_" + schedule_id + "_" + event_id;
  const handleTabChange = (event, newValue) => {
    if (newValue === 0) {
      localStorage.removeItem(localStateKey);
      localStorage.removeItem(leftLocalStateKey);
      localStorage.removeItem(rightLocalStateKey);
      router.push("/admin/block?block_number=" + block_number);
    }
    setTabIndex(newValue);
  };
  if (event_name === "dantai") {
    return (
      <>
        <CheckDantai
          block_number={block_number}
          schedule_id={schedule_id}
          event_id={event_id}
          update_interval={3000}
        />
      </>
    );
  } else if (
    event_name.includes("dantai_hokei") ||
    event_name.includes("tenkai")
  ) {
    return (
      <div style={isMobile ? { width: "110%" } : {}}>
        {isMobile ? (
          <Box>
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                backgroundColor: "white",
              }}
            >
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                aria-label="Record Tabs"
              >
                <Tab key="back" icon={<ArrowBackIosIcon fontSize="small" />} />
                <Tab key="main" label="点呼" />
                <Tab key="result" label="競技テーブル" />
              </Tabs>
            </Box>
            <Box>
              {tabIndex === 0 ? (
                <></>
              ) : tabIndex === 1 ? (
                <CheckTable
                  block_number={block_number}
                  schedule_id={schedule_id}
                  event_id={event_id}
                  update_interval={3000}
                  is_mobile={isMobile}
                />
              ) : (
                <GetTableResult
                  update_interval={3000}
                  event_name={event_name}
                  block_number={block_number}
                  is_mobile={isMobile}
                />
              )}
            </Box>
          </Box>
        ) : (
          <>
            <CheckTable
              block_number={block_number}
              schedule_id={schedule_id}
              event_id={event_id}
              update_interval={3000}
            />
            <GetTableResult
              update_interval={3000}
              event_name={event_name}
              block_number={block_number}
            />
          </>
        )}
      </div>
    );
  } else if (event_name.includes("dantai_zissen")) {
    return (
      <div style={isMobile ? { width: "110%" } : {}}>
        {isMobile ? (
          <Box>
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                backgroundColor: "white",
              }}
            >
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                aria-label="Record Tabs"
              >
                <Tab key="back" icon={<ArrowBackIosIcon fontSize="small" />} />
                <Tab key="main" label="点呼" />
                <Tab key="result" label="トーナメント" />
              </Tabs>
            </Box>
            <Box>
              {tabIndex === 0 ? (
                <></>
              ) : tabIndex === 1 ? (
                <CheckDantai
                  block_number={block_number}
                  schedule_id={schedule_id}
                  event_id={event_id}
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
          </Box>
        ) : (
          <>
            <CheckDantai
              block_number={block_number}
              schedule_id={schedule_id}
              event_id={event_id}
              update_interval={3000}
            />
            <GetResult
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
      <div style={isMobile ? { width: "110%" } : {}}>
        {isMobile ? (
          <Box>
            <Box
              sx={{
                position: "sticky",
                top: 0,
                zIndex: 1000,
                backgroundColor: "white",
              }}
            >
              <Tabs
                value={tabIndex}
                onChange={handleTabChange}
                aria-label="Record Tabs"
              >
                <Tab key="back" icon={<ArrowBackIosIcon fontSize="small" />} />
                <Tab key="main" label="点呼" />
                <Tab key="result" label="トーナメント" />
              </Tabs>
            </Box>
            <Box>
              {tabIndex === 0 ? (
                <></>
              ) : tabIndex === 1 ? (
                <CheckPlayers
                  block_number={block_number}
                  schedule_id={schedule_id}
                  event_id={event_id}
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
          </Box>
        ) : (
          <>
            <CheckPlayers
              block_number={block_number}
              schedule_id={schedule_id}
              event_id={event_id}
              update_interval={3000}
            />
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
