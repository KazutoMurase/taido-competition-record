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
                let url = '/api/event_name?block_number=' + block_number;
                if (schedule_id !== undefined) {
                    url += '&schedule_id=' + schedule_id;
                }
                const response = await fetch(url);
                const result = await response.json();
                setData(result);
            }
            fetchData();
        }, []);
        const return_url = (schedule_id === undefined ? "admin/record_result?block_number=" + block_number :
                            "admin/record_result?block_number=" + block_number + "%26schedule_id=" + schedule_id);
        return (
                <>
                {schedule_id === undefined ? data.map((item, index) => (
                        <RecordResult block_number={block_number} event_name={item} />
                )) : <></>}
                <br />
                <hr />
                {data.map((item, index) => (
                        <GetResult editable={true} event_name={item} returnUrl={return_url} />
                ))}
            </>
        );
}

export default Home;
