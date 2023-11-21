import React from 'react';
import { useEffect, useState } from 'react';
import GamesOnBlock from '../../components/games_on_block';
import GetResult from '../../components/get_result';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { block_number } = router.query;
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
                    <GamesOnBlock block_number={block_number} event_name={item} />
            ))}
            <br />
            <hr />
            {data.map((item, index) => (
                <GetResult updateInterval={3000} event_name={item} />
            ))}
            </>
    );
}

export default Home;
