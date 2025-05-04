#!/usr/bin/env node

/**
 * Custom Puppeteer MCP Server implementation
 * This is a simplified implementation of the MCP server for Puppeteer that focuses
 * on the core functionality needed for Claude Code.
 */

const express = require('express');
const puppeteer = require('puppeteer');
const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();
const port = 3333;

// Configure logging
const logDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}
const logFile = path.join(logDir, `mcp-puppeteer-${new Date().toISOString().slice(0, 10).replace(/-/g, '-')}.log`);

// Create a write stream for logging
const logStream = fs.createWriteStream(logFile, { flags: 'a' });

function log(level, message, data = {}) {
  const timestamp = new Date().toISOString().replace('T', ' ').slice(0, -5);
  const logEntry = {
    level,
    message,
    service: 'mcp-puppeteer',
    timestamp,
    ...data
  };
  logStream.write(JSON.stringify(logEntry) + '\n');
  console.log(`[${timestamp}] [${level.toUpperCase()}] ${message}`);
}

// Global browser instance
let browser = null;

// Middleware to parse JSON
app.use(express.json());

// Connect to Chrome
async function connectToBrowser() {
  try {
    // If we already have a browser instance, disconnect it
    if (browser) {
      log('debug', 'Closing existing browser connection');
      await browser.disconnect();
    }

    // Try to connect to an existing Chrome instance
    const wsEndpoint = process.env.BROWSER_WS_ENDPOINT || 'ws://localhost:9222';
    log('info', 'Connecting to existing browser', { wsEndpoint });
    
    browser = await puppeteer.connect({
      browserURL: 'http://localhost:9222',
      defaultViewport: null
    });
    
    log('info', 'Successfully connected to browser');
    
    // Get all pages
    const pages = await browser.pages();
    for (const page of pages) {
      const title = await page.title();
      const url = page.url();
      log('info', 'Found active webpage:', { title, url });
    }
    
    return { success: true };
  } catch (error) {
    log('error', `Failed to connect to browser: ${error.message}`);
    return { success: false, error: error.message };
  }
}

// API routes
app.post('/api/puppeteer/connect', async (req, res) => {
  log('debug', 'Tool call received', { 
    tool: 'puppeteer_connect_active_tab',
    arguments: req.body 
  });
  
  const result = await connectToBrowser();
  res.json(result);
});

app.post('/api/puppeteer/navigate', async (req, res) => {
  const { url } = req.body;
  
  log('debug', 'Tool call received', { 
    tool: 'puppeteer_navigate',
    arguments: req.body 
  });
  
  try {
    if (!browser) {
      await connectToBrowser();
    }
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    log('info', `Navigating to URL: ${url}`);
    await page.goto(url, { waitUntil: 'networkidle2' });
    
    const title = await page.title();
    log('info', `Navigation successful: ${title}`);
    
    res.json({ success: true, title });
  } catch (error) {
    log('error', `Navigation failed: ${error.message}`);
    res.json({ success: false, error: error.message });
  }
});

app.post('/api/puppeteer/screenshot', async (req, res) => {
  const { name, selector, width, height } = req.body;
  
  log('debug', 'Tool call received', { 
    tool: 'puppeteer_screenshot',
    arguments: req.body 
  });
  
  try {
    if (!browser) {
      await connectToBrowser();
    }
    
    const pages = await browser.pages();
    const page = pages[0] || await browser.newPage();
    
    // Set viewport if provided
    if (width || height) {
      await page.setViewport({
        width: width || 800,
        height: height || 600
      });
    }
    
    const screenshotOptions = { path: `${name}.png` };
    
    // Take screenshot of specific element if selector provided
    if (selector) {
      log('info', `Taking screenshot of element: ${selector}`);
      const element = await page.$(selector);
      if (!element) {
        throw new Error(`Element not found: ${selector}`);
      }
      await element.screenshot(screenshotOptions);
    } else {
      log('info', 'Taking full page screenshot');
      await page.screenshot(screenshotOptions);
    }
    
    log('info', `Screenshot saved to ${screenshotOptions.path}`);
    res.json({ success: true, path: screenshotOptions.path });
  } catch (error) {
    log('error', `Screenshot failed: ${error.message}`);
    res.json({ success: false, error: error.message });
  }
});

// Start the server
app.listen(port, () => {
  log('info', 'Starting MCP server');
  log('info', 'MCP server started successfully');
  log('info', `Custom Puppeteer MCP Server running on port ${port}`);
  
  // Connect to browser on startup
  connectToBrowser();
});

// Handle shutdown
process.on('SIGINT', async () => {
  log('info', 'Puppeteer MCP Server closing');
  if (browser) {
    await browser.disconnect();
  }
  process.exit(0);
});