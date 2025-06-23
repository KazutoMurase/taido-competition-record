import React from "react";
import Head from "next/head";
import { useState, useEffect } from "react";
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
  const [title, setTitle] = useState([]);
  const fetchData = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    for (let i = 0; i < result.length; i++) {
      if (result[i].name_en === "tenkai_man") {
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
        <GetTableResult event_name="tenkai_man" hide={hide} />
      </main>
    </>
  );
};

export default Home;
