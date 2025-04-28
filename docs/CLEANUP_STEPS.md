# Project Cleanup Steps

## Prerequisites

Before starting cleanup, create a backup branch:

```bash
git checkout -b backup-before-cleanup main
git add .
git commit -m "Create full backup of current state before cleanup"
```

## Step 1: Standardize .gitignore

1. Update `.gitignore` file to exclude build artifacts, node modules, and environment files
2. Remove tracked files that should be ignored:

```bash
git rm --cached .firebase/
git rm --cached out/ -r
git rm --cached functions/lib/ -r
git rm --cached functions/node_modules/ -r
```

## Step 2: Organize Test Files

1. Create dedicated test directories:

```bash
mkdir -p tests/api
mkdir -p tests/ui
mkdir -p tests/integration
```

2. Move test files to appropriate directories:

```bash
git mv test-*.js tests/api/
```

## Step 3: Clean Up Branches

1. Push local commits to remote:

```bash
git push origin main
```

2. Clean up merged local branches:

```bash
git branch --merged main | grep -v "main" | xargs git branch -d
```

3. Clean up remote branches:

```bash
git remote prune origin
```

4. Delete obsolete feature branches:

```bash
# For each branch that is no longer needed:
git push origin --delete <branch-name>
```

## Step 4: Improve Deployment Scripts

1. Update deployment scripts to use environment variables instead of hardcoded values
2. Create a proper CI/CD workflow with GitHub Actions or similar
3. Document deployment process in DEPLOYMENT.md

## Step 5: Document Project Structure

1. Update README.md with project overview, setup instructions, and development workflow
2. Create CONTRIBUTING.md with guidelines for contributors
3. Document branching strategy in BRANCHING.md

## Step 6: Test Everything

After cleanup:

1. Test the build process
2. Test the deployment process
3. Test all core functionality 

## Recovery Plan

If anything breaks during cleanup:

```bash
git checkout backup-before-cleanup
```