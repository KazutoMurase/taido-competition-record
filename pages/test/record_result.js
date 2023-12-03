import React from 'react';
import RecordResult from '../../components/record_result';
import GetResult from '../../components/get_result';
import { GetEventName } from '../../lib/get_event_name';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { block_number, schedule_id, event_id } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    const event_name = "test_" + GetEventName(event_id);
    const return_url = ("test/record_result?block_number=" + block_number + "%26schedule_id=" + schedule_id + "%26event_id=" + event_id);
        return (
                <>
                <RecordResult block_number={block_number} event_name={event_name} schedule_id={schedule_id} />
                <br />
                <GetResult editable={true} event_name={event_name} returnUrl={return_url} block_number={block_number} />
            </>
        );
}

export default Home;
