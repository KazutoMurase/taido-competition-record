import React from "react";
import CheckPlayers from "../../components/check_players_on_block";
import CheckDantai from "../../components/check_dantai_on_block";
import CheckTable from "../../components/check_table_on_block";
import GetResult from "../../components/get_result";
import GetTableResult from "../../components/get_table_result";
import { useRouter } from "next/router";
import { GetEventName } from "../../lib/get_event_name";

const Home = () => {
  const router = useRouter();
  const { block_number, schedule_id, event_id } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = GetEventName(event_id);
  if (event_name === "dantai") {
    return (
      <>
        <CheckDantai
          block_number={block_number}
          schedule_id={schedule_id}
          event_id={event_id}
          update_interval={3000}
        />
      </>
    );
  } else if (
    event_name.includes("dantai_hokei") ||
    event_name.includes("tenkai")
  ) {
    return (
      <>
        <CheckTable
          block_number={block_number}
          schedule_id={schedule_id}
          event_id={event_id}
          update_interval={3000}
        />
        <GetTableResult
          update_interval={3000}
          event_name={event_name}
          block_number={block_number}
        />
      </>
    );
  } else if (event_name.includes("dantai_zissen")) {
    return (
      <>
        <CheckDantai
          block_number={block_number}
          schedule_id={schedule_id}
          event_id={event_id}
          update_interval={3000}
        />
        <GetResult
          updateInterval={3000}
          event_name={event_name}
          block_number={block_number}
        />
      </>
    );
  } else {
    return (
      <>
        <CheckPlayers
          block_number={block_number}
          schedule_id={schedule_id}
          event_id={event_id}
          update_interval={3000}
        />
        <GetResult
          updateInterval={3000}
          event_name={event_name}
          block_number={block_number}
        />
      </>
    );
  }
};

export default Home;
