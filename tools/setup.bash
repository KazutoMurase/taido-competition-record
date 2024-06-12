#!/bin/bash
competition_name=$1

systemctl start redis-server.service

if [ -z "${PRODUCTION}" ]; then
    /etc/init.d/postgresql start
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw taido_record; then
        echo "database already exists."
    else
        sudo -u postgres createdb taido_record
        cd /ws/data/$competition_name && sudo -u postgres psql -d taido_record < generate_tables.sql
        cd /ws/data/test && sudo -u postgres psql -d taido_record < generate_tables.sql
    fi
    cd /ws && npm install && npm run dev
elif [ -z "${PRODUCTION_TEST}" ]; then
    cd /ws && npm run start
else
    cd /ws && sed -i -e "s/NEXT_PUBLIC_ON_TEST=\"0\"/NEXT_PUBLIC_ON_TEST=\"1\"/" .env.production && npm run start
fi
