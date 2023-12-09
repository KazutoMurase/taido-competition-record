import React from 'react';
import GetResult from '../../components/get_result';

const Home = () => {
    return (
            <>
            <GetResult event_name='zissen_man' updateInterval={60000} freeze={0} />
            </>
    );
}

export default Home;
