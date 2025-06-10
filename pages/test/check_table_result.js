import React from "react";
import { useEffect, useState } from "react";
import GetTableResult from "../../components/get_table_result";
import { useRouter } from "next/router";
import { Box, Tabs, Tab, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { GetEventName } from "../../lib/get_event_name";
import ArrowBackIosIcon from "@mui/icons-material/ArrowBackIos";

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tabIndex, setTabIndex] = React.useState(1);
  const { block_number, schedule_id, event_id, back_url } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = "test_" + GetEventName(event_id);
  const return_url =
    "test/check_table_result?block_number=" +
    block_number +
    "%26schedule_id=" +
    schedule_id +
    "%26event_id=" +
    event_id +
    "%26back_url=block?block_number=" +
    block_number;
  const handleTabChange = (event, newValue) => {
    if (newValue === 0) {
      router.push("/test/block?block_number=" + block_number);
    }
    setTabIndex(newValue);
  };
  return (
    <>
      {isMobile ? (
        <Box>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="Record Tabs"
          >
            <Tab key="back" icon={<ArrowBackIosIcon fontSize="small" />} />
            <Tab key="result" label="競技テーブル" />
          </Tabs>
        </Box>
      ) : (
        <></>
      )}
      <GetTableResult
        editable={true}
        event_name={event_name}
        return_url={return_url}
        block_number={block_number}
        is_mobile={isMobile}
        back_url={back_url}
      />
    </>
  );
};

export default Home;
