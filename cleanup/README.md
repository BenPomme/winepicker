# Project Cleanup Guide

This directory contains documentation and instructions for the project cleanup process.

## Current Issues

1. **Git Branches**: 10 local and 14 remote branches with overlapping features
2. **Build Artifacts**: Untracked build outputs in version control
3. **Firebase Configuration**: Local changes not committed with potential secrets
4. **Test Files**: Numerous test files at the project root

## Recommended Actions

### Git Branch Management

```bash
# Delete local branches after merging 
git branch -d <branch-name>

# Delete remote branch
git push origin --delete <branch-name>

# Prune remote branches that no longer exist
git remote prune origin
```

### Organizing Test Files

```bash
# Create dedicated test directories
mkdir -p tests/api
mkdir -p tests/ui
mkdir -p tests/integration

# Move test files to appropriate directories
git mv test-*.js tests/
```

### Deployment Strategy

1. Use the `main` branch for production
2. Create feature branches from `main` 
3. After testing, merge feature branches to `main`
4. Tag release versions when deploying to production

### Firebase Configuration

1. Store sensitive configuration in environment variables
2. Use GitHub secrets for CI/CD pipelines
3. Document deployment process in DEPLOYMENT.md

## Backup Process

Before cleanup:
```bash
git checkout -b backup-before-cleanup main
git add .
git commit -m "Create full backup of current state before cleanup"
```

To restore:
```bash
git checkout backup-before-cleanup
```