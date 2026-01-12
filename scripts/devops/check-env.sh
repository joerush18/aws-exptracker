#!/bin/bash

# DevOps Learning: Environment Check Script
# This script checks if all required DevOps tools are installed

echo "🔍 DevOps Environment Check"
echo "=========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to check command
check_command() {
    if command -v $1 &> /dev/null; then
        VERSION=$($1 --version 2>&1 | head -n 1)
        echo -e "${GREEN}✅ $1${NC}"
        echo "   Version: $VERSION"
        return 0
    else
        echo -e "${RED}❌ $1 is not installed${NC}"
        echo "   Install with: $2"
        return 1
    fi
}

# Check required tools
echo "Checking required tools..."
echo ""

MISSING=0

check_command "git" "brew install git" || MISSING=1
check_command "aws" "brew install awscli" || MISSING=1
check_command "sam" "brew install aws-sam-cli" || MISSING=1
check_command "node" "brew install node" || MISSING=1
check_command "docker" "brew install --cask docker" || MISSING=1

echo ""
echo "Checking optional tools..."
echo ""

check_command "pandoc" "brew install pandoc" || echo "   (Optional - for document conversion)"

echo ""
echo "Checking AWS configuration..."
if aws sts get-caller-identity &> /dev/null; then
    echo -e "${GREEN}✅ AWS credentials configured${NC}"
    aws sts get-caller-identity | grep -E "UserId|Account"
else
    echo -e "${RED}❌ AWS credentials not configured${NC}"
    echo "   Run: aws configure"
    MISSING=1
fi

echo ""
if [ $MISSING -eq 0 ]; then
    echo -e "${GREEN}🎉 All required tools are installed!${NC}"
    echo ""
    echo "You're ready to start learning DevOps!"
else
    echo -e "${YELLOW}⚠️  Some tools are missing. Please install them first.${NC}"
fi
