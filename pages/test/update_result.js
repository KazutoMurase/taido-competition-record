import React from 'react';
import UpdateResult from '../../components/update_result';
import { useRouter } from 'next/router';

const Home = () => {
    const router = useRouter();
    const { event_name, id, return_url } = router.query;
    if (event_name === undefined) {
        return (<></>);
    }
    return (
            <UpdateResult event_name={event_name} id={id} return_url={return_url} />
    );
}

export default Home;
