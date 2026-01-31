#!/bin/bash

# QA Test Runner Script
# Runs Playwright tests and generates reports

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Default values
WORKERS=""
HEADED=""
GREP=""
RETRIES=""
OUTPUT_DIR="test-results"

# Parse arguments
while [[ $# -gt 0 ]]; do
  case $1 in
    --workers)
      WORKERS="--workers=$2"
      shift 2
      ;;
    --headed)
      HEADED="--headed"
      shift
      ;;
    --grep)
      GREP="-g \"$2\""
      shift 2
      ;;
    --retries)
      RETRIES="--retries=$2"
      shift 2
      ;;
    --output)
      OUTPUT_DIR="$2"
      shift 2
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

echo -e "${YELLOW}🧪 Running QA Tests${NC}"
echo "================================"

# Create output directory
mkdir -p "$OUTPUT_DIR/screenshots"

# Check if Playwright is installed
if ! npx playwright --version > /dev/null 2>&1; then
  echo -e "${RED}Error: Playwright not installed${NC}"
  echo "Run: npm install --save-dev @playwright/test"
  exit 1
fi

# Check if browsers are installed
if ! npx playwright install --check chromium > /dev/null 2>&1; then
  echo -e "${YELLOW}Installing Chromium browser...${NC}"
  npx playwright install chromium
fi

# Build command
CMD="npx playwright test"
[ -n "$WORKERS" ] && CMD="$CMD $WORKERS"
[ -n "$HEADED" ] && CMD="$CMD $HEADED"
[ -n "$GREP" ] && CMD="$CMD $GREP"
[ -n "$RETRIES" ] && CMD="$CMD $RETRIES"
CMD="$CMD --reporter=list,json,html"

echo -e "${YELLOW}Command: $CMD${NC}"
echo ""

# Run tests
START_TIME=$(date +%s)

if eval $CMD; then
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  echo ""
  echo -e "${GREEN}✅ All tests passed!${NC}"
  echo -e "Duration: ${DURATION}s"
else
  END_TIME=$(date +%s)
  DURATION=$((END_TIME - START_TIME))
  echo ""
  echo -e "${RED}❌ Some tests failed${NC}"
  echo -e "Duration: ${DURATION}s"
  echo ""
  echo -e "View report: ${YELLOW}npm run test:report${NC}"
  exit 1
fi

# Parse results if JSON exists
if [ -f "$OUTPUT_DIR/results.json" ]; then
  echo ""
  echo "================================"
  echo -e "${YELLOW}📊 Test Summary${NC}"

  # Extract stats using Python (more reliable than jq)
  python3 << 'EOF'
import json
import sys

try:
    with open('test-results/results.json', 'r') as f:
        data = json.load(f)

    stats = data.get('stats', {})
    expected = stats.get('expected', 0)
    unexpected = stats.get('unexpected', 0)
    skipped = stats.get('skipped', 0)
    duration = stats.get('duration', 0) / 1000

    print(f"Total:   {expected + unexpected + skipped}")
    print(f"Passed:  {expected}")
    print(f"Failed:  {unexpected}")
    print(f"Skipped: {skipped}")
    print(f"Time:    {duration:.1f}s")

    if unexpected > 0:
        sys.exit(1)
except Exception as e:
    print(f"Could not parse results: {e}")
EOF
fi

echo ""
echo -e "View full report: ${GREEN}npm run test:report${NC}"
