import React from "react";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";
import GetTableResult from "../../components/get_table_result";

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
      <GetTableResult event_name="dantai_hokei_newcommer" hide={hide} />
    </>
  );
};

export default Home;
