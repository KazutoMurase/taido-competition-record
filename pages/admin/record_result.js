import React from 'react';
import { useEffect, useState } from 'react';
import RecordResult from '../../components/record_result';
import GetResult from '../../components/get_result';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { block_number, schedule_id } = router.query;
    if (block_number === undefined) {
        return (<></>);
    }
    const [data, setData] = useState([]);
    useEffect(() => {
            async function fetchData() {
                let url = '/api/event_name?block_number=' + block_number + "&schedule_id=" + schedule_id;
                const response = await fetch(url);
                const result = await response.json();
                setData(result);
            }
            fetchData();
        }, []);
        const return_url = ("admin/record_result?block_number=" + block_number + "%26schedule_id=" + schedule_id);
        return (
                <>
                {data.map((item, index) => (
                        <RecordResult block_number={block_number} event_name={item} schedule_id={schedule_id} />
                ))}
                <br />
                {data.map((item, index) => (
                        <GetResult editable={true} event_name={item} returnUrl={return_url} block_number={block_number} />
                ))}
            </>
        );
}

export default Home;
