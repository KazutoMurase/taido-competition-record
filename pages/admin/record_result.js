import React from "react";
import RecordResult from "../../components/record_result";
import GetResult from "../../components/get_result";
import { GetEventName } from "../../lib/get_event_name";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";
import { useRouter } from "next/router";
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
  const return_url =
    "admin/record_result?block_number=" +
    block_number +
    "%26schedule_id=" +
    schedule_id +
    "%26event_id=" +
    event_id;
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
            <Tab key="result" label="トーナメント" />
          </Tabs>
          <Box>
            {tabIndex === 0 ? (
              <></>
            ) : tabIndex === 1 ? (
              <RecordResult
                block_number={block_number}
                event_name={event_name}
                schedule_id={schedule_id}
                update_interval={3000}
                is_mobile={isMobile}
              />
            ) : (
              <GetResult
                editable={true}
                event_name={event_name}
                returnUrl={return_url}
                block_number={block_number}
                is_mobile={isMobile}
              />
            )}
          </Box>
        </Box>
      ) : (
        <>
          <RecordResult
            block_number={block_number}
            event_name={event_name}
            schedule_id={schedule_id}
            update_interval={3000}
          />
          <br />
          <GetResult
            editable={true}
            event_name={event_name}
            returnUrl={return_url}
            block_number={block_number}
          />
        </>
      )}
    </div>
  );
};

export default Home;
