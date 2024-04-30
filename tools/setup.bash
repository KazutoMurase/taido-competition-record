#!/bin/bash
systemctl start redis-server.service

/etc/init.d/postgresql start
if sudo -u test_user psql -lqt | cut -d \| -f 1 | grep -qw taido_record; then
    echo "database already exists."
else
    sudo -u test_user createdb taido_record
    cd /ws/data/2023 && sudo -u test_user psql -d taido_record < generate_tables.sql
fi
cd /ws && npm install && npm run dev
