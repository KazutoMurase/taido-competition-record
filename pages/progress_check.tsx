import React from "react";
import Grid from "@mui/material/Grid";

import ProgressOnBlock from "../components/progress_on_block";

const ProgressCheck: React.FC = () => {
  return (
    <div style={{ width: "1900px" }}>
      <Grid container>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="a"
            update_interval={1000}
            return_url="/"
          />
        </Grid>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="b"
            update_interval={1000}
            return_url="/"
          />
        </Grid>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="c"
            update_interval={1000}
            return_url="/"
          />
        </Grid>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="d"
            update_interval={1000}
            return_url="/"
          />
        </Grid>
      </Grid>
    </div>
  );
};

export default ProgressCheck;
