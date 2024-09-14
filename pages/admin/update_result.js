import React from "react";
import UpdateResult from "../../components/update_result";
import { useRouter } from "next/router";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Home = () => {
  const router = useRouter();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  const { event_name, id, return_url } = router.query;
  if (event_name === undefined) {
    return <></>;
  }
  return (
    <UpdateResult
      event_name={event_name}
      id={id}
      is_mobile={isMobile}
      return_url={return_url}
    />
  );
};

export default Home;
