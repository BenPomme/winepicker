# Puppeteer MCP Troubleshooting Guide

This document contains steps to diagnose and resolve issues with the Puppeteer MCP server integration.

## Diagnosing the "Connection Failed" Error

The Puppeteer MCP server status shows as "failed" despite the server running. This typically indicates that the server process is running, but it cannot properly connect to the Chrome/Chromium browser with remote debugging enabled.

## Quick Fix Steps

1. **Start Chrome with Remote Debugging Enabled**:
   ```bash
   open -a "Google Chrome" --args --remote-debugging-port=9222 --no-first-run --no-default-browser-check
   ```

2. **Verify Chrome Debugging Port is Listening**:
   ```bash
   nc -z localhost 9222 && echo "Port 9222 is open" || echo "Port 9222 is closed"
   ```

3. **Get the WebSocket Debugger URL**:
   ```bash
   curl -s http://localhost:9222/json/version | grep webSocketDebuggerUrl
   ```

4. **Restart the Puppeteer MCP Server**:
   ```bash
   # Kill any existing processes
   pkill -f puppeteer-mcp
   
   # Start a new server with the WebSocket endpoint
   export BROWSER_WS_ENDPOINT="ws://localhost:9222/devtools/browser/[YOUR_BROWSER_ID]"
   npx puppeteer-mcp-server
   ```

## Direct Testing Script

Use the `test-puppeteer.js` script in `scripts/mcp/` to verify direct Puppeteer connection to Chrome:

```bash
node scripts/mcp/test-puppeteer.js
```

If this script works but the MCP server still fails, the issue is likely with the MCP server configuration.

## Editing the Start Script

Update the `scripts/mcp/start-puppeteer-mcp.sh` script to include the correct WebSocket endpoint:

```bash
#!/bin/bash

# Start script for Puppeteer MCP Server
echo "Starting Puppeteer MCP Server..."

# Get the current WebSocket endpoint from Chrome
WS_ENDPOINT=$(curl -s http://localhost:9222/json/version | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

# Export the endpoint for the MCP server to use
export BROWSER_WS_ENDPOINT="$WS_ENDPOINT"

# Start the server
npx puppeteer-mcp-server
```

## Permission Issues

If you encounter "EACCES" errors, ensure all scripts have execute permissions:

```bash
chmod +x scripts/mcp/*.js
chmod +x scripts/mcp/*.sh
```

## MCP Configuration Files

The MCP server uses configuration files in:
```
/Users/benjamin.pommeraud/Library/Caches/claude-cli-nodejs/-Users-benjamin-pommeraud-mywine-1/mcp-logs-puppeteer/
```

Review these files for specific error messages if issues persist.

## Starting Chrome and the MCP Server Together

For a more reliable workflow, create a combined startup script:

```bash
#!/bin/bash

# Kill any existing Chrome and MCP server processes
pkill -f "Google Chrome"
pkill -f puppeteer-mcp

# Launch Chrome with remote debugging
open -a "Google Chrome" --args --remote-debugging-port=9222 --no-first-run --no-default-browser-check

# Wait for Chrome to start
sleep 2

# Get the WebSocket endpoint
WS_ENDPOINT=$(curl -s http://localhost:9222/json/version | grep -o '"webSocketDebuggerUrl":"[^"]*"' | cut -d'"' -f4)

# Launch the MCP server with the correct endpoint
export BROWSER_WS_ENDPOINT="$WS_ENDPOINT"
npx puppeteer-mcp-server
```

This script ensures both Chrome and the MCP server are configured correctly and running together.