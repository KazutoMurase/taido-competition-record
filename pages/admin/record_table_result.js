import React from "react";
import RecordTableResult from "../../components/record_table_result";
import { GetEventName } from "../../lib/get_event_name";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import GetTableResult from "../../components/get_table_result";
import { useRouter } from "next/router";
import { Box, Tabs, Tab, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { block_number, schedule_id, event_id, tab_index } = router.query;
  const [tabIndex, setTabIndex] = React.useState(tab_index ? tab_index : 1);
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = GetEventName(event_id);
  const return_url =
    "admin/record_table_result?block_number=" +
    block_number +
    "%26schedule_id=" +
    schedule_id +
    "%26event_id=" +
    event_id +
    "%26tab_index=2";
  const handleTabChange = (event, newValue) => {
    if (newValue === 0) {
      router.push("/admin/block?block_number=" + block_number);
    }
    setTabIndex(newValue);
  };
  return (
    <div style={isMobile ? { width: "100%" } : {}}>
      {isMobile ? (
        <Box>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="Record Tabs"
          >
            <Tab key="back" icon={<ArrowBackIosIcon fontSize="small" />} />
            <Tab key="main" label="記録" />
            <Tab key="result" label="競技テーブル" />
          </Tabs>
          <Box>
            {tabIndex === 0 ? (
              <></>
            ) : tabIndex === 1 ? (
              <RecordTableResult
                block_number={block_number}
                event_name={event_name}
                schedule_id={schedule_id}
                update_interval={3000}
                is_mobile={isMobile}
              />
            ) : (
              <GetTableResult
                editable={true}
                event_name={event_name}
                return_url={return_url}
                block_number={block_number}
                is_mobile={isMobile}
              />
            )}
          </Box>
        </Box>
      ) : (
        <>
          <RecordTableResult
            block_number={block_number}
            event_name={event_name}
            schedule_id={schedule_id}
            update_interval={3000}
          />
          <br />
          <GetTableResult
            editable={true}
            event_name={event_name}
            return_url={return_url}
            block_number={block_number}
          />
        </>
      )}
    </div>
  );
};

export default Home;
