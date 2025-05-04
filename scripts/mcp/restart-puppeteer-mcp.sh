#!/bin/bash

# Restart script for Puppeteer MCP Server and Chrome with debugging

echo "Restarting Puppeteer MCP environment..."

# Kill existing processes
echo "Killing existing Chrome and Puppeteer MCP processes..."
pkill -f "Google Chrome" || true
pkill -f puppeteer-mcp || true
sleep 2

# Launch Chrome with remote debugging
echo "Starting Chrome with remote debugging enabled..."
open -a "Google Chrome" --args --remote-debugging-port=9222 --no-first-run --no-default-browser-check

# Wait for Chrome to start
echo "Waiting for Chrome to initialize..."
sleep 3

# Verify Chrome is running with debugging
if ! nc -z localhost 9222; then
  echo "Error: Chrome debug port 9222 is not accessible!"
  exit 1
fi

# Get the WebSocket endpoint
echo "Getting Chrome WebSocket endpoint..."
WS_ENDPOINT=$(curl -s http://localhost:9222/json/version | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$WS_ENDPOINT" ]; then
  echo "Warning: Failed to get WebSocket endpoint from Chrome. Will try default connection..."
else
  echo "Using WebSocket endpoint: $WS_ENDPOINT"
  export BROWSER_WS_ENDPOINT="$WS_ENDPOINT"
fi

# Start the MCP server
echo "Starting Puppeteer MCP server..."
npx puppeteer-mcp-server > /dev/null 2>&1 &

# Check if server started successfully
sleep 2
if pgrep -f puppeteer-mcp > /dev/null; then
  echo "✅ Puppeteer MCP Server started successfully!"
  echo "✅ Chrome started with debugging on port 9222"
  echo "✅ Environment ready for web automation"
else
  echo "❌ Failed to start Puppeteer MCP Server"
  echo "See logs at: /Users/benjamin.pommeraud/mywine-1/logs/mcp-puppeteer-*.log"
fi

echo ""
echo "To test if connection is working, run:"
echo "node scripts/mcp/test-puppeteer.js"