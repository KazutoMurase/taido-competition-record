import React from "react";
import { useEffect, useState } from "react";
import { GetEventName } from "../../lib/get_event_name";
import ResetButton from "../../components/reset";

const Home = () => {
  const [data, setData] = useState([]);
  const fetchData = async () => {
    const response = await fetch("/api/get_events");
    const result = await response.json();
    setData(result);
  };
  useEffect(() => {
    fetchData();
  }, []);
  let event_names = data?.map((item) => GetEventName(item["id"]));
  const filtered_event_names = event_names.filter((name) => name !== "dantai");
  // FIXME: database_name should be obtained from env
  return (
    <>
      <ResetButton
        database_name="2024_sogenhai"
        event_names={filtered_event_names}
        block_names={["block_a", "block_b", "block_c", "block_d"]}
        text="データベース初期化"
      />
    </>
  );
};

export default Home;
