import React from 'react';
import CheckPlayers from '../../components/check_players_on_block';
import CheckDantai from '../../components/check_dantai_on_block';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { block_number, schedule_id, dantai, event_id } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    if (dantai === '0') {
        return (
                <>
                <CheckPlayers block_number={block_number} schedule_id={schedule_id} event_id={event_id} update_interval={6000} is_test={true} />
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
