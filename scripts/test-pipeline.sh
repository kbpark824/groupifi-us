#!/bin/bash

# Test CI/CD Pipeline Script
# This script helps test the complete GitHub Flow pipeline

set -e

echo "🚀 Testing Groupifi Us CI/CD Pipeline"
echo "======================================"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Test 1: Local build and tests
echo -e "\n${YELLOW}Step 1: Running local tests and build${NC}"
echo "----------------------------------------"

echo "Checking TypeScript compilation..."
if npm run type-check; then
    print_status "TypeScript type checking passed"
else
    print_warning "TypeScript type checking has issues (continuing for deployment test)"
fi

echo "Running unit tests..."
if npm run test; then
    print_status "Unit tests passed"
else
    print_warning "Unit tests have issues (continuing for deployment test)"
fi

echo "Testing production build..."
if npm run build; then
    print_status "Production build successful"
else
    print_error "Production build failed - this will block deployment"
    exit 1
fi

# Test 2: Check environment configuration
echo -e "\n${YELLOW}Step 2: Checking environment configuration${NC}"
echo "-------------------------------------------"

if [ -f ".env.development" ]; then
    print_status "Development environment file exists"
else
    print_warning "Development environment file missing"
fi

if [ -f ".env.production" ]; then
    print_status "Production environment file exists"
else
    print_warning "Production environment file missing"
fi

if [ -f "render.yaml" ]; then
    print_status "Render configuration file exists"
else
    print_error "Render configuration file missing"
    exit 1
fi

# Test 3: Check GitHub Actions workflows
echo -e "\n${YELLOW}Step 3: Checking GitHub Actions workflows${NC}"
echo "------------------------------------------"

if [ -f ".github/workflows/deploy-development.yml" ]; then
    print_status "Development deployment workflow exists"
else
    print_error "Development deployment workflow missing"
    exit 1
fi

if [ -f ".github/workflows/deploy-production.yml" ]; then
    print_status "Production deployment workflow exists"
else
    print_error "Production deployment workflow missing"
    exit 1
fi

# Test 4: Check health endpoint
echo -e "\n${YELLOW}Step 4: Checking health endpoint${NC}"
echo "-----------------------------------"

if [ -f "public/health" ]; then
    print_status "Health endpoint file exists"
    echo "Content: $(cat public/health)"
else
    print_error "Health endpoint file missing"
    exit 1
fi

# Test 5: Environment URLs (if accessible)
echo -e "\n${YELLOW}Step 5: Testing environment accessibility${NC}"
echo "----------------------------------------"

DEV_URL="https://groupifi-dev.onrender.com"
PROD_URL="https://groupifi.us"

echo "Testing development environment..."
if curl -f -s "${DEV_URL}/health" > /dev/null 2>&1; then
    print_status "Development environment is accessible"
else
    print_warning "Development environment not accessible (may not be deployed yet)"
fi

echo "Testing production environment..."
if curl -f -s "${PROD_URL}/health" > /dev/null 2>&1; then
    print_status "Production environment is accessible"
else
    print_warning "Production environment not accessible (may not be deployed yet)"
fi

echo -e "\n${GREEN}🎉 Pipeline test completed!${NC}"
echo "================================"
echo ""
echo "Next steps:"
echo "1. Push to main branch to trigger development deployment"
echo "2. Use GitHub Actions to manually deploy to production"
echo "3. Set up UptimeRobot monitoring for both environments"
echo "4. Configure custom domain SSL certificates"
echo ""
echo "For detailed setup instructions, see DEPLOYMENT_SETUP.md"