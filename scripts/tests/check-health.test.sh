#!/usr/bin/env bash

set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
SCRIPT_PATH="$ROOT_DIR/scripts/check-health.sh"
TEMP_DIR="$(mktemp -d)"
FAKE_BIN="$TEMP_DIR/bin"

cleanup() {
  rm -rf "$TEMP_DIR"
}

trap cleanup EXIT
mkdir -p "$FAKE_BIN"

cat > "$FAKE_BIN/curl" <<'EOF'
#!/usr/bin/env bash

if [[ "${FAKE_CURL_EXIT:-0}" -ne 0 ]]; then
  printf 'simulated curl failure\n' >&2
  exit "$FAKE_CURL_EXIT"
fi

printf '%s' "${FAKE_HTTP_CODE:-200}"
EOF

chmod +x "$FAKE_BIN/curl"

assert_status() {
  local expected="$1"
  local actual="$2"
  local label="$3"

  if [[ "$actual" -ne "$expected" ]]; then
    printf 'FAIL: %s expected exit %s, got %s\n' "$label" "$expected" "$actual" >&2
    exit 1
  fi
}

assert_contains() {
  local expected="$1"
  local actual="$2"
  local label="$3"

  if [[ "$actual" != *"$expected"* ]]; then
    printf 'FAIL: %s expected output containing "%s", got "%s"\n' "$label" "$expected" "$actual" >&2
    exit 1
  fi
}

run_check() {
  local output_file="$TEMP_DIR/output"

  set +e
  PATH="$FAKE_BIN:$PATH" "$SCRIPT_PATH" "$@" > "$output_file" 2>&1
  RUN_STATUS=$?
  set -e
  RUN_OUTPUT="$(<"$output_file")"
}

FAKE_HTTP_CODE=200 FAKE_CURL_EXIT=0 run_check "https://example.test/health"
assert_status 0 "$RUN_STATUS" "successful response"
assert_contains "UP (HTTP 200)" "$RUN_OUTPUT" "successful response"

FAKE_HTTP_CODE=503 FAKE_CURL_EXIT=0 run_check "https://example.test/health"
assert_status 1 "$RUN_STATUS" "unhealthy response"
assert_contains "DOWN (HTTP 503)" "$RUN_OUTPUT" "unhealthy response"

FAKE_CURL_EXIT=7 run_check "https://example.test/health"
assert_status 1 "$RUN_STATUS" "connection failure"
assert_contains "DOWN (request failed)" "$RUN_OUTPUT" "connection failure"

run_check
assert_status 64 "$RUN_STATUS" "missing URL"
assert_contains "Usage:" "$RUN_OUTPUT" "missing URL"

printf 'PASS: check-health.sh behavior verified\n'
