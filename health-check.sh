#!/bin/bash

# DevPulse Health Check Script
# Usage: ./health-check.sh [url]
# Example: ./health-check.sh https://your-app.com

APP_URL=${1:-http://localhost}
API_URL=${APP_URL//http:\/\//http://api.}
API_URL=${API_URL//https:\/\//https://api.}

echo "🔍 Checking DevPulse health at $APP_URL"

# Check frontend
echo "Checking frontend..."
if curl -s -f "$APP_URL" > /dev/null; then
    echo "✅ Frontend is healthy"
else
    echo "❌ Frontend is not responding"
fi

# Check backend API
echo "Checking backend API..."
if curl -s -f "$API_URL/api/status" > /dev/null; then
    echo "✅ Backend API is healthy"

    # Check metrics endpoint
    if curl -s -f "$API_URL/api/metrics/current" > /dev/null; then
        echo "✅ Metrics API is working"
    else
        echo "⚠️  Metrics API is not responding"
    fi
else
    echo "❌ Backend API is not responding"
fi

# Check WebSocket (basic connectivity test)
echo "Checking WebSocket connectivity..."
if command -v node &> /dev/null; then
    node -e "
    const io = require('socket.io-client');
    const socket = io('$API_URL', { transports: ['websocket'] });

    socket.on('connect', () => {
        console.log('✅ WebSocket connected');
        socket.disconnect();
        process.exit(0);
    });

    socket.on('connect_error', () => {
        console.log('❌ WebSocket connection failed');
        process.exit(1);
    });

    setTimeout(() => {
        console.log('❌ WebSocket connection timeout');
        process.exit(1);
    }, 5000);
    "
else
    echo "⚠️  Node.js not found - skipping WebSocket check"
fi

echo "🏁 Health check complete"