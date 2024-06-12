import React from "react";
import GetResult from "../../components/get_result";

const Home = () => {
  const hide = process.env.NEXT_PUBLIC_ON_TEST === "1";
  return (
    <>
      <GetResult event_name="hokei_woman" hide={hide} />
    </>
  );
};

export default Home;
