import React from "react";
import NotificationRequest from "../../components/notification_request";
import { useMediaQuery } from "@mui/material";
import { useTheme } from "@mui/material/styles";

const Home = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("sm"));
  return (
    <>
      <NotificationRequest
        update_interval={6000}
        is_mobile={isMobile}
        return_url="/test"
        is_test={true}
      />
    </>
  );
};

export default Home;
