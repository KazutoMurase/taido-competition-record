#!/bin/bash
competition_name=$1

systemctl start redis-server.service

cd /ws && npm install && npm run dev
