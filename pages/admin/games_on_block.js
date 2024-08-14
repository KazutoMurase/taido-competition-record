import React from "react";
import GamesOnBlock from "../../components/games_on_block";
import TableProgressOnBlock from "../../components/table_progress_on_block";
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
  if (event_name.includes("dantai_hokei")) {
    return (
      <>
        <TableProgressOnBlock
          block_number={block_number}
          event_name={event_name}
          schedule_id={schedule_id}
          update_interval={3000}
        />
        <br />
        <GetTableResult
          updateInterval={3000}
          event_name={event_name}
          block_number={block_number}
        />
      </>
    );
  } else {
    return (
      <>
        <GamesOnBlock
          block_number={block_number}
          event_name={event_name}
          schedule_id={schedule_id}
          update_interval={3000}
        />
        <br />
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
