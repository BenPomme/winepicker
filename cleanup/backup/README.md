# Backup Files

This directory contains backup copies of files that have been removed from the main project directory during cleanup.

## Contents

- `manifest.json.bak` - Backup of previous PWA manifest configuration
- `/scripts/` - Temporary fix scripts that were used to address specific issues:
  - Language selection fixes
  - i18n configuration fixes
  - Redirect handling fixes

## Purpose

These files are kept for reference purposes only and should not be used in the active project. They document previous approaches and configurations that may be helpful for understanding the project's history.

## Notes

- If you need to restore any of these files, review them carefully before using them
- Most of these files have been superseded by more permanent solutions in the main codebase
- Consider removing this directory entirely once the project has been stable for some time