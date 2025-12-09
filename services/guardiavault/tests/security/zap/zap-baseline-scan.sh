#!/bin/bash

# OWASP ZAP Baseline Security Scan
# This script runs a baseline security scan against GuardiaVault

# Configuration
TARGET_URL="${TARGET_URL:-http://localhost:5000}"
REPORT_DIR="tests/security/zap/reports"
REPORT_FILE="$REPORT_DIR/zap-report-$(date +%Y%m%d-%H%M%S).html"

# Create report directory if it doesn't exist
mkdir -p "$REPORT_DIR"

echo "🔐 Starting OWASP ZAP Baseline Scan"
echo "Target: $TARGET_URL"
echo "Report will be saved to: $REPORT_FILE"
echo ""

# Check if ZAP is installed via Docker
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker to run ZAP."
    exit 1
fi

# Run ZAP baseline scan
docker run --rm \
    -v "$(pwd)/$REPORT_DIR:/zap/wrk/:rw" \
    -t softwaresecurityproject/zap-stable zap-baseline.py \
    -t "$TARGET_URL" \
    -r "zap-report.html" \
    -J "zap-report.json" \
    -w "zap-report.md" \
    -d \
    -I

# Check exit code
EXIT_CODE=$?

echo ""
echo "📊 ZAP Scan Complete!"
echo "Report available at: $REPORT_FILE"

if [ $EXIT_CODE -eq 0 ]; then
    echo "✅ No security issues found!"
elif [ $EXIT_CODE -eq 1 ]; then
    echo "⚠️  Low priority issues found. Review the report."
elif [ $EXIT_CODE -eq 2 ]; then
    echo "⚠️  Medium priority issues found. Review the report."
else
    echo "❌ High priority issues found! Review the report immediately."
fi

exit $EXIT_CODE
