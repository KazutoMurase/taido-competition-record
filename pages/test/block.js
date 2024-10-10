import React from "react";
import { useRouter } from "next/router";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import Block from "../../components/block";
import ResetButton from "../../components/reset";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { block_number } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  // TODO(shintarokkkk): fetch from Database
  let event_names = [];
  if (block_number === "u") {
    event_names = [
      "test_hokei_man",
      "test_zissen_man",
      "test_dantai_hokei_man",
      "test_tenkai_man",
    ];
  } else if (block_number === "v") {
    event_names = [
      "test_hokei_woman",
      "test_zissen_woman",
      "test_dantai_hokei_woman",
      "test_tenkai_woman",
    ];
  } else if (block_number === "w") {
    event_names = [
      "test_hokei_kyuui_man",
      "test_zissen_kyuui_man",
      "test_dantai_hokei",
    ];
  } else if (block_number === "x") {
    event_names = [
      "test_hokei_kyuui_woman",
      "test_zissen_kyuui_woman",
      "test_dantai_hokei_newcommer",
    ];
  } else if (block_number === "y") {
    event_names = ["test_hokei_sei", "test_zissen_sonen_man"];
  } else if (block_number === "z") {
    event_names = ["test_hokei_mei", "test_zissen_sonen_woman"];
  }
  const minWidth = isMobile ? "200px" : "720px";
  return (
    <Container maxWith="md">
      <Grid container justifyContent="center" alignItems="center">
        <Block
          block_number={block_number}
          update_interval={6000}
          is_mobile={isMobile}
          return_url="/test"
        />
      </Grid>
      <Grid container justifyContent="center" alignItems="center">
        <ResetButton
          database_name="test"
          event_names={event_names}
          block_names={["block_" + block_number]}
          text="初期化"
          is_mobile={isMobile}
        />
      </Grid>
    </Container>
  );
};

export default Home;
