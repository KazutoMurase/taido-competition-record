import React from "react";
import NotificationRequest from "../../components/notification_request";

const Home = () => {
  return <NotificationRequest update_interval={3000} return_url="/admin" />;
};

export default Home;
