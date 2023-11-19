import React from 'react';
import RecordResult from '../components/record_result';
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
            <RecordResult block_number={block_number} />
            <br />
            <hr />
            <HokeiManResult editable={true} returnUrl={"record_result?block_number=" + block_number} />
            </>
    );
}

export default Home;
