# Repository Maintenance

This document explains how to maintain and clean up the Git repository.

## Repository Size Management

Over time, Git repositories can grow in size due to large files, build artifacts, and other temporary files being accidentally committed. This can make cloning and working with the repository slower and more cumbersome.

### Preventing Large Repository Size

1. Always adhere to the `.gitignore` patterns
2. Don't commit:
   - Node modules (`node_modules/`)
   - Build outputs (`.next/`, `out/`, `build/`)
   - Large binary files (images > 500KB, videos, etc.)
   - Environment files (`.env`, `.env.local`, etc.)
   - Temporary files or caches

### Cleaning the Repository

We provide two scripts to help clean up the repository:

#### 1. Basic Cleanup

For a quick cleanup that doesn't modify history:

```bash
# Remove files from working directory that should be ignored
git clean -fdx

# Aggressively clean up Git objects
git gc --aggressive --prune=now
```

#### 2. Full Repository Cleanup (Rewrites History)

For a deeper cleanup that will rewrite history to remove large files:

```bash
# Run the cleanup script
./scripts/clean-repo.sh
```

This script will:
- Create a backup branch
- Remove large files from Git history
- Run garbage collection to reclaim space
- Create a clean branch with the reduced repository size

**Warning:** This rewrites Git history and will require force-pushing to remote repositories. All collaborators will need to re-clone or rebase their work.

#### 3. Targeted Large File Removal

For removing specific large files:

```bash
# Run the large file removal script
./scripts/remove-large-files.sh
```

## Best Practices

1. **Review Changes Before Committing**: Always use `git status` and `git diff --staged` to review what you're about to commit.

2. **Use `.gitignore`**: Make sure the appropriate exclusion patterns are in `.gitignore` to prevent accidental commits of large or unnecessary files.

3. **Watch for Large Files**: Be cautious when adding large binary files to the repository. Consider using Git LFS or external storage solutions for larger assets.

4. **Regular Maintenance**: Run `git gc` periodically to clean up and optimize the repository.

5. **Git Hooks**: Consider setting up pre-commit hooks to prevent committing large files or files that should be ignored.

## Troubleshooting

If you encounter issues with repository size or performance:

1. Check for large files: 
   ```bash
   git verify-pack -v .git/objects/pack/pack-*.idx | sort -k 3 -n | tail -10
   ```

2. Identify what the large files are:
   ```bash
   git rev-list --objects --all | grep [HASH]
   ```

3. Consider running one of the cleanup scripts provided.