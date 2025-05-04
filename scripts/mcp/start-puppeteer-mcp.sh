#!/bin/bash

# Start script for Puppeteer MCP Server

echo "Starting Puppeteer MCP Server..."

# Check if Chrome is running with debugging enabled
if ! nc -z localhost 9222; then
  echo "Chrome is not running with remote debugging enabled. Starting Chrome..."
  open -a "Google Chrome" --args --remote-debugging-port=9222 --no-first-run --no-default-browser-check
  echo "Waiting for Chrome to initialize..."
  sleep 3
fi

# Get the WebSocket endpoint dynamically
WS_ENDPOINT=$(curl -s http://localhost:9222/json/version | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

if [ -z "$WS_ENDPOINT" ]; then
  echo "Failed to get WebSocket endpoint from Chrome. Using default connection..."
else
  echo "Using WebSocket endpoint: $WS_ENDPOINT"
  export BROWSER_WS_ENDPOINT="$WS_ENDPOINT"
fi

# Start the MCP server
npx puppeteer-mcp-server
