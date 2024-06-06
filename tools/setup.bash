#!/bin/bash
competition_name=$1

systemctl start redis-server.service

if [ -z "${PRODUCTION}" ]; then
    /etc/init.d/postgresql start
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw taido_record; then
        echo "database already exists."
        cd /ws && npm install && npx prisma migrate dev && npm run dev
    else
        sudo -u postgres createdb taido_record
        cd /ws && npm install && npx prisma migrate dev
        echo "seeding initial data."
        cd /ws/data/$competition_name && sudo -u postgres psql -d taido_record < seed_initial_data.sql
        cd /ws/data/test && sudo -u postgres psql -d taido_record < seed_initial_data.sql
        cd /ws && npm run dev
    fi
else
    cd /ws && npx prisma migrate deploy && npm run start
fi
