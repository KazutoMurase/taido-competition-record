import React from 'react';
import CheckPlayers from '../../components/check_players_on_block';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { block_number, schedule_id } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    return (
            <>
            <CheckPlayers block_number={block_number} schedule_id={schedule_id} />
            </>
    );
}

export default Home;
