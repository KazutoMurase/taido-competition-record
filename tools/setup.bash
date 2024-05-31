#!/bin/bash
competition_name=$1

systemctl start redis-server.service

/etc/init.d/postgresql start
if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw taido_record; then
    echo "database already exists."
else
    sudo -u postgres createdb taido_record
    cd /ws/data/$competition_name && sudo -u postgres psql -d taido_record < generate_tables.sql
    cd /ws/data/test && sudo -u postgres psql -d taido_record < generate_tables.sql
fi
cd /ws && npm install && npm run dev
