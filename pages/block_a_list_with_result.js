import React from 'react';
import GamesOnBlock from '../components/games_on_block';
import HokeiManResult from '../components/hokei_man_result';

const Home = () => {
    return (
            <>
            <GamesOnBlock block_number='a' />
            <br />
            <hr />
            <HokeiManResult updateInterval={3000} />
            </>
    );
}

export default Home;
