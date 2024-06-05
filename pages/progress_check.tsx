import React from "react";
import { useRouter } from "next/router";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";

import ProgressOnBlock from "../components/progress_on_block";

const ProgressCheck: React.FC = () => {
  const router = useRouter();
  const onBack = () => {
    router.back();
  };
  return (
    <div style={{ width: "1900px" }}>
      <Grid container>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="a"
            update_interval={10000}
            return_url="/"
          />
        </Grid>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="b"
            update_interval={10000}
            return_url="/"
          />
        </Grid>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="c"
            update_interval={10000}
            return_url="/"
          />
        </Grid>
        <Grid item xs={3}>
          <ProgressOnBlock
            block_number="d"
            update_interval={10000}
            return_url="/"
          />
        </Grid>
      </Grid>
      <Grid
        container
        justifyContent="center"
        alignItems="center"
        style={{ height: "100px" }}
      >
        <Button variant="contained" type="submit" onClick={(e) => onBack()}>
          戻る
        </Button>
      </Grid>
    </div>
  );
};

export default ProgressCheck;
