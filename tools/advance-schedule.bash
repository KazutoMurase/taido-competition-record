#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPOSITORY_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

usage() {
    echo "Usage:"
    echo "  tools/advance-schedule.bash A [B ...]"
    echo "  tools/advance-schedule.bash --file PATH"
}

append_step() {
    local court=$1
    local expected_schedule_id=${2:-}

    if [[ ! "${court}" =~ ^[A-Za-z]$ ]]; then
        echo "Invalid court: ${court}" >&2
        exit 1
    fi
    if [[ -n "${expected_schedule_id}" && ! "${expected_schedule_id}" =~ ^[1-9][0-9]*$ ]]; then
        echo "Invalid schedule ID for court ${court}: ${expected_schedule_id}" >&2
        exit 1
    fi

    COURTS+=("${court^^}")
    EXPECTED_SCHEDULE_IDS+=("${expected_schedule_id}")
}

if [[ $# -eq 0 ]]; then
    usage
    exit 1
fi

declare -a COURTS=()
declare -a EXPECTED_SCHEDULE_IDS=()

if [[ $1 == "--file" ]]; then
    if [[ $# -ne 2 ]]; then
        usage
        exit 1
    fi

    PLAN_FILE=$2
    if [[ ! -f "${PLAN_FILE}" ]]; then
        echo "Plan file not found: ${PLAN_FILE}" >&2
        exit 1
    fi

    LINE_NUMBER=0
    while IFS= read -r line || [[ -n "${line}" ]]; do
        LINE_NUMBER=$((LINE_NUMBER + 1))
        line=${line%%#*}
        read -r court expected_schedule_id extra <<< "${line}"
        if [[ -z "${court:-}" ]]; then
            continue
        fi
        if [[ -n "${extra:-}" ]]; then
            echo "Too many fields at ${PLAN_FILE}:${LINE_NUMBER}" >&2
            exit 1
        fi
        append_step "${court}" "${expected_schedule_id:-}"
    done < "${PLAN_FILE}"
else
    for court in "$@"; do
        append_step "${court}"
    done
fi

if [[ ${#COURTS[@]} -eq 0 ]]; then
    echo "No steps were found." >&2
    exit 1
fi

cd "${REPOSITORY_ROOT}"

if [[ -z "$(docker compose -f docker-compose.yaml ps --status running -q app)" ]]; then
    echo "The app service is not running. Start it first with: docker compose up" >&2
    exit 1
fi

COMPOSE=(
    docker compose
    -f docker-compose.yaml
    -f docker-compose.playwright.yaml
)

PLAYWRIGHT_UID="$(id -u)" \
PLAYWRIGHT_GID="$(id -g)" \
"${COMPOSE[@]}" build playwright

TOTAL_STEPS=${#COURTS[@]}

for ((index = 0; index < TOTAL_STEPS; index += 1)); do
    COURT=${COURTS[index]}
    EXPECTED_SCHEDULE_ID=${EXPECTED_SCHEDULE_IDS[index]}
    STEP_NUMBER=$((index + 1))
    if [[ -n "${EXPECTED_SCHEDULE_ID}" ]]; then
        echo "[advance-plan] [${STEP_NUMBER}/${TOTAL_STEPS}] court=${COURT} expected_schedule=${EXPECTED_SCHEDULE_ID}"
    else
        echo "[advance-plan] [${STEP_NUMBER}/${TOTAL_STEPS}] court=${COURT}"
    fi

    COURT="${COURT}" \
    CONFIRM_ADVANCE="${COURT}" \
    EXPECTED_SCHEDULE_ID="${EXPECTED_SCHEDULE_ID}" \
    PLAYWRIGHT_UID="$(id -u)" \
    PLAYWRIGHT_GID="$(id -g)" \
    "${COMPOSE[@]}" run \
        --rm \
        --no-deps \
        playwright
done

echo "[advance-plan] completed ${TOTAL_STEPS} step(s)"
