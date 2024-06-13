import Grid from "@mui/material/Grid";

function ShowWinner(item) {
  if (item["name"] !== undefined) {
    return (
      <>
        <div style={{ fontSize: "10px" }}>{item["name_kana"]}</div>
        <b style={{ fontSize: "16px" }}>{item["name"]}</b>
        <div style={{ fontSize: "12px" }}>
          {item["group"].replace("'", "【").replace("'", "】")}
        </div>
      </>
    );
  } else {
    return (
      <div style={{ fontSize: "16px" }}>
        {item["group"].replace("'", "").replace("'", "")}
      </div>
    );
  }
}

function GetSummary(winner1, winner2, winner3, winner4) {
  return (
    <Grid
      container
      justifyContent="center"
      alignItems="center"
      style={{ height: "120px" }}
    >
      <table border="1" style={{ width: "800px", "table-layout": "fixed" }}>
        <tbody>
          <tr style={{ fontSize: "12px" }}>
            <td>優勝　</td>
            <td>第2位</td>
            <td>第3位</td>
            <td>第4位</td>
          </tr>
          <tr style={{ height: "80px" }}>
            <td>{winner1 ? (winner1.group ? ShowWinner(winner1) : "") : ""}</td>
            <td>{winner2 ? (winner2.group ? ShowWinner(winner2) : "") : ""}</td>
            <td>{winner3 ? (winner3.group ? ShowWinner(winner3) : "") : ""}</td>
            <td>{winner4 ? (winner4.group ? ShowWinner(winner4) : "") : ""}</td>
          </tr>
        </tbody>
      </table>
    </Grid>
  );
}

export default GetSummary;
