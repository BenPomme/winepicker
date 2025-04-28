#!/bin/bash

# This script uses git-filter-repo to remove sensitive data from the repository
# You need to install git-filter-repo first: 
# pip install git-filter-repo

echo "This script will rewrite git history to remove sensitive API keys."
echo "WARNING: This is a destructive operation that will change commit hashes."
echo "Make sure you have a backup of your repository before proceeding."
echo ""
echo "Press Enter to continue or Ctrl+C to abort..."
read

# Run git filter-repo to replace OpenAI API keys with placeholder text
git filter-repo --replace-text <<EOF
# OpenAI API key patterns (adjust as needed based on your actual key formats)
sk-[a-zA-Z0-9]{24,}==>OPENAI_API_KEY_PLACEHOLDER
sk-[a-zA-Z0-9]{48}==>OPENAI_API_KEY_PLACEHOLDER
sk-proj-[a-zA-Z0-9-_]{32,}==>OPENAI_API_KEY_PLACEHOLDER
# Current key pattern from test-web-search-client.tsx
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==>OPENAI_API_KEY_PLACEHOLDER
EOF

echo ""
echo "Git history has been rewritten."
echo "You'll need to force-push these changes to the remote repository:"
echo "  git push origin --force --all"
echo ""
echo "Note: All collaborators will need to re-clone the repository or run:"
echo "  git fetch origin"
echo "  git reset --hard origin/main"