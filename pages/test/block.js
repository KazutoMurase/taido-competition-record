import React from "react";
import { useRouter } from "next/router";
import Block from "../../components/block";
import ResetButton from "../../components/reset";

const Home = () => {
  const router = useRouter();
  const { block_number } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  // TODO:
  let event_names = [];
  if (block_number === "x") {
    event_names = ["test_hokei_man", "test_zissen_man", "test_dantai_hokei"];
  } else if (block_number === "y") {
    event_names = ["test_hokei_woman", "test_zissen_woman", "test_tenkai"];
  }
  return (
    <>
      <Block
        block_number={block_number}
        update_interval={6000}
        return_url="/test"
      />
      <ResetButton
        database_name="test"
        event_names={event_names}
        block_names={["block_" + block_number]}
        text="初期化"
      />
    </>
  );
};

export default Home;
