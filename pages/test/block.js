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
  // TODO(shintarokkkk): fetch from Database
  let event_names = [];
  if (block_number === "u") {
    event_names = ["test_zissen_man", "test_tenkai_man"];
  } else if (block_number === "v") {
    event_names = ["test_hokei_man", "test_tenkai_woman"];
  } else if (block_number === "w") {
    event_names = ["test_zissen_woman"];
  } else if (block_number === "x") {
    event_names = ["test_hokei_woman"];
  } else if (block_number === "y") {
    event_names = ["test_dantai_hokei_man"];
  } else if (block_number === "z") {
    event_names = ["test_dantai_hokei_woman"];
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
