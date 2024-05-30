#!/bin/bash
DOCKER_IMAGE=taido-competition-record-app-1

CMD="cd /ws/data/2023 && sudo -u postgres psql -d taido_record < reset_database.sql;"
CMD+="curl http://localhost:3000/api/reset_cache;"

docker exec -it ${DOCKER_IMAGE} /bin/bash -c "${CMD}"
