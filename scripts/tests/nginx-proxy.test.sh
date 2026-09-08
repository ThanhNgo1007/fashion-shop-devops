#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
COMPOSE_FILE="$ROOT_DIR/infra/nginx/docker-compose.lab.yml"
PROJECT_NAME="deployhub-nginx-test"

docker_compose() {
  docker compose \
    --project-name "$PROJECT_NAME" \
    --file "$COMPOSE_FILE" \
    "$@"
}

cleanup() {
  docker_compose down --volumes --remove-orphans >/dev/null 2>&1 || true
}

trap cleanup EXIT

assert_equals() {
  local expected="$1"
  local actual="$2"
  local label="$3"

  if [[ "$actual" != "$expected" ]]; then
    printf 'FAIL: %s expected "%s", got "%s"\n' "$label" "$expected" "$actual" >&2
    exit 1
  fi
}

assert_contains() {
  local expected="$1"
  local actual="$2"
  local label="$3"

  if [[ "$actual" != *"$expected"* ]]; then
    printf 'FAIL: %s expected output containing "%s"\n' "$label" "$expected" >&2
    printf 'Actual output:\n%s\n' "$actual" >&2
    exit 1
  fi
}

proxy_get() {
  local path="$1"

  docker_compose exec --no-TTY proxy wget -qO- "http://127.0.0.1${path}"
}

proxy_http_status() {
  local path="$1"

  docker_compose exec --no-TTY proxy sh -c \
    "wget --server-response --output-document=/dev/null 'http://127.0.0.1${path}' 2>&1 | awk '/HTTP\\// { status = \$2 } END { print status }'"
}

wait_for_status() {
  local expected_status="$1"
  local path="$2"
  local label="$3"
  local actual_status=""

  for attempt in 1 2 3 4 5 6 7 8 9 10; do
    actual_status="$(proxy_http_status "$path" || true)"
    if [[ "$actual_status" == "$expected_status" ]]; then
      return 0
    fi
    sleep 1
  done

  printf 'FAIL: %s expected HTTP %s, got %s\n' "$label" "$expected_status" "$actual_status" >&2
  exit 1
}

docker_compose up --detach
wait_for_status 200 "/" "proxy homepage"
docker_compose exec --no-TTY proxy nginx -t >/dev/null

homepage="$(proxy_get "/")"
assert_equals "frontend-ok" "$homepage" "frontend proxy"

api_response="$(proxy_get "/api/health")"
assert_equals "api-ok" "$api_response" "API proxy"

socket_headers="$(docker_compose exec --no-TTY proxy wget --server-response --output-document=/dev/null \
  --header 'Connection: Upgrade' \
  --header 'Upgrade: websocket' \
  'http://127.0.0.1/socket.io/' 2>&1)"
assert_contains "X-Mock-Upgrade: websocket" "$socket_headers" "WebSocket upgrade forwarding"

docker_compose stop api >/dev/null
wait_for_status 502 "/api/health" "missing API upstream"

printf 'PASS: Nginx proxy, WebSocket forwarding, and 502 behavior verified\n'
