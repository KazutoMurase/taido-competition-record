import React from "react";
import Head from "next/head";
import { useState, useEffect } from "react";
import { InferGetServerSidePropsType, GetServerSideProps } from "next";
import GetResult from "../../components/get_result";

export const getServerSideProps = async (context) => {
  const params = {
    production_test: process.env.PRODUCTION_TEST,
    show_highlight_in_tournament: process.env.SHOW_HIGHLIGHT_IN_TOURNAMENT,
  };
  return {
    props: { params },
  };
};
const Home = ({ params }) => {
  const hide = params.production_test === "1";
  const show_highlight = params.show_highlight_in_tournament === "1";
  const [title, setTitle] = useState([]);
  const fetchData = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    for (let i = 0; i < result.length; i++) {
      if (result[i].name_en === "lower_grades_hokei_woman") {
        setTitle(result[i].name.replace(/['"]+/g, ""));
      }
    }
  };
  useEffect(() => {
    fetchData();
  }, []);
  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main>
        <GetResult
          event_name="lower_grades_hokei_woman"
          hide={hide}
          show_highlight={show_highlight}
        />
      </main>
    </>
  );
};

export default Home;
