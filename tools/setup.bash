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
        cd /ws/data/$COMPETITION_NAME/static && sudo -u postgres psql -d taido_record < generate_tables.sql
        if [ "${USE_RESULT_DATA}" == "1" ]; then
            cd /ws/data/$COMPETITION_NAME/result && sudo -u postgres psql -d taido_record < ../original/generate_tables.sql
        else
            cd /ws/data/$COMPETITION_NAME/original && sudo -u postgres psql -d taido_record < generate_tables.sql
        fi
        cd /ws/data/test/static && sudo -u postgres psql -d taido_record < generate_tables.sql
        cd /ws/data/test/original && sudo -u postgres psql -d taido_record < generate_tables.sql
    fi
fi

export COMPETITION_TITLE=$(cat /ws/data/$COMPETITION_NAME/title.txt)
export NEXT_PUBLIC_COMPETITION_TITLE=$(cat /ws/data/$COMPETITION_NAME/title.txt)
export TOP_IMAGE_PATH=$(cat "/ws/data/${COMPETITION_NAME}/top_image_path.txt" 2>/dev/null || echo "")


if [ -z "${PRODUCTION}" ]; then
    cd /ws && npm install && npm run dev
else
    cd /ws && npm run start
fi
