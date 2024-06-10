import React from "react";
import { useRouter } from "next/router";
import { Grid, Button, Box, Tabs, Tab, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import ProgressOnBlock from "../components/progress_on_block";

const ProgressCheck: React.FC = () => {
  const router = useRouter();
  const onBack = () => {
    router.back();
  };
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const blockNumberList = ["a", "b", "c", "d"];
  const [tabIndex, setTabIndex] = React.useState(0);
  const handleTabChange = (event, newValue) => {
    setTabIndex(newValue);
  };

  return (
    <div style={isMobile ? { width: '100%' } : {}}>
      {isMobile ? (
        <Box>
          <Tabs value={tabIndex} onChange={handleTabChange} aria-label="Progress Tabs">
            {blockNumberList.map(block => (
              <Tab label={`${block.toUpperCase()}コート`} />
            ))}
          </Tabs>
          <Box>
            <ProgressOnBlock block_number={blockNumberList[tabIndex]} update_interval={10000} return_url="/" />
          </Box>
        </Box>
        ) : (
        <Box display="flex">
        {blockNumberList.map(block => (
          <ProgressOnBlock
            block_number={block}
            update_interval={10000}
            return_url="/"
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
