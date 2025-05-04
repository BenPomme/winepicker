#!/usr/bin/env node

/**
 * Setup script for Puppeteer MCP Server with Claude Code
 * This script helps set up the required configuration for using Puppeteer MCP
 * with Claude Code in VS Code.
 */

const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Define the start command for puppeteer-mcp-server
const startCommand = 'npx puppeteer-mcp-server';

console.log('Setting up Puppeteer MCP Server for Claude Code...');

// Create a start script for Puppeteer MCP Server
const scriptPath = path.join(__dirname, 'start-puppeteer-mcp.sh');
fs.writeFileSync(
  scriptPath, 
  `#!/bin/bash
echo "Starting Puppeteer MCP Server..."
${startCommand}
`, 
  { mode: 0o755 }
);

console.log(`Created start script at: ${scriptPath}`);
console.log('');
console.log('To use Puppeteer MCP with Claude Code:');
console.log('');
console.log('1. Start the Puppeteer MCP server in a separate terminal:');
console.log(`   $ ${scriptPath}`);
console.log('');
console.log('2. Once the server is running, Claude Code will be able to use the Puppeteer MCP tools');
console.log('   for web automation tasks.');
console.log('');
console.log('3. You can test it by asking Claude Code to:');
console.log('   - "Navigate to a website using Puppeteer"');
console.log('   - "Take a screenshot of a webpage"');
console.log('   - "Click a button on a webpage"');
console.log('');
console.log('Setup complete!');