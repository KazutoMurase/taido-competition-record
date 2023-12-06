import React from 'react';
import CheckPlayers from '../../components/check_players_on_block';
import CheckDantai from '../../components/check_dantai_on_block';
import GetResult from '../../components/get_result';
import { useRouter } from 'next/router';
import { GetEventName } from '../../lib/get_event_name';

const Home = () => {
    const router = useRouter();
    const { block_number, schedule_id, dantai, event_id } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    if (dantai === '0') {
        const event_name = "test_" + GetEventName(event_id);
        return (
                <>
                <CheckPlayers block_number={block_number} schedule_id={schedule_id} event_id={event_id} update_interval={6000} is_test={true} />
                <GetResult updateInterval={6000} event_name={event_name} block_number={block_number} />
                </>
        );
    } else {
        return (
                <>
                <CheckDantai block_number={block_number} schedule_id={schedule_id} event_id={event_id} update_interval={6000} is_test={true} />
                </>
        );
    }
}

export default Home;
