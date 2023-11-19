import React from 'react';
import GamesOnBlock from '../components/games_on_block';
import HokeiManResult from '../components/hokei_man_result';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { block_number } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    return (
            <>
            <GamesOnBlock block_number={block_number} />
            <br />
            <hr />
            <HokeiManResult updateInterval={3000} />
            </>
    );
}

export default Home;
