import React from "react";
import { useEffect, useState } from "react";
import { ShowWinner } from "./show_summary";

const GetAwardedPlayers: React.FC<{
  hide: boolean;
  is_high_school_result: boolean;
}> = ({ hide, is_high_school_result }) => {
  const [resultTable, setResultTable] = useState([]);
  useEffect(() => {
    async function fetchData() {
      const response = await fetch("/api/get_awarded_players");
      const result = await response.json();
      let table = [];
      result.forEach((elem) => {
        if (is_high_school_result) {
          if (!elem.award_name.includes("高校")) {
            return;
          }
        } else {
          if (elem.award_name.includes("高校")) {
            return;
          }
        }
        table.push(
          <tr style={{ fontSize: "12px" }}>
            <td>
              <div style={{ fontSize: "16px" }}>
                {elem.award_name.replace("高校", "")}
              </div>
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
  }, [hide, is_high_school_result]);

  if (!resultTable) {
    return <></>;
  }
  return (
    <table className="default" border={1} style={{ width: "400px" }}>
      <tbody>{resultTable}</tbody>
    </table>
  );
};

export default GetAwardedPlayers;
