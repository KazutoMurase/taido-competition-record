#!/bin/bash
systemctl start redis-server.service

/etc/init.d/postgresql start
sudo -u test_user createdb taido_record
cd /ws/data/2023 && sudo -u test_user psql -d taido_record < generate_tables.sql

cd /ws && npm install && npm run dev
