#!/bin/bash

if [ "${USE_LOCAL_REDIS}" == "1" ]; then
    systemctl start redis-server.service
fi

if [ "${USE_LOCAL_DB}" == "1" ]; then
    /etc/init.d/postgresql start
    count=$(sudo -u postgres psql -d postgres -t -c "SELECT count(*) FROM pg_catalog.pg_tables WHERE schemaname='public';" | xargs)
    if [ "$count" -eq 0 ]; then
        sudo -u postgres createdb postgres
        cd /ws/data/$COMPETITION_NAME/static && sudo -u postgres psql -d postgres < generate_tables.sql
        if [ "${USE_RESULT_DATA}" == "1" ]; then
            cd /ws/data/$COMPETITION_NAME/result && sudo -u postgres psql -d postgres < ../original/generate_tables.sql
        else
            cd /ws/data/$COMPETITION_NAME/original && sudo -u postgres psql -d postgres < generate_tables.sql
        fi
        cd /ws/data/test/static && sudo -u postgres psql -d postgres < generate_tables.sql
        cd /ws/data/test/original && sudo -u postgres psql -d postgres < generate_tables.sql
    else
        echo "database already exists."
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
