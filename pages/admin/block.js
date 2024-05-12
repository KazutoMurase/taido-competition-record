import React from "react";
import { useRouter } from "next/router";
import Block from "../../components/block";

const Home = () => {
  const router = useRouter();
  const { block_number } = router.query;
  if (block_number === undefined) {
    return <></>;
  }
  return (
    <>
      <Block
        block_number={block_number}
        update_interval={3000}
        return_url="/admin"
      />
    </>
  );
};

export default Home;
