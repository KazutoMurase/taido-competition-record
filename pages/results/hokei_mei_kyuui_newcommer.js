import React from "react";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";
import GetResult from "../../components/get_result";

export const getServerSideProps = async (context) => {
  const params = { production_test: process.env.PRODUCTION_TEST };
  return {
    props: { params },
  };
};

const Home = ({ params }) => {
  const hide = params.production_test === "1";
  return (
    <>
      <GetResult event_name="hokei_mei_kyuui_newcommer" hide={hide} />
    </>
  );
};

export default Home;
