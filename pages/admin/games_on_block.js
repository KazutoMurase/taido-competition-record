import React from 'react';
import { useEffect, useState } from 'react';
import GamesOnBlock from '../../components/games_on_block';
import GetResult from '../../components/get_result';
import { useRouter } from 'next/router';
import { GetEventName } from '../../lib/get_event_name';

const Home = () => {
    const router = useRouter();
    const { block_number, schedule_id, event_id } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    const event_name = GetEventName(event_id);
    return (
            <>
            <GamesOnBlock block_number={block_number} event_name={event_name} schedule_id={schedule_id} />
            <br />
            <GetResult updateInterval={3000} event_name={event_name} block_number={block_number} />
            </>
    );
}

export default Home;
