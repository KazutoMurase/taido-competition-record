import Head from "next/head";
import GetResult from "../../components/get_result";
import GetTableResult from "../../components/get_table_result";
import GetClient from "../../lib/db_client";
import { GetLiveStreams } from "../../lib/live_streams";

const EVENT_NAME_PATTERN = /^[a-z][a-z0-9_]*$/;

export const getServerSideProps = async (context) => {
  const eventName = context.params?.event_name;
  if (typeof eventName !== "string" || !EVENT_NAME_PATTERN.test(eventName)) {
    return { notFound: true };
  }

  const client = await GetClient();
  const result = await client.query(
    "SELECT name, name_en FROM event_type WHERE name_en = $1 AND name_en <> 'finished'",
    [eventName],
  );
  if (result.rows.length === 0) {
    return { notFound: true };
  }

  const event = result.rows[0];
  return {
    props: {
      eventName: event.name_en,
      title: String(event.name || "").replace(/['"]+/g, ""),
      hide: process.env.PRODUCTION_TEST === "1",
      showHighlight: process.env.SHOW_HIGHLIGHT === "1",
      hasLiveStreams: GetLiveStreams().length > 0,
    },
  };
};

export default function ResultPage({
  eventName,
  title,
  hide,
  showHighlight,
  hasLiveStreams,
}) {
  const isTableEvent =
    eventName.includes("dantai_hokei") || eventName.includes("tenkai");

  return (
    <>
      <Head>
        <title>{title}</title>
      </Head>
      <main>
        {isTableEvent ? (
          <GetTableResult
            event_name={eventName}
            hide={hide}
            show_highlight={showHighlight}
            show_live_stream_link={hasLiveStreams}
          />
        ) : (
          <GetResult
            event_name={eventName}
            hide={hide}
            show_highlight={showHighlight}
            show_live_stream_link={hasLiveStreams}
          />
        )}
      </main>
    </>
  );
}
