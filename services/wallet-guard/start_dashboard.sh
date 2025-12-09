#!/bin/bash
# Wallet Guard Dashboard - Startup Script

set -e

echo "🎨 Wallet Guard Dashboard - Starting..."
echo ""

# Check Node.js version
echo "📋 Checking prerequisites..."
if command -v node &> /dev/null; then
    node_version=$(node --version)
    echo "   ✅ Node.js version: $node_version"
else
    echo "   ❌ Node.js not found. Please install Node.js 18+"
    echo "   Download from: https://nodejs.org/"
    exit 1
fi

# Check if API is running
echo ""
echo "🔍 Checking API connection..."
if curl -s http://localhost:8003/health > /dev/null 2>&1; then
    echo "   ✅ API is running on port 8003"
else
    echo "   ⚠️  API is not running on port 8003"
    echo "   Please start the API service first:"
    echo "   python api.py"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
fi

# Check if node_modules exists
echo ""
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "   ⚠️  Dependencies not installed. Installing..."
    npm install
    if [ $? -ne 0 ]; then
        echo "   ❌ Failed to install dependencies"
        exit 1
    fi
    echo "   ✅ Dependencies installed"
else
    echo "   ✅ Dependencies installed"
fi

# Start the dashboard
echo ""
echo "🚀 Starting dashboard..."
echo "   Dashboard: http://localhost:3003"
echo "   API: http://localhost:8003"
echo ""
echo "   Press Ctrl+C to stop the dashboard"
echo ""

# Start Next.js development server
npm run dev

