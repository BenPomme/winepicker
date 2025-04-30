# Logs Directory

This directory contains application logs for monitoring and debugging purposes.

## Directory Structure

- `/logs/` - Current logs
- `/logs/archive/` - Archived logs

## Log Files

- `mcp-puppeteer-*.log` - Logs from the MCP Puppeteer service
- Additional log files as services are added

## Log Rotation

To prevent excessive disk usage, logs should be regularly archived:

1. Current logs stay in the root logs directory
2. Older logs should be moved to the archive directory
3. Logs older than 30 days should be compressed or deleted

## Maintenance Script

You can use the following command to archive logs older than 7 days:

```bash
find logs -name "*.log" -type f -mtime +7 -exec mv {} logs/archive/ \;
```

And to clean up logs older than 30 days:

```bash
find logs/archive -name "*.log" -type f -mtime +30 -delete
```

## Notes

- Do not commit sensitive information in log files
- Always check logs for errors after deployments
- Add `.log` files to `.gitignore` to prevent accidental commits