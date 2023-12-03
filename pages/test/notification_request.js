import React from 'react';
import NotificationRequest from '../../components/notification_request';

const Home = () => {
    return (
            <>
            <NotificationRequest update_interval={6000} return_url="/test" is_test={true} />
            </>
    );
}

export default Home;
