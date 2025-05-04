# Puppeteer MCP Setup Guide

This document provides a comprehensive guide for setting up and troubleshooting the Puppeteer MCP (Multi-Channel Protocol) server for use with Claude Code.

## Overview

The Puppeteer MCP server allows Claude Code to interact with web browsers programmatically, enabling automated testing, screenshot capturing, and web automation tasks.

## Quick Start

1. Launch Chrome with remote debugging:
   ```bash
   open -a "Google Chrome" --args --remote-debugging-port=9222 --no-first-run --no-default-browser-check
   ```

2. Start the Puppeteer MCP server:
   ```bash
   ./scripts/mcp/start-puppeteer-mcp.sh
   ```

3. Alternatively, use the combined restart script:
   ```bash
   ./scripts/mcp/restart-puppeteer-mcp.sh
   ```

## Testing the Setup

Use the test script to verify your setup:
```bash
node scripts/mcp/test-puppeteer.js
```

If the test script works but the MCP connection still shows as "failed", you may need to restart Claude Code or refresh the MCP connection.

## Available Scripts

1. **start-puppeteer-mcp.sh**
   - Starts the MCP server, automatically detecting Chrome's WebSocket endpoint
   - Will launch Chrome if not already running with debugging enabled

2. **restart-puppeteer-mcp.sh**
   - Completely restarts both Chrome and the MCP server
   - Ensures clean state for debugging

3. **test-puppeteer.js**
   - Tests direct Puppeteer connection to Chrome
   - Creates a simple test page and takes a screenshot

4. **custom-puppeteer-mcp-server.js**
   - Custom implementation of the MCP server
   - Useful if the standard MCP server has issues

## Troubleshooting

### Permissions Issues

If you encounter "EACCES" errors:
```bash
chmod +x scripts/mcp/*.js
chmod +x scripts/mcp/*.sh
```

### Connection Issues

1. Verify Chrome is running with debugging:
   ```bash
   nc -z localhost 9222 && echo "Port 9222 is open" || echo "Port 9222 is closed"
   ```

2. Verify Chrome's WebSocket endpoint:
   ```bash
   curl -s http://localhost:9222/json/version | grep webSocketDebuggerUrl
   ```

3. Check MCP logs:
   ```bash
   cat /Users/benjamin.pommeraud/mywine-1/logs/mcp-puppeteer-*.log
   ```

4. Check Claude Code's MCP logs:
   ```bash
   ls -la /Users/benjamin.pommeraud/Library/Caches/claude-cli-nodejs/-Users-benjamin-pommeraud-mywine-1/mcp-logs-puppeteer/
   ```

### MCP Server Showing as Failed

If the MCP server shows as "failed" in the Claude Code status despite being running, try the following:

1. Restart Chrome with debugging enabled
2. Restart the MCP server with the correct WebSocket endpoint
3. Restart Claude Code
4. If all else fails, try using the custom MCP server implementation

## Using the Custom MCP Server

If the standard MCP server doesn't work well with your setup, try the custom implementation:

```bash
node scripts/mcp/custom-puppeteer-mcp-server.js
```

This runs on port 3333 and implements the core functionality needed for puppeteer automation.

## Further Resources

For more detailed information on troubleshooting, see:

- [PUPPETEER_MCP_TROUBLESHOOTING.md](./PUPPETEER_MCP_TROUBLESHOOTING.md)
- [Official Puppeteer MCP documentation](https://docs.anthropic.com/claude/docs/mcp)