#!/bin/bash

if [ "${USE_LOCAL_REDIS}" == "1" ]; then
    systemctl start redis-server.service
fi

if [ "${USE_LOCAL_DB}" == "1" ]; then
    /etc/init.d/postgresql start
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw taido_record; then
        echo "database already exists."
    else
        sudo -u postgres createdb taido_record
        cd /ws/data/$COMPETITION_NAME && sudo -u postgres psql -d taido_record < generate_tables.sql
        cd /ws/data/test && sudo -u postgres psql -d taido_record < generate_tables.sql
    fi
fi

export COMPETITION_TITLE=`cat /ws/data/$COMPETITION_NAME/title.txt`


if [ -z "${PRODUCTION}" ]; then
    cd /ws && npm install && npm run dev
else
    cd /ws && npm run start
fi
