#!/bin/bash
# 🛡️ Setup Token Protection Script
# Automatically protects your token from MEV bots

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}🛡️ MEV Protection Setup for Token${NC}"
echo "=================================="
echo ""

# Get token address
read -p "Enter your token address: " TOKEN_ADDRESS
if [ -z "$TOKEN_ADDRESS" ]; then
    echo -e "${RED}❌ Token address is required${NC}"
    exit 1
fi

# Get network
echo ""
echo "Select network:"
echo "1) Ethereum"
echo "2) Polygon"
echo "3) BSC"
echo "4) Arbitrum"
read -p "Enter choice (1-4): " NETWORK_CHOICE

case $NETWORK_CHOICE in
    1) NETWORK="ethereum" ;;
    2) NETWORK="polygon" ;;
    3) NETWORK="bsc" ;;
    4) NETWORK="arbitrum" ;;
    *)
        echo -e "${RED}❌ Invalid network choice${NC}"
        exit 1
        ;;
esac

# Get API key
read -p "Enter API key: " API_KEY
if [ -z "$API_KEY" ]; then
    echo -e "${YELLOW}⚠️  Using default API key (demo-api-key)${NC}"
    API_KEY="demo-api-key"
fi

# Get protection level
echo ""
echo "Select protection level:"
echo "1) Basic"
echo "2) Standard"
echo "3) High (Recommended)"
echo "4) Maximum"
echo "5) Enterprise"
read -p "Enter choice (1-5) [Default: 3]: " PROTECTION_CHOICE

case $PROTECTION_CHOICE in
    1) PROTECTION_LEVEL="basic" ;;
    2) PROTECTION_LEVEL="standard" ;;
    3|"") PROTECTION_LEVEL="high" ;;
    4) PROTECTION_LEVEL="maximum" ;;
    5) PROTECTION_LEVEL="enterprise" ;;
    *)
        PROTECTION_LEVEL="high"
        ;;
esac

# API endpoint
API_URL="${API_URL:-http://localhost:8000}"

echo ""
echo -e "${YELLOW}📋 Configuration:${NC}"
echo "  Token Address: $TOKEN_ADDRESS"
echo "  Network: $NETWORK"
echo "  Protection Level: $PROTECTION_LEVEL"
echo "  API URL: $API_URL"
echo ""

read -p "Continue? (y/n): " CONFIRM
if [ "$CONFIRM" != "y" ]; then
    echo -e "${YELLOW}Cancelled${NC}"
    exit 0
fi

echo ""
echo -e "${GREEN}🚀 Adding token protection...${NC}"

# Add protected address
RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$API_URL/api/v1/protected-addresses" \
  -H "Authorization: Bearer $API_KEY" \
  -H "Content-Type: application/json" \
  -d "{
    \"address\": \"$TOKEN_ADDRESS\",
    \"address_type\": \"token\",
    \"network\": \"$NETWORK\",
    \"protection_level\": \"$PROTECTION_LEVEL\",
    \"auto_protect\": true,
    \"notify_on_threat\": true
  }")

HTTP_CODE=$(echo "$RESPONSE" | tail -n1)
BODY=$(echo "$RESPONSE" | sed '$d')

if [ "$HTTP_CODE" -eq 200 ] || [ "$HTTP_CODE" -eq 201 ]; then
    echo -e "${GREEN}✅ Token protection added successfully!${NC}"
    echo ""
    echo "$BODY" | python3 -m json.tool 2>/dev/null || echo "$BODY"
    echo ""
    echo -e "${GREEN}🛡️ Your token is now protected from MEV bots!${NC}"
    echo ""
    echo "Monitor protection:"
    echo "  curl $API_URL/api/v1/protected-addresses -H \"Authorization: Bearer $API_KEY\""
    echo ""
    echo "View statistics:"
    echo "  curl $API_URL/api/v1/protected-addresses/stats -H \"Authorization: Bearer $API_KEY\""
else
    echo -e "${RED}❌ Failed to add protection${NC}"
    echo "HTTP Code: $HTTP_CODE"
    echo "Response: $BODY"
    exit 1
fi


