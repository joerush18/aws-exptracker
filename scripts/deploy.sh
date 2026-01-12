#!/bin/bash

# Deployment script for Expense Tracker
# Usage: ./scripts/deploy.sh

set -e

echo "🚀 Starting Expense Tracker Deployment..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command -v aws &> /dev/null; then
    echo -e "${RED}❌ AWS CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v sam &> /dev/null; then
    echo -e "${RED}❌ SAM CLI not found. Please install it first.${NC}"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js not found. Please install it first.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Prerequisites met${NC}"

# Get AWS region
AWS_REGION=${AWS_REGION:-$(aws configure get region)}
if [ -z "$AWS_REGION" ]; then
    AWS_REGION="ap-southeast-2"
    echo -e "${YELLOW}⚠ No AWS region configured, using default: ${AWS_REGION}${NC}"
fi

# Deploy backend
echo -e "\n${BLUE}Deploying backend infrastructure...${NC}"
cd backend

# Check if samconfig.toml exists
if [ ! -f "samconfig.toml" ]; then
    echo -e "${YELLOW}⚠ samconfig.toml not found. Running guided deployment...${NC}"
    sam build
    sam deploy --guided --region "$AWS_REGION"
else
    echo -e "${BLUE}Building SAM application...${NC}"
    sam build
    
    echo -e "${BLUE}Deploying SAM application...${NC}"
    DEPLOY_OUTPUT=$(sam deploy --no-confirm-changeset --region "$AWS_REGION" 2>&1 | tee /tmp/sam-deploy.log)
    DEPLOY_EXIT_CODE=${PIPESTATUS[0]}
    
    if [ $DEPLOY_EXIT_CODE -eq 0 ]; then
        echo -e "${GREEN}✓ Backend deployed${NC}"
    else
        # Check if it's just "no changes" which is fine
        if grep -q "No changes to deploy" /tmp/sam-deploy.log 2>/dev/null; then
            echo -e "${GREEN}✓ Backend already up to date${NC}"
        else
            echo -e "${RED}❌ Backend deployment failed${NC}"
            exit 1
        fi
    fi
fi

# Get stack name from samconfig or use default
STACK_NAME=$(grep -E "^stack_name\s*=" samconfig.toml 2>/dev/null | cut -d'"' -f2 || echo "expense-tracker")

if [ -z "$STACK_NAME" ] || [ "$STACK_NAME" == "expense-tracker" ]; then
    # Try to find the actual stack name
    STACK_NAME=$(aws cloudformation describe-stacks --region "$AWS_REGION" --query "Stacks[?contains(StackName, 'expense-tracker')].StackName" --output text | head -n 1)
fi

if [ -z "$STACK_NAME" ]; then
    echo -e "${RED}❌ Could not find stack name${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Using stack: $STACK_NAME${NC}"

# Get stack outputs
echo -e "\n${BLUE}Retrieving stack outputs...${NC}"
API_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='ApiGatewayUrl'].OutputValue" --output text 2>/dev/null || echo "")
S3_BUCKET=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='S3BucketName'].OutputValue" --output text 2>/dev/null || echo "")
CLOUDFRONT_URL=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontUrl'].OutputValue" --output text 2>/dev/null || echo "")
# Try to get CloudFront distribution ID from outputs or by querying distributions
CLOUDFRONT_DIST_ID=$(aws cloudformation describe-stacks --stack-name "$STACK_NAME" --region "$AWS_REGION" --query "Stacks[0].Outputs[?OutputKey=='CloudFrontDistributionId'].OutputValue" --output text 2>/dev/null || echo "")

# If not in outputs, try to find it by S3 bucket
if [ -z "$CLOUDFRONT_DIST_ID" ] && [ ! -z "$S3_BUCKET" ]; then
    CLOUDFRONT_DIST_ID=$(aws cloudfront list-distributions --region "$AWS_REGION" --query "DistributionList.Items[?contains(Origins.Items[0].DomainName, '$S3_BUCKET')].Id" --output text 2>/dev/null | head -n 1 || echo "")
fi

if [ -z "$API_URL" ]; then
    echo -e "${RED}❌ Could not retrieve API URL from stack outputs${NC}"
    exit 1
fi

if [ -z "$S3_BUCKET" ]; then
    echo -e "${RED}❌ Could not retrieve S3 bucket name from stack outputs${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Stack outputs retrieved${NC}"
echo "  API URL: $API_URL"
echo "  S3 Bucket: $S3_BUCKET"
if [ ! -z "$CLOUDFRONT_URL" ]; then
    echo "  CloudFront URL: $CLOUDFRONT_URL"
fi

# Configure frontend
echo -e "\n${BLUE}Configuring frontend...${NC}"
cd ../frontend

# Create .env.local file for Vite
cat > .env.local << EOF
VITE_API_URL=$API_URL
EOF

echo -e "${GREEN}✓ Frontend configured (.env.local created)${NC}"

# Build frontend
echo -e "\n${BLUE}Building frontend...${NC}"
if [ ! -d "node_modules" ]; then
    echo -e "${BLUE}Installing frontend dependencies...${NC}"
    npm install
fi

echo -e "${BLUE}Building frontend with Vite...${NC}"
npm run build

if [ ! -d "build" ]; then
    echo -e "${RED}❌ Build directory not found. Build may have failed.${NC}"
    exit 1
fi

echo -e "${GREEN}✓ Frontend built${NC}"

# Deploy frontend to S3
echo -e "\n${BLUE}Deploying frontend to S3...${NC}"
aws s3 sync build/ s3://$S3_BUCKET/ --delete --region "$AWS_REGION"

echo -e "${GREEN}✓ Frontend deployed to S3${NC}"

# Invalidate CloudFront cache if distribution ID is available
if [ ! -z "$CLOUDFRONT_DIST_ID" ]; then
    echo -e "\n${BLUE}Invalidating CloudFront cache...${NC}"
    INVALIDATION_ID=$(aws cloudfront create-invalidation \
        --distribution-id "$CLOUDFRONT_DIST_ID" \
        --paths "/*" \
        --region "$AWS_REGION" \
        --query 'Invalidation.Id' \
        --output text 2>/dev/null || echo "")
    
    if [ ! -z "$INVALIDATION_ID" ]; then
        echo -e "${GREEN}✓ Cache invalidation created (ID: $INVALIDATION_ID)${NC}"
        echo -e "${YELLOW}  Note: Cache invalidation may take a few minutes to complete${NC}"
    else
        echo -e "${YELLOW}⚠ Could not create cache invalidation${NC}"
    fi
else
    echo -e "${YELLOW}⚠ CloudFront distribution ID not found, skipping cache invalidation${NC}"
fi

# Summary
echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo ""
echo -e "${BLUE}Application URLs:${NC}"
if [ ! -z "$CLOUDFRONT_URL" ]; then
    echo -e "  Frontend: ${GREEN}https://$CLOUDFRONT_URL${NC}"
else
    echo -e "  Frontend: ${YELLOW}Check CloudFront console for URL${NC}"
fi
echo -e "  API: ${GREEN}$API_URL${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo "  1. Wait 1-2 minutes for CloudFront cache to clear (if invalidated)"
echo "  2. Visit the frontend URL above"
echo "  3. Sign up for a new account or login"
echo ""
echo -e "${YELLOW}Note: To subscribe to SNS email alerts:${NC}"
echo "  aws sns list-topics --region $AWS_REGION"
echo "  aws sns subscribe --topic-arn <TopicARN> --protocol email --notification-endpoint your-email@example.com --region $AWS_REGION"
