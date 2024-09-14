import React from "react";
import { useRouter } from "next/router";
import { Box, Tabs, Tab, useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Block from "../../components/block";

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const [tabIndex, setTabIndex] = React.useState(0);
  const { block_number } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  return (
    <>
      <Block
        block_number={block_number}
        update_interval={3000}
        is_mobile={isMobile}
        return_url="/admin"
      />
    </>
  );
};

export default Home;
