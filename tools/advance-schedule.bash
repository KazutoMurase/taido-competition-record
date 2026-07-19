#!/usr/bin/env bash

set -euo pipefail

SCRIPT_DIR=$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)
REPOSITORY_ROOT=$(cd "${SCRIPT_DIR}/.." && pwd)

usage() {
    echo "Usage:"
    echo "  tools/advance-schedule.bash [--parallel] A [B ...]"
    echo "  tools/advance-schedule.bash [--parallel] --file PATH"
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

declare -a COURTS=()
declare -a EXPECTED_SCHEDULE_IDS=()
declare -a COURT_ARGUMENTS=()
PARALLEL=false
PLAN_FILE=""

while [[ $# -gt 0 ]]; do
    case $1 in
        --parallel)
            if [[ "${PARALLEL}" == true ]]; then
                echo "--parallel may only be specified once." >&2
                exit 1
            fi
            PARALLEL=true
            shift
            ;;
        --file)
            if [[ -n "${PLAN_FILE}" ]]; then
                echo "--file may only be specified once." >&2
                exit 1
            fi
            if [[ $# -lt 2 ]]; then
                usage
                exit 1
            fi
            PLAN_FILE=$2
            shift 2
            ;;
        --*)
            echo "Unknown option: $1" >&2
            usage
            exit 1
            ;;
        *)
            COURT_ARGUMENTS+=("$1")
            shift
            ;;
    esac
done

if [[ -n "${PLAN_FILE}" ]]; then
    if [[ ${#COURT_ARGUMENTS[@]} -gt 0 ]]; then
        echo "Court arguments cannot be combined with --file." >&2
        exit 1
    fi
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
    for court in "${COURT_ARGUMENTS[@]}"; do
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

run_step() {
    local index=$1
    local court=${COURTS[index]}
    local expected_schedule_id=${EXPECTED_SCHEDULE_IDS[index]}
    local step_number=$((index + 1))

    if [[ -n "${expected_schedule_id}" ]]; then
        echo "[advance-plan] [${step_number}/${TOTAL_STEPS}] court=${court} expected_schedule=${expected_schedule_id}"
    else
        echo "[advance-plan] [${step_number}/${TOTAL_STEPS}] court=${court}"
    fi

    if [[ "${PARALLEL}" == true ]]; then
        COURT="${court}" \
        CONFIRM_ADVANCE="${court}" \
        EXPECTED_SCHEDULE_ID="${expected_schedule_id}" \
        PLAYWRIGHT_UID="$(id -u)" \
        PLAYWRIGHT_GID="$(id -g)" \
        "${COMPOSE[@]}" run \
            --rm \
            --no-deps \
            -T \
            playwright 2>&1 | sed -u "s/^/[court ${court}] /"
    else
        COURT="${court}" \
        CONFIRM_ADVANCE="${court}" \
        EXPECTED_SCHEDULE_ID="${expected_schedule_id}" \
        PLAYWRIGHT_UID="$(id -u)" \
        PLAYWRIGHT_GID="$(id -g)" \
        "${COMPOSE[@]}" run \
            --rm \
            --no-deps \
            -T \
            playwright
    fi
}

run_court_steps() {
    local court=$1
    local index
    for index in ${COURT_STEP_INDICES[${court}]}; do
        run_step "${index}"
    done
}

if [[ "${PARALLEL}" == true ]]; then
    declare -A COURT_STEP_INDICES=()
    declare -a UNIQUE_COURTS=()
    declare -a WORKER_PIDS=()
    declare -a WORKER_COURTS=()

    for ((index = 0; index < TOTAL_STEPS; index += 1)); do
        court=${COURTS[index]}
        if [[ -z "${COURT_STEP_INDICES[${court}]+set}" ]]; then
            UNIQUE_COURTS+=("${court}")
            COURT_STEP_INDICES[${court}]=""
        fi
        COURT_STEP_INDICES[${court}]+=" ${index}"
    done

    echo "[advance-plan] parallel courts: ${UNIQUE_COURTS[*]}"
    for court in "${UNIQUE_COURTS[@]}"; do
        run_court_steps "${court}" &
        WORKER_PIDS+=("$!")
        WORKER_COURTS+=("${court}")
    done

    FAILED=0
    for ((index = 0; index < ${#WORKER_PIDS[@]}; index += 1)); do
        if ! wait "${WORKER_PIDS[index]}"; then
            echo "[advance-plan] court=${WORKER_COURTS[index]} failed" >&2
            FAILED=1
        fi
    done
    if [[ ${FAILED} -ne 0 ]]; then
        exit 1
    fi
else
    for ((index = 0; index < TOTAL_STEPS; index += 1)); do
        run_step "${index}"
    done
fi

echo "[advance-plan] completed ${TOTAL_STEPS} step(s)"
