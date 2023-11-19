import React from 'react';
import BlockAList from '../components/block_a_list';
import HokeiManResult from '../components/hokei_man_result';

const Home = () => {
    return (
            <>
            <BlockAList />
            <br />
            <hr />
            <HokeiManResult updateInterval={3000} />
            </>
    );
}

export default Home;
