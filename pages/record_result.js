import React from 'react';
import { useEffect, useState } from 'react';
import RecordResult from '../components/record_result';
import GetResult from '../components/get_result';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { block_number, schedule_id } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    const [data, setData] = useState([]);
    useEffect(() => {
      async function fetchData() {
      const response = await fetch('/api/event_name?block_number=' + block_number);
      const result = await response.json();
          setData(result);
      }
      fetchData();
    }, []);
    return (
            <>
            {data.map((item, index) => (
                    <RecordResult block_number={block_number} event_name={item} />
            ))}
            <br />
            <hr />
            {data.map((item, index) => (
                    <GetResult editable={true} event_name={item} returnUrl={"record_result?block_number=" + block_number} />
            ))}
            </>
    );
}

export default Home;
