# Branching Strategy

## Branch Types

- **main**: Production-ready code
- **feature/[name]**: New features or enhancements
- **fix/[name]**: Bug fixes
- **hotfix/[name]**: Critical production fixes

## Workflow

### Feature Development

1. Create a feature branch from `main`
```bash
git checkout main
git pull
git checkout -b feature/new-feature
```

2. Develop and commit changes
```bash
git add .
git commit -m "feat: Add new feature"
```

3. Push changes to remote
```bash
git push -u origin feature/new-feature
```

4. Create a Pull Request to `main`
5. After review and approval, merge the PR

### Bug Fixes

1. Create a fix branch from `main`
```bash
git checkout main
git pull
git checkout -b fix/bug-description
```

2. Develop and commit changes
```bash
git add .
git commit -m "fix: Fix the bug"
```

3. Push changes to remote
```bash
git push -u origin fix/bug-description
```

4. Create a Pull Request to `main`
5. After review and approval, merge the PR

### Hotfixes

For critical production issues:

1. Create a hotfix branch from the production tag
```bash
git checkout v1.0.0
git checkout -b hotfix/critical-issue
```

2. Fix the issue and commit
```bash
git add .
git commit -m "hotfix: Fix critical issue"
```

3. Create PRs to both `main` and the release branch

## Branch Cleanup

Regularly clean up merged branches:

```bash
# Update local list of remote branches
git fetch --prune

# List merged branches
git branch --merged main

# Delete local branches that have been merged
git branch -d feature/completed-feature

# Delete remote branches
git push origin --delete feature/completed-feature
```