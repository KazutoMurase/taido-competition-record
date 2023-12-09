import React from 'react';
import GetResult from '../../components/get_result';

const Home = () => {
    return (
            <>
            <GetResult event_name='hokei_woman' updateInterval={60000} freeze={0} />
            </>
    );
}

export default Home;
