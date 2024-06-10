import React from "react";
import { useEffect, useState } from "react";
import GetResult from "../../components/get_result";
import { useRouter } from "next/router";
import { GetEventName } from "../../lib/get_event_name";

const Home = () => {
  const router = useRouter();
  const { block_number, schedule_id, event_id, back_url } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = GetEventName(event_id);
  const return_url =
    "admin/check_result?block_number=" +
    block_number +
    "%26schedule_id=" +
    schedule_id +
    "%26event_id=" +
    event_id +
    "%26back_url=block?block_number=" +
    block_number;
  return (
    <>
      <GetResult
        editable={true}
        event_name={event_name}
        returnUrl={return_url}
        block_number={block_number}
        backUrl={back_url}
      />
    </>
  );
};

export default Home;
