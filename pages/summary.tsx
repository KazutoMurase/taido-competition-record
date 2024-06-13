import React from "react";
import GetSummary from "../components/get_summary";

const Summary: React.FC = ({}) => {
  // TODO: use api/get_events
  const event_ids = [1, 2, 3, 4, 12, 13, 14, 15, 16, 17];
  return (
    <>
      {event_ids.map((id) => (
        <GetSummary event_id={id} />
      ))}
    </>
  );
};

export default Summary;
