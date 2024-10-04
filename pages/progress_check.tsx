import React from "react";
import { useEffect, useState } from "react";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { useRouter } from "next/router";
import { Grid, Button, Box, Tabs, Tab, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ProgressOnBlock from "../components/progress_on_block";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const params = { production_test: process.env.PRODUCTION_TEST };
  return {
    props: { params },
  };
};

const ProgressCheck: React.FC = ({
  params,
}: InferGetServerSidePropsType<typeof getServerSideProps>) => {
  const router = useRouter();
  const onBack = () => {
    router.back();
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tabIndex, setTabIndex] = React.useState(0);
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };
  const hide = params.production_test === "1";
  const [courts, setCourts] = useState([]);

  const fetchCourts = async () => {
    const response = await fetch("/api/get_courts");
    const result = await response.json();
    let tmp_courts = [];
    result.map((item) => {
      if (!item.name.includes("X") && !item.name.includes("Y")) {
        tmp_courts.push(item.name[1]);
      }
    });
    setCourts(tmp_courts);
  };
  useEffect(() => {
    fetchCourts();
  }, []);
  if (courts.length === 0) {
    return <></>;
  }
  return (
    <div style={isMobile ? { width: courts.length > 4 ? "150%" : "100%" } : {}}>
      {isMobile ? (
        <Box>
          <Tabs
            value={tabIndex}
            onChange={handleTabChange}
            aria-label="Progress Tabs"
          >
            {courts.map((court) => (
              <Tab key={court} label={`${court.toUpperCase()}コート`} />
            ))}
          </Tabs>
          <Box>
            <ProgressOnBlock
              block_number={courts[tabIndex]}
              update_interval={10000}
              return_url="/"
              hide={hide}
            />
          </Box>
        </Box>
      ) : (
        <Box display="flex">
          {courts.map((court) => (
            <ProgressOnBlock
              key={court}
              block_number={court}
              update_interval={10000}
              return_url="/"
              hide={hide}
            />
          ))}
        </Box>
      )}
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "100px" }}
      >
        <Button variant="contained" type="submit" onClick={(e) => onBack()}>
          戻る
        </Button>
      </Grid>
    </div>
  );
};

export default ProgressCheck;
