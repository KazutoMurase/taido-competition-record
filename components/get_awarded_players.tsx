import React from "react";
import { useEffect, useState } from "react";
import { ShowWinner } from "./show_summary";

const GetAwardedPlayers: React.FC<{
  hide: boolean;
}> = ({ hide }) => {
  const [resultTable, setResultTable] = useState([]);
  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/get_awarded_players");
      const result = await response.json();
      let table = [];
      result.forEach((elem) => {
        table.push(
          <tr style={{ fontSize: "12px" }}>
            <td>
              <div style={{ fontSize: "16px" }}>{elem.award_name}</div>
            </td>
            <td>
              {hide ? (
                <div style={{ fontSize: "12px", minWidth: "100px" }}></div>
              ) : (
                ShowWinner(elem)
              )}
            </td>
          </tr>,
        );
      });
      setResultTable(table);
    }
    fetchData();
  }, [hide]);

  if (!resultTable) {
    return <></>;
  }
  return (
    <table border={1} style={{ width: "400px" }}>
      <tbody>{resultTable}</tbody>
    </table>
  );
};

export default GetAwardedPlayers;
