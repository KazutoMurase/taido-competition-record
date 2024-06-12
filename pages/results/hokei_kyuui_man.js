import React from "react";
import GetResult from "../../components/get_result";

export async function getStaticProps(context) {
  const params = { production_test: process.env.PRODUCTION_TEST };
  return {
    props: { params },
  };
}

const Home = ({ params }) => {
  const hide = params.production_test === "1";
  return (
    <>
      <GetResult event_name="hokei_kyuui_man" hide={hide} />
    </>
  );
};

export default Home;
