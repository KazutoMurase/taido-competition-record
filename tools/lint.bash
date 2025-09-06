#!/bin/bash
DOCKER_IMAGE=ghcr.io/kazutomurase/taido-competition-record:latest
CMD="cd /ws/ && npm run lint && npm run ts"

docker run --rm --volume "./:/ws" \
       --env PATH=/root/.nvm/versions/node/v20.13.1/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin \
       -it ${DOCKER_IMAGE} \
       /bin/bash -c "${CMD}"
