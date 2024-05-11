import axios from "axios";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Grid from "@mui/material/Grid";
import Container from "@mui/material/Container";
import React from "react";
import ReactDOM from "react-dom";

function onSubmit(event_names, block_names) {
  let post = { event_names: event_names, block_names: block_names };
  axios
    .post("/api/reset_test_db", post)
    .then((response) => {})
    .catch((e) => {
      console.log(e);
    });
}

const PopupComponent = ({ onClose, event_names, block_names }) => {
  const handleDecision = () => {
    onSubmit(event_names, block_names);
    onClose();
  };

  return (
    <div className="popup">
      <p>
        <b>
          本当に初期化しますか？
          <br />
          辞める場合はwindowを閉じて下さい
        </b>
      </p>
      <button onClick={handleDecision}>本当に初期化する</button>
    </div>
  );
};

function ResetButton({ event_names, block_names, text }) {
  const handlePopup = () => {
    const popupWindow = window.open("", "_blank", "width=350,height=50");

    popupWindow.document.body.innerHTML = `
      <div id="popup-container"></div>
    `;
    const popupContainer =
      popupWindow.document.getElementById("popup-container");

    const handleClose = () => {
      popupWindow.close();
    };

    ReactDOM.render(
      <PopupComponent
        onClose={handleClose}
        event_names={event_names}
        block_names={block_names}
      />,
      popupContainer,
    );
  };
  return (
    <div>
      <Container maxWidth="md">
        <Box style={{ minWidth: "840px" }}>
          <Grid
            container
            justifyContent="center"
            alignItems="center"
            style={{ height: "80px" }}
          >
            <Button
              variant="contained"
              type="submit"
              style={{ backgroundColor: "gray" }}
              onClick={handlePopup}
            >
              {text}
            </Button>
          </Grid>
        </Box>
      </Container>
    </div>
  );
}

export default ResetButton;
