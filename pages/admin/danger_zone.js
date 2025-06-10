import React from "react";
import { useEffect, useState } from "react";
import { GetEventName } from "../../lib/get_event_name";
import ResetButton from "../../components/reset";

export const getServerSideProps = async (context) => {
  const params = { database_name: process.env.COMPETITION_NAME };
  return {
    props: { params },
  };
};

const Home = ({ params }) => {
  const [data, setData] = useState([]);
  const fetchData = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    setData(result);
  };
  useEffect(() => {
    fetchData();
  }, []);
  let event_names = data?.map((item) => {
    return item["existence"] ? GetEventName(item["id"]) : "";
  });
  const filtered_event_names = event_names.filter((name) => {
    return name !== "dantai" && name !== "";
  });
  const [blocks, setBlocks] = useState([]);

  const fetchBlocks = async () => {
    const response = await fetch("/api/get_courts");
    const result = await response.json();
    let tmp_blocks = [];
    result.map((item) => {
      tmp_blocks.push("block_" + item.name[1].toLowerCase());
    });
    setBlocks(tmp_blocks);
  };
  useEffect(() => {
    fetchBlocks();
  }, []);
  return (
    <>
      <ResetButton
        database_name={params.database_name}
        event_names={filtered_event_names}
        block_names={blocks}
        text="データベース初期化"
      />
    </>
  );
};

export default Home;
