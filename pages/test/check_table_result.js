import React from "react";
import { useEffect, useState } from "react";
import GetTableResult from "../../components/get_table_result";
import { useRouter } from "next/router";
import { GetEventName } from "../../lib/get_event_name";

const Home = () => {
  const router = useRouter();
  const { block_number, schedule_id, event_id, back_url } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = "test_" + GetEventName(event_id);
  const return_url =
    "test/check_table_result?block_number=" +
    block_number +
    "%26schedule_id=" +
    schedule_id +
    "%26event_id=" +
    event_id +
    "%26back_url=block?block_number=" +
    block_number;
  return (
    <>
      <GetTableResult
        editable={true}
        event_name={event_name}
        return_url={return_url}
        block_number={block_number}
        back_url={back_url}
      />
    </>
  );
};

export default Home;
