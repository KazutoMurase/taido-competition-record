import React from "react";

import ProgressOnBlock from "../../components/progress_on_block";

const ProgressCheck: React.FC = () => {
  return (
    <>
      <div>
        <ProgressOnBlock
          block_number="x"
          update_interval={1000}
          return_url="/test"
        />
      </div>
      <div>
        <ProgressOnBlock
          block_number="y"
          update_interval={1000}
          return_url="/test"
        />
      </div>
    </>
  );
};

export default ProgressCheck;
