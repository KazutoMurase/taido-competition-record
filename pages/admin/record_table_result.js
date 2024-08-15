import React from "react";
import RecordTableResult from "../../components/record_table_result";
import { GetEventName } from "../../lib/get_event_name";
import GetTableResult from "../../components/get_table_result";
import { useRouter } from "next/router";

const Home = () => {
  const router = useRouter();
  const { block_number, schedule_id, event_id } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = GetEventName(event_id);
  const return_url =
    "admin/record_table_result?block_number=" +
    block_number +
    "%26schedule_id=" +
    schedule_id +
    "%26event_id=" +
    event_id;
  return (
    <>
      <RecordTableResult
        block_number={block_number}
        event_name={event_name}
        schedule_id={schedule_id}
        update_interval={3000}
      />
      <br />
      <GetTableResult
        editable={true}
        event_name={event_name}
        return_url={return_url}
        block_number={block_number}
      />
    </>
  );
};

export default Home;
