#!/usr/bin/env bash

set -euo pipefail

usage() {
  printf 'Usage: %s <url>\n' "$(basename "$0")" >&2
}

if [[ "$#" -ne 1 ]]; then
  usage
  exit 64
fi

http_status=""
if ! http_status="$(curl \
  --silent \
  --show-error \
  --location \
  --output /dev/null \
  --write-out '%{http_code}' \
  --connect-timeout "${CONNECT_TIMEOUT_SECONDS:-5}" \
  --max-time "${MAX_TIME_SECONDS:-10}" \
  "$1")"; then
  printf 'DOWN (request failed)\n' >&2
  exit 1
fi

if [[ "$http_status" =~ ^[23][0-9]{2}$ ]]; then
  printf 'UP (HTTP %s)\n' "$http_status"
  exit 0
fi

printf 'DOWN (HTTP %s)\n' "$http_status" >&2
exit 1
