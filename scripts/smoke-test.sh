#!/usr/bin/env bash
# smoke-test.sh
# Run smoke tests after deployment

set -uo pipefail

BASE_URL=${1:-}
TIMEOUT=${SMOKE_TIMEOUT:-10}
RETRIES=${SMOKE_RETRIES:-3}

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

if [[ -z "$BASE_URL" ]]; then
    echo "Usage: $0 <base_url>"
    exit 1
fi

check_endpoint() {
    local url=$1
    local expect_status=$2
    local expect_body=$3
    local name=$4

    echo -n "Checking $name ($url)... "
    
    local success=false
    for ((i=1; i<=RETRIES; i++)); do
        local response
        local http_code
        local res_body
        
        # We need both http code and body
        response=$(curl -s -m "$TIMEOUT" -w "\n%{http_code}" "$url" || echo "curl_failed")
        
        if [[ "$response" != "curl_failed" ]]; then
            http_code=$(echo "$response" | tail -n1)
            res_body=$(echo "$response" | sed '$d')
            
            if [[ "$http_code" == "$expect_status" ]]; then
                if [[ -z "$expect_body" ]] || echo "$res_body" | grep -iq "$expect_body"; then
                    success=true
                    break
                fi
            fi
        fi
        
        sleep 2
    done

    if $success; then
        echo -e "${GREEN}PASS${NC}"
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        return 1
    fi
}

FAILED=0

# Check health endpoint: GET /health (expect 200 + status:ok)
check_endpoint "$BASE_URL/health" "200" "ok" "Health Endpoint" || FAILED=1

# Check frontend: GET / (expect 200)
check_endpoint "$BASE_URL/" "200" "" "Frontend Root" || FAILED=1

# Check API: GET /api/product/get-all?limit=1 (expect 200 + status:OK)
check_endpoint "$BASE_URL/api/product/get-all?limit=1" "200" "ok" "Product API" || FAILED=1

if [[ $FAILED -ne 0 ]]; then
    echo -e "${RED}Smoke tests failed!${NC}"
    exit 1
else
    echo -e "${GREEN}All smoke tests passed!${NC}"
    exit 0
fi
