#!/bin/bash

# DevOps Learning: Git Setup Script
# This script helps you set up Git for the first time

echo "🔧 Git Setup for DevOps Learning"
echo "================================"
echo ""

# Check if git is installed
if ! command -v git &> /dev/null; then
    echo "❌ Git is not installed."
    echo "Install it with: brew install git"
    exit 1
fi

echo "✅ Git is installed: $(git --version)"
echo ""

# Check if git is configured
if [ -z "$(git config --global user.name)" ]; then
    echo "📝 Git user name is not set."
    read -p "Enter your name: " name
    git config --global user.name "$name"
    echo "✅ Git user name set to: $name"
else
    echo "✅ Git user name: $(git config --global user.name)"
fi

if [ -z "$(git config --global user.email)" ]; then
    echo "📧 Git user email is not set."
    read -p "Enter your email: " email
    git config --global user.email "$email"
    echo "✅ Git user email set to: $email"
else
    echo "✅ Git user email: $(git config --global user.email)"
fi

echo ""
echo "🎉 Git setup complete!"
echo ""
echo "Next steps:"
echo "  1. Initialize repository: git init"
echo "  2. Add files: git add ."
echo "  3. Commit: git commit -m 'Initial commit'"
echo "  4. Connect to GitHub: git remote add origin <your-repo-url>"
echo "  5. Push: git push -u origin main"
