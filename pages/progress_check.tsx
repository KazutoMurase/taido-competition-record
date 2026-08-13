import React from "react";
import { useCallback, useEffect, useState } from "react";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";
import { useRouter } from "next/router";
import {
  Grid,
  Button,
  Box,
  Tabs,
  Tab,
  useMediaQuery,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ProgressOnBlock from "../components/progress_on_block";
import { GetLiveStreams } from "../lib/live_streams";
import { FetchJson } from "../lib/fetch_json";

export const getServerSideProps: GetServerSideProps = async (context) => {
  const params = {
    production_test: process.env.PRODUCTION_TEST,
    live_courts: GetLiveStreams().map((stream) => stream.court),
  };
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

  const fetchCourts = useCallback(async () => {
    try {
      const result = await FetchJson("/api/get_courts");
      if (!Array.isArray(result)) {
        throw new Error("Invalid courts response");
      }
      const tmp_courts = result.map((item) => item.name[1].toLowerCase());
      setCourts(tmp_courts);
      return true;
    } catch (error) {
      console.error("Failed to load courts", error);
      return false;
    }
  }, []);
  useEffect(() => {
    let retryTimer: number | undefined;
    let cancelled = false;
    const loadCourts = async () => {
      const loaded = await fetchCourts();
      if (!loaded && !cancelled) {
        retryTimer = window.setTimeout(loadCourts, 10000);
      }
    };
    loadCourts();
    return () => {
      cancelled = true;
      window.clearTimeout(retryTimer);
    };
  }, [fetchCourts]);
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
            variant="fullWidth"
            sx={{ maxWidth: "none" }}
          >
            {courts.map((court) => (
              <Tab
                key={court}
                label={
                  <Box textAlign="center">
                    <Typography variant="h5" fontWeight="bold">
                      {court.toUpperCase()}
                    </Typography>
                    コート
                  </Box>
                }
              />
            ))}
          </Tabs>
          <Box>
            <ProgressOnBlock
              block_number={courts[tabIndex]}
              update_interval={10000}
              return_url="/"
              hide={hide}
              has_live_stream={params.live_courts.includes(courts[tabIndex])}
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
              has_live_stream={params.live_courts.includes(court)}
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
