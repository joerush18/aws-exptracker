# DevOps Quick Start Guide
## Get Started in 5 Minutes!

## Step 1: Check Your Environment (2 minutes)

```bash
# Run the environment checker
./scripts/devops/check-env.sh
```

This will tell you what's installed and what's missing.

## Step 2: Set Up Git (1 minute)

```bash
# Run the Git setup script
./scripts/devops/setup-git.sh
```

This configures Git with your name and email.

## Step 3: Initialize Git Repository (1 minute)

```bash
# Initialize git (if not already done)
git init

# Add all files
git add .

# Create first commit
git commit -m "Initial commit: Expense Tracker with DevOps setup"
```

## Step 4: Create GitHub Repository (1 minute)

1. Go to https://github.com/new
2. Name: `expense-tracker`
3. Click "Create repository"
4. Copy the repository URL

## Step 5: Connect and Push (1 minute)

```bash
# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git

# Push to GitHub
git push -u origin main
```

## Step 6: Set Up GitHub Secrets (for CI/CD)

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Add these secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

## Step 7: Test CI/CD Pipeline

```bash
# Make a small change
echo "# DevOps Test" >> README.md

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Go to GitHub → Actions tab
# Watch your pipeline run! 🎉
```

## Next Steps

1. Read the full guide: `DEVOPS_LEARNING_GUIDE.md`
2. Complete the exercises in each section
3. Experiment with the CI/CD pipeline
4. Set up monitoring and alerts

## Need Help?

- Check the main guide: `DEVOPS_LEARNING_GUIDE.md`
- AWS Documentation: https://docs.aws.amazon.com
- GitHub Actions Docs: https://docs.github.com/en/actions

Happy Learning! 🚀
