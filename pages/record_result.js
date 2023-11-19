import React from 'react';
import RecordResult from '../components/record_result';
import GetResult from '../components/get_result';
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
            <GetResult editable={true} event_name='hokei_man' returnUrl={"record_result?block_number=" + block_number} />
            </>
    );
}

export default Home;
