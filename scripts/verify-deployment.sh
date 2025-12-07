#!/bin/bash
# Verify deployment is working correctly

echo "🔍 Verifying Deployment..."
echo "================================"

BACKEND_URL="${1:-http://localhost:3001}"
FRONTEND_URL="${2:-http://localhost:5173}"

echo ""
echo "Backend URL: $BACKEND_URL"
echo "Frontend URL: $FRONTEND_URL"
echo ""

# Test backend health
echo "1. Testing Backend Health..."
HEALTH_RESPONSE=$(curl -s "$BACKEND_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "   ✅ Backend is healthy"
else
    echo "   ❌ Backend health check failed"
    echo "   Response: $HEALTH_RESPONSE"
fi

# Test frontend
echo ""
echo "2. Testing Frontend..."
FRONTEND_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL")
if [ "$FRONTEND_RESPONSE" = "200" ]; then
    echo "   ✅ Frontend is accessible"
else
    echo "   ❌ Frontend returned status: $FRONTEND_RESPONSE"
fi

# Test API endpoint
echo ""
echo "3. Testing API Endpoint..."
API_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" "$BACKEND_URL/api/auth/session")
if [ "$API_RESPONSE" = "200" ] || [ "$API_RESPONSE" = "401" ]; then
    echo "   ✅ API endpoint is accessible"
else
    echo "   ❌ API endpoint returned status: $API_RESPONSE"
fi

echo ""
echo "================================"
echo "✅ Verification complete!"
echo ""
echo "Next steps:"
echo "1. Test login/signup flow"
echo "2. Test payment flow"
echo "3. Test all features"
echo ""

