#!/bin/bash
# Railway startup wrapper
# This ensures Railway properly starts our application

echo "🚢 Railway Deployment Starting..."
echo "🔍 Current directory: $(pwd)"
echo "📁 Contents:"
ls -la

# Check if we have the expected files
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found! Current directory may be wrong."
    echo "📂 Full directory listing:"
    find . -name "package.json" -o -name "Dockerfile" -o -name "start.sh" 2>/dev/null
    exit 1
fi

if [ -f "start.sh" ]; then
    echo "✅ Found start.sh, making it executable..."
    chmod +x start.sh
    exec ./start.sh
elif [ -f "scripts/startup.sh" ]; then
    echo "✅ Found scripts/startup.sh, making it executable..."
    chmod +x scripts/startup.sh
    exec ./scripts/startup.sh
else
    echo "📝 Using npm start directly..."
    exec npm start
fi