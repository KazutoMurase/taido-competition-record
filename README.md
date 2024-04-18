
[ドキュメント](https://kazutomurase.github.io/)

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
