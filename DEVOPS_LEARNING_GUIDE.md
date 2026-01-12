# DevOps Learning Guide
## Step-by-Step Guide for Complete Beginners

**Project:** AWS Serverless Expense Tracker  
**Learning Path:** DevOps Fundamentals Using Real Project

---

# Table of Contents

1. [What is DevOps?](#1-what-is-devops)
2. [Setting Up Your DevOps Environment](#2-setting-up-your-devops-environment)
3. [Version Control with Git](#3-version-control-with-git)
4. [Infrastructure as Code (IaC)](#4-infrastructure-as-code-iac)
5. [CI/CD Pipelines](#5-cicd-pipelines)
6. [Monitoring and Logging](#6-monitoring-and-logging)
7. [Automated Testing](#7-automated-testing)
8. [Security Best Practices](#8-security-best-practices)
9. [Deployment Strategies](#9-deployment-strategies)
10. [Troubleshooting and Debugging](#10-troubleshooting-and-debugging)

---

# 1. What is DevOps?

## 1.1 Understanding DevOps

**DevOps** = **Dev**elopment + **Op**erations

Think of DevOps as a bridge between:
- **Developers** (who write code)
- **Operations** (who run and maintain systems)

### Traditional Way (Before DevOps):
```
Developer writes code → Gives to Operations → Operations deploys → Problems occur → Blame game
```

### DevOps Way:
```
Developer + Operations work together → Automated processes → Faster, reliable deployments
```

## 1.2 Key DevOps Concepts

### 1. **Automation**
- Instead of doing things manually, we write scripts to do them automatically
- Example: Your `deploy.sh` script automates deployment

### 2. **Infrastructure as Code (IaC)**
- Instead of clicking buttons in AWS console, we write code to create infrastructure
- Example: Your `template.yaml` file defines all AWS resources

### 3. **Continuous Integration (CI)**
- Automatically test code when developers push changes
- Catch bugs early before they reach production

### 4. **Continuous Deployment (CD)**
- Automatically deploy code when tests pass
- No manual deployment steps needed

### 5. **Monitoring**
- Watch your application to see if it's working correctly
- Get alerts when something goes wrong

## 1.3 Why DevOps Matters for Your Project

Your expense tracker project already uses some DevOps concepts:
- ✅ Infrastructure as Code (SAM template)
- ✅ Automated deployment script
- ✅ Cloud infrastructure

We'll enhance it with:
- 🔄 CI/CD pipelines
- 📊 Monitoring and logging
- 🧪 Automated testing
- 🔒 Security scanning

---

# 2. Setting Up Your DevOps Environment

## 2.1 Prerequisites Check

Let's verify what you have installed:

```bash
# Check AWS CLI
aws --version

# Check Git
git --version

# Check Node.js
node --version

# Check SAM CLI
sam --version

# Check Docker (we'll use this later)
docker --version
```

## 2.2 Installing Missing Tools

### Install Git (if not installed)

**macOS:**
```bash
# Git usually comes pre-installed, but if not:
brew install git
```

**Verify installation:**
```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@example.com"
```

### Install Docker (for containerization)

**macOS:**
```bash
# Download Docker Desktop from https://www.docker.com/products/docker-desktop
# Or use Homebrew:
brew install --cask docker
```

**Verify installation:**
```bash
docker run hello-world
```

## 2.3 Setting Up AWS Credentials

### Step 1: Create IAM User

1. Go to AWS Console → IAM → Users
2. Click "Add users"
3. Username: `devops-user`
4. Access type: "Programmatic access"
5. Attach policy: `AdministratorAccess` (for learning - use least privilege in production)
6. Save Access Key ID and Secret Access Key

### Step 2: Configure AWS CLI

```bash
aws configure
# Enter your Access Key ID
# Enter your Secret Access Key
# Default region: ap-southeast-2 (or your preferred region)
# Default output format: json
```

### Step 3: Test Configuration

```bash
aws sts get-caller-identity
# Should show your user details
```

## 2.4 Create Project Structure

```bash
cd /Users/sarojaryal/Desktop/koi/cloud/exp-tracker

# Create DevOps directories
mkdir -p .github/workflows  # For GitHub Actions CI/CD
mkdir -p scripts/devops    # For DevOps scripts
mkdir -p tests             # For automated tests
mkdir -p monitoring        # For monitoring configs
```

---

# 3. Version Control with Git

## 3.1 What is Git?

**Git** is a version control system - think of it as a time machine for your code.

### Why Use Git?
- ✅ Track changes to your code
- ✅ Collaborate with others
- ✅ Revert to previous versions if something breaks
- ✅ See who changed what and when

## 3.2 Basic Git Commands

### Initialize Git Repository

```bash
cd /Users/sarojaryal/Desktop/koi/cloud/exp-tracker

# Initialize git repository (if not already done)
git init

# Check status
git status
```

### Create .gitignore File

Create a file called `.gitignore` in your project root:

```bash
cat > .gitignore << 'EOF'
# Dependencies
node_modules/
package-lock.json
yarn.lock

# Build outputs
frontend/build/
backend/.aws-sam/

# Environment variables
.env
.env.local
.env.*.local

# IDE files
.vscode/
.idea/
*.swp
*.swo

# OS files
.DS_Store
Thumbs.db

# Logs
*.log
logs/

# AWS credentials (NEVER commit these!)
.aws/
credentials
config

# Temporary files
*.tmp
*.temp
EOF
```

### Your First Git Commit

```bash
# Stage all files
git add .

# Check what will be committed
git status

# Commit with a message
git commit -m "Initial commit: AWS Serverless Expense Tracker"

# View commit history
git log --oneline
```

## 3.3 Understanding Git Workflow

### Basic Workflow:

```
1. Make changes to files
2. git add .          (stage changes)
3. git commit -m "message"  (save changes)
4. git push          (upload to remote repository)
```

### Create a GitHub Repository

1. Go to https://github.com
2. Click "New repository"
3. Name: `expense-tracker`
4. Description: "AWS Serverless Expense Tracker"
5. Choose "Private" (for now)
6. Don't initialize with README
7. Click "Create repository"

### Connect Local Repository to GitHub

```bash
# Add remote repository (replace YOUR_USERNAME)
git remote add origin https://github.com/YOUR_USERNAME/expense-tracker.git

# Rename main branch (if needed)
git branch -M main

# Push to GitHub
git push -u origin main
```

## 3.4 Git Branches (Advanced)

Branches let you work on features without affecting main code:

```bash
# Create a new branch for a feature
git checkout -b feature/add-budget-tracking

# Make changes, commit them
git add .
git commit -m "Add budget tracking feature"

# Switch back to main branch
git checkout main

# Merge feature branch into main
git merge feature/add-budget-tracking

# Delete feature branch
git branch -d feature/add-budget-tracking
```

### Exercise 1: Practice Git

```bash
# 1. Create a new file
echo "# Test file" > test.md

# 2. Stage it
git add test.md

# 3. Commit it
git commit -m "Add test file"

# 4. View history
git log --oneline

# 5. Delete the file
rm test.md
git add test.md
git commit -m "Remove test file"

# 6. See all changes
git log --oneline --all
```

---

# 4. Infrastructure as Code (IaC)

## 4.1 What is Infrastructure as Code?

Instead of clicking buttons in AWS Console to create resources, you write code that describes your infrastructure.

### Benefits:
- ✅ Reproducible (same infrastructure every time)
- ✅ Version controlled (track changes)
- ✅ Reviewable (others can review before deploying)
- ✅ Documented (code is documentation)

## 4.2 Understanding Your SAM Template

Let's examine your `backend/template.yaml`:

```yaml
# This is a CloudFormation template
AWSTemplateFormatVersion: "2010-09-09"
Transform: AWS::Serverless-2016-10-31

# This tells AWS: "This is a SAM template"
```

### Key Sections:

#### 1. **Resources Section**
Defines what AWS resources to create:

```yaml
Resources:
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: users
      # This creates a DynamoDB table named "users"
```

#### 2. **Parameters Section**
Allows customization without changing code:

```yaml
Parameters:
  Environment:
    Type: String
    Default: dev
    # Can be: dev, staging, prod
```

#### 3. **Outputs Section**
Returns important values after deployment:

```yaml
Outputs:
  ApiUrl:
    Description: API Gateway endpoint URL
    Value: !GetAtt ExpenseApi.ApiUrl
    # This gives you the API URL after deployment
```

## 4.3 Hands-On: Modify Your Template

### Exercise 2: Add a Parameter

```bash
cd backend

# Open template.yaml
# Add this section before Resources:
```

```yaml
Parameters:
  Environment:
    Type: String
    Default: dev
    AllowedValues:
      - dev
      - staging
      - prod
    Description: Deployment environment

# Then modify a resource to use it:
Resources:
  UsersTable:
    Type: AWS::DynamoDB::Table
    Properties:
      TableName: !Sub "users-${Environment}"
      # Table name will be: users-dev, users-staging, or users-prod
```

### Exercise 3: Add an Output

Add to the `Outputs` section:

```yaml
Outputs:
  Environment:
    Description: Current deployment environment
    Value: !Ref Environment
    Export:
      Name: !Sub "${AWS::StackName}-Environment"
```

### Deploy Your Changes

```bash
# Build
sam build

# Deploy with parameter
sam deploy --parameter-overrides Environment=dev

# Verify
aws cloudformation describe-stacks \
  --stack-name expense-tracker \
  --query 'Stacks[0].Outputs'
```

## 4.4 Understanding CloudFormation

CloudFormation is AWS's IaC service. Your SAM template gets converted to CloudFormation.

### Key Concepts:

1. **Stack**: A collection of AWS resources defined by a template
2. **Stack Name**: Unique identifier for your stack
3. **Change Set**: Preview of changes before applying
4. **Rollback**: Automatic undo if deployment fails

### Useful Commands:

```bash
# List all stacks
aws cloudformation list-stacks

# Describe a stack
aws cloudformation describe-stacks --stack-name expense-tracker

# View stack events (see what's happening)
aws cloudformation describe-stack-events --stack-name expense-tracker

# Delete a stack
aws cloudformation delete-stack --stack-name expense-tracker
```

---

# 5. CI/CD Pipelines

## 5.1 What is CI/CD?

**CI** = Continuous Integration
- Automatically test code when you push changes
- Catch bugs early

**CD** = Continuous Deployment
- Automatically deploy when tests pass
- No manual deployment needed

## 5.2 Setting Up GitHub Actions

GitHub Actions is a CI/CD platform built into GitHub.

### Step 1: Create Workflow File

```bash
mkdir -p .github/workflows
```

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy Expense Tracker

# When to run this workflow
on:
  push:
    branches:
      - main  # Run when code is pushed to main branch
  pull_request:
    branches:
      - main  # Run when PR is created

# Jobs to run
jobs:
  # Job 1: Test the application
  test:
    runs-on: ubuntu-latest
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Run tests
        run: |
          cd frontend
          npm test -- --watchAll=false
        # We'll add tests later
  
  # Job 2: Build frontend
  build-frontend:
    runs-on: ubuntu-latest
    needs: test  # Wait for tests to pass
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'
      
      - name: Install dependencies
        run: |
          cd frontend
          npm install
      
      - name: Build frontend
        run: |
          cd frontend
          npm run build
      
      - name: Upload build artifacts
        uses: actions/upload-artifact@v3
        with:
          name: frontend-build
          path: frontend/build
  
  # Job 3: Deploy backend
  deploy-backend:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Setup SAM CLI
        uses: aws-actions/setup-sam@v2
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2
      
      - name: Build SAM application
        run: |
          cd backend
          sam build
      
      - name: Deploy SAM application
        run: |
          cd backend
          sam deploy --no-confirm-changeset --no-fail-on-empty-changeset
  
  # Job 4: Deploy frontend
  deploy-frontend:
    runs-on: ubuntu-latest
    needs: [build-frontend, deploy-backend]
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v3
      
      - name: Download build artifacts
        uses: actions/download-artifact@v3
        with:
          name: frontend-build
      
      - name: Configure AWS credentials
        uses: aws-actions/configure-aws-credentials@v2
        with:
          aws-access-key-id: ${{ secrets.AWS_ACCESS_KEY_ID }}
          aws-secret-access-key: ${{ secrets.AWS_SECRET_ACCESS_KEY }}
          aws-region: ap-southeast-2
      
      - name: Get S3 bucket name
        id: get-bucket
        run: |
          BUCKET=$(aws cloudformation describe-stacks \
            --stack-name expense-tracker \
            --query 'Stacks[0].Outputs[?OutputKey==`S3BucketName`].OutputValue' \
            --output text)
          echo "bucket=$BUCKET" >> $GITHUB_OUTPUT
      
      - name: Deploy to S3
        run: |
          aws s3 sync build/ s3://${{ steps.get-bucket.outputs.bucket }} --delete
      
      - name: Invalidate CloudFront cache
        run: |
          DIST_ID=$(aws cloudformation describe-stacks \
            --stack-name expense-tracker \
            --query 'Stacks[0].Outputs[?OutputKey==`CloudFrontDistributionId`].OutputValue' \
            --output text)
          aws cloudfront create-invalidation \
            --distribution-id $DIST_ID \
            --paths "/*"
```

### Step 2: Add GitHub Secrets

1. Go to your GitHub repository
2. Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Add these secrets:
   - `AWS_ACCESS_KEY_ID`: Your AWS access key
   - `AWS_SECRET_ACCESS_KEY`: Your AWS secret key

### Step 3: Test the Pipeline

```bash
# Make a small change
echo "# Test CI/CD" >> README.md

# Commit and push
git add .
git commit -m "Test CI/CD pipeline"
git push origin main

# Go to GitHub → Actions tab
# Watch your pipeline run!
```

## 5.3 Understanding the Pipeline

### Workflow Stages:

```
1. Code Push → Triggers workflow
2. Test → Run tests (must pass)
3. Build → Build application
4. Deploy Backend → Deploy Lambda functions
5. Deploy Frontend → Deploy to S3
6. Invalidate Cache → Update CloudFront
```

### Key Concepts:

- **Jobs**: Independent tasks that can run in parallel
- **Steps**: Individual commands within a job
- **Secrets**: Secure storage for sensitive data
- **Artifacts**: Files passed between jobs

---

# 6. Monitoring and Logging

## 6.1 What is Monitoring?

Monitoring means watching your application to ensure it's working correctly.

### Why Monitor?
- ✅ Know when something breaks
- ✅ Understand performance
- ✅ Track usage patterns
- ✅ Debug issues faster

## 6.2 AWS CloudWatch

CloudWatch is AWS's monitoring service.

### Viewing Lambda Logs

```bash
# List log groups
aws logs describe-log-groups

# View logs for a specific function
aws logs tail /aws/lambda/expense-tracker-CreateExpenseFunction --follow

# Filter logs by time
aws logs filter-log-events \
  --log-group-name /aws/lambda/expense-tracker-CreateExpenseFunction \
  --start-time $(date -u -d '1 hour ago' +%s)000
```

### Creating CloudWatch Dashboard

1. Go to AWS Console → CloudWatch → Dashboards
2. Click "Create dashboard"
3. Name: `expense-tracker-dashboard`
4. Add widgets:
   - Lambda invocations
   - Lambda errors
   - API Gateway requests
   - DynamoDB read/write capacity

## 6.3 Adding Custom Metrics

Modify a Lambda function to send custom metrics:

```javascript
// In createExpense/index.js
const { CloudWatchClient, PutMetricDataCommand } = require("@aws-sdk/client-cloudwatch");

const cloudwatch = new CloudWatchClient({ region: process.env.AWS_REGION });

// After creating expense
await cloudwatch.send(new PutMetricDataCommand({
  Namespace: 'ExpenseTracker',
  MetricData: [{
    MetricName: 'ExpenseCreated',
    Value: 1,
    Unit: 'Count',
    Dimensions: [
      { Name: 'Category', Value: expenseData.category }
    ]
  }]
}));
```

## 6.4 Setting Up Alarms

Create an alarm for Lambda errors:

```bash
aws cloudwatch put-metric-alarm \
  --alarm-name expense-tracker-errors \
  --alarm-description "Alert when Lambda errors exceed threshold" \
  --metric-name Errors \
  --namespace AWS/Lambda \
  --statistic Sum \
  --period 300 \
  --threshold 5 \
  --comparison-operator GreaterThanThreshold \
  --evaluation-periods 1 \
  --alarm-actions arn:aws:sns:ap-southeast-2:YOUR_ACCOUNT:alerts-topic
```

---

# 7. Automated Testing

## 7.1 Why Test?

- ✅ Catch bugs before users do
- ✅ Ensure code changes don't break existing features
- ✅ Document how code should work
- ✅ Enable confident refactoring

## 7.2 Types of Tests

### 1. Unit Tests
Test individual functions in isolation

### 2. Integration Tests
Test how components work together

### 3. End-to-End Tests
Test the entire application flow

## 7.3 Setting Up Jest for Frontend

```bash
cd frontend

# Install Jest and testing libraries
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

Create `frontend/jest.config.js`:

```javascript
module.exports = {
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/src/setupTests.js'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
};
```

Create `frontend/src/setupTests.js`:

```javascript
import '@testing-library/jest-dom';
```

### Example Test: ExpenseForm Component

Create `frontend/src/components/__tests__/ExpenseForm.test.jsx`:

```javascript
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ExpenseForm from '../ExpenseForm';

describe('ExpenseForm', () => {
  const mockOnSubmit = jest.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  test('renders form fields', () => {
    render(<ExpenseForm onSubmit={mockOnSubmit} />);
    
    expect(screen.getByLabelText(/amount/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/date/i)).toBeInTheDocument();
  });

  test('submits form with valid data', async () => {
    const user = userEvent.setup();
    render(<ExpenseForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/amount/i), '25.50');
    await user.selectOptions(screen.getByLabelText(/category/i), 'Food & Dining');
    await user.click(screen.getByRole('button', { name: /add expense/i }));
    
    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        amount: 25.5,
        category: 'Food & Dining',
        date: expect.any(String),
        notes: '',
      });
    });
  });

  test('shows error for invalid amount', async () => {
    const user = userEvent.setup();
    render(<ExpenseForm onSubmit={mockOnSubmit} />);
    
    await user.type(screen.getByLabelText(/amount/i), '-10');
    await user.click(screen.getByRole('button', { name: /add expense/i }));
    
    expect(await screen.findByText(/amount must be a positive number/i)).toBeInTheDocument();
  });
});
```

### Run Tests

```bash
cd frontend
npm test
```

## 7.4 Testing Lambda Functions

Create `backend/functions/createExpense/__tests__/index.test.js`:

```javascript
const { handler } = require('../index');

describe('createExpense handler', () => {
  const mockEvent = {
    headers: {
      Authorization: 'Bearer valid-token'
    },
    body: JSON.stringify({
      amount: 25.50,
      category: 'Food & Dining',
      date: '2026-01-15',
      notes: 'Test expense'
    })
  };

  test('creates expense successfully', async () => {
    const response = await handler(mockEvent);
    
    expect(response.statusCode).toBe(201);
    const body = JSON.parse(response.body);
    expect(body.message).toContain('successfully');
    expect(body.expenseId).toBeDefined();
  });

  test('rejects invalid amount', async () => {
    const invalidEvent = {
      ...mockEvent,
      body: JSON.stringify({
        amount: -10,
        category: 'Food & Dining',
        date: '2026-01-15'
      })
    };
    
    const response = await handler(invalidEvent);
    expect(response.statusCode).toBe(400);
  });
});
```

---

# 8. Security Best Practices

## 8.1 Secrets Management

### Never Commit Secrets!

❌ **BAD:**
```javascript
const API_KEY = "sk_live_1234567890";  // DON'T DO THIS!
```

✅ **GOOD:**
```javascript
const API_KEY = process.env.API_KEY;  // Use environment variables
```

### Using AWS Secrets Manager

```bash
# Store a secret
aws secretsmanager create-secret \
  --name expense-tracker/jwt-secret \
  --secret-string "your-secret-key-here"

# Retrieve in Lambda
# Use AWS SDK to fetch secret at runtime
```

## 8.2 IAM Roles and Policies

### Principle of Least Privilege

Give only the minimum permissions needed.

### Example: Lambda Function Role

```yaml
CreateExpenseFunction:
  Type: AWS::Serverless::Function
  Properties:
    Policies:
      - DynamoDBCrudPolicy:
          TableName: !Ref ExpensesTable
      # Only allows CRUD on ExpensesTable, nothing else
```

## 8.3 Security Scanning

### Install Security Scanner

```bash
npm install --save-dev npm-audit-resolver
```

### Run Security Audit

```bash
cd frontend
npm audit

# Fix vulnerabilities
npm audit fix
```

---

# 9. Deployment Strategies

## 9.1 Blue-Green Deployment

Deploy new version alongside old, then switch:

```
1. Deploy new version (green)
2. Test green environment
3. Switch traffic to green
4. Keep blue as backup
```

## 9.2 Canary Deployment

Gradually roll out to small percentage of users:

```
1. Deploy to 10% of users
2. Monitor for issues
3. If OK, deploy to 50%
4. Then 100%
```

## 9.3 Rollback Strategy

Always be able to go back:

```bash
# Rollback to previous CloudFormation stack version
aws cloudformation cancel-update-stack --stack-name expense-tracker

# Or deploy previous code version
git checkout previous-commit-hash
git push origin main
```

---

# 10. Troubleshooting and Debugging

## 10.1 Common Issues

### Issue: Lambda Function Timeout

**Symptoms:** Function takes too long, times out

**Solution:**
```yaml
# Increase timeout in template.yaml
CreateExpenseFunction:
  Properties:
    Timeout: 60  # Increase from 30 to 60 seconds
```

### Issue: CORS Errors

**Symptoms:** Browser shows CORS error

**Solution:**
```yaml
# Ensure CORS is configured in API Gateway
ExpenseApi:
  Properties:
    Cors:
      AllowMethods: "'GET,POST,DELETE,OPTIONS'"
      AllowHeaders: "'Content-Type,Authorization'"
      AllowOrigin: "'*'"
```

### Issue: DynamoDB Throttling

**Symptoms:** Read/Write capacity exceeded

**Solution:**
```yaml
# Switch to on-demand billing
ExpensesTable:
  Properties:
    BillingMode: PAY_PER_REQUEST
```

## 10.2 Debugging Tools

### CloudWatch Insights

Query logs efficiently:

```sql
fields @timestamp, @message
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

### AWS X-Ray

Trace requests across services:

```bash
# Enable X-Ray in template.yaml
Globals:
  Function:
    Tracing: Active
```

---

# Practice Exercises

## Exercise 1: Add a Health Check Endpoint

Create a Lambda function that returns system health:

```javascript
// backend/functions/health/index.js
exports.handler = async (event) => {
  return {
    statusCode: 200,
    body: JSON.stringify({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      version: '1.0.0'
    })
  };
};
```

## Exercise 2: Add Automated Backups

Create a Lambda function that backs up DynamoDB daily:

```javascript
// Use DynamoDB Streams or EventBridge schedule
// Export data to S3 daily
```

## Exercise 3: Set Up Monitoring Dashboard

Create a CloudWatch dashboard with:
- API request count
- Error rate
- Response time
- Active users

---

# Next Steps

1. ✅ Complete all exercises
2. ✅ Set up CI/CD pipeline
3. ✅ Add monitoring and alerts
4. ✅ Write tests for critical paths
5. ✅ Document your DevOps processes

---

# Resources

- **AWS Documentation:** https://docs.aws.amazon.com
- **Git Documentation:** https://git-scm.com/doc
- **GitHub Actions:** https://docs.github.com/en/actions
- **SAM Documentation:** https://docs.aws.amazon.com/serverless-application-model

---

**Happy Learning! 🚀**
