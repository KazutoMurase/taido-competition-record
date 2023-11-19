import React from 'react';
import BlockA from '../components/block_a';
import HokeiManResult from '../components/hokei_man_result';

const Home = () => {
    return (
            <>
            <BlockA />
            <br />
            <hr />
            <HokeiManResult editable={true} />
            </>
    );
}

export default Home;
