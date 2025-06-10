import Grid from "@mui/material/Grid";

export function ShowWinner(item) {
  if (item["free_name"]) {
    return (
      <div>
        <b style={{ fontSize: item["free_name"] > 6 ? "12px" : "16px" }}>
          {item["free_name"]}
        </b>
      </div>
    );
  } else if (item["name"] !== undefined) {
    return (
      <>
        <div style={{ fontSize: "10px" }}>{item["name_kana"]}</div>
        <b style={{ fontSize: "16px" }}>{item["name"]}</b>
        <div
          style={{
            fontSize: item["group"]?.length > 8 ? "8px" : "12px",
            minWidth: "100px",
          }}
        >
          {item["group"]?.replace("'", "【").replace("'", "】")}
        </div>
      </>
    );
  } else {
    return (
      <div>
        <b style={{ fontSize: item["group"]?.length > 6 ? "12px" : "16px" }}>
          {item["group"]?.replace("'", "").replace("'", "")}
        </b>
      </div>
    );
  }
}

function Summary({ winners }) {
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
            <td>
              {winners["1"]
                ? winners["1"].group
                  ? ShowWinner(winners["1"])
                  : ""
                : ""}
            </td>
            <td>
              {winners["2"]
                ? winners["2"].group
                  ? ShowWinner(winners["2"])
                  : ""
                : ""}
            </td>
            <td>
              {winners["3"]
                ? winners["3"].group
                  ? ShowWinner(winners["3"])
                  : ""
                : ""}
            </td>
            <td>
              {winners["4"]
                ? winners["4"].group
                  ? ShowWinner(winners["4"])
                  : ""
                : ""}
            </td>
          </tr>
        </tbody>
      </table>
    </Grid>
  );
}

export default Summary;
