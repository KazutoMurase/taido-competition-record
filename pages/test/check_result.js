import Button from "@mui/material/Button";
import React from "react";
import GetResult from "../../components/get_result";
import { useRouter } from "next/router";
import { GetEventName } from "../../lib/get_event_name";

const Home = () => {
  const router = useRouter();
  const { block_number, schedule_id, event_id } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  const event_name = "test_" + GetEventName(event_id);
  const return_url =
    "test/check_result?block_number=" +
    block_number +
    "%26schedule_id=" +
    schedule_id +
    "%26event_id=" +
    event_id;
  return (
    <>
      <GetResult
        editable={true}
        event_name={event_name}
        returnUrl={return_url}
        block_number={block_number}
      />
      <div
        style={{
          textAlign: "center",
        }}
      >
        <Button
          variant="contained"
          type="submit"
          onClick={(e) => {
            router.push("/test/block?block_number=" + block_number);
          }}
        >
          コートメニューに戻る
        </Button>
      </div>
    </>
  );
};

export default Home;
