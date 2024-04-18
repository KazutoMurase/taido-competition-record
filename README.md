# Prerequisites

Install Docker

Build docker image
```bash
docker build -t taido-competition-record .
```

Run docker container and setup servers
```bash
docker run --net host --volume `pwd`:/ws -it taido-competition-record:latest bash

# inside container

useradd test_user
echo 'test_user:test_pass' | chpasswd
/etc/init.d/postgresql start
sudo -u postgres psql -t -c "create user test_user with password 'test_pass' login superuser createdb"
sudo -u test_user createdb taido_record
cd /ws/data/2023 && sudo -u test_user psql -d taido_record < generate_tables.sql

systemctl start redis-server.service

cd /ws/ && npm run dev
```

# Generate initial database

```bash
cd data/2023 && psql "postgres://(****)" < generate_tables.sql
```

# Reset database and cache

```bash
cd data/2023 && psql "postgres://(****)" < reset_database.sql
curl http://(SERVER_NAME)/api/reset_cache
```

# Get final player ids

```bash
curl http://(SERVER_NAME)/api/get_winners?event_name=hokei_man | jq
curl http://(SERVER_NAME)/api/get_winners?event_name=hokei_woman | jq
curl http://(SERVER_NAME)/api/get_winners?event_name=zissen_man | jq
curl http://(SERVER_NAME)/api/get_winners?event_name=zissen_woman | jq
curl https://(SERVER_NAME)/api/get_winners?event_name=hokei_sonen | jq
```
