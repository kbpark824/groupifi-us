#!/bin/bash

# Deployment Verification Script
# Verifies that both development and production environments are properly configured

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
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

print_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

echo -e "${BLUE}🔍 Groupifi Us Deployment Verification${NC}"
echo "========================================"

# Check GitHub repository configuration
echo -e "\n${YELLOW}Checking GitHub Repository Configuration${NC}"
echo "-----------------------------------------------"

# Check if we're in a git repository
if git rev-parse --git-dir > /dev/null 2>&1; then
    print_status "Git repository detected"
    
    # Check current branch
    CURRENT_BRANCH=$(git branch --show-current)
    print_info "Current branch: $CURRENT_BRANCH"
    
    # Check if there are uncommitted changes
    if git diff-index --quiet HEAD --; then
        print_status "No uncommitted changes"
    else
        print_warning "There are uncommitted changes"
    fi
    
    # Check remote origin
    if git remote get-url origin > /dev/null 2>&1; then
        REMOTE_URL=$(git remote get-url origin)
        print_info "Remote origin: $REMOTE_URL"
    else
        print_warning "No remote origin configured"
    fi
else
    print_error "Not in a git repository"
fi

# Check GitHub Actions workflows
echo -e "\n${YELLOW}Checking GitHub Actions Workflows${NC}"
echo "-----------------------------------"

if [ -f ".github/workflows/deploy-development.yml" ]; then
    print_status "Development deployment workflow exists"
    
    # Check if workflow has required triggers
    if grep -q "push:" ".github/workflows/deploy-development.yml" && grep -q "branches: \[ main \]" ".github/workflows/deploy-development.yml"; then
        print_status "Development workflow has correct triggers (push to main)"
    else
        print_warning "Development workflow may not have correct triggers"
    fi
else
    print_error "Development deployment workflow missing"
fi

if [ -f ".github/workflows/deploy-production.yml" ]; then
    print_status "Production deployment workflow exists"
    
    # Check if workflow has manual trigger
    if grep -q "workflow_dispatch:" ".github/workflows/deploy-production.yml"; then
        print_status "Production workflow has manual trigger"
    else
        print_warning "Production workflow may not have manual trigger"
    fi
else
    print_error "Production deployment workflow missing"
fi

# Check Render configuration
echo -e "\n${YELLOW}Checking Render Configuration${NC}"
echo "----------------------------------"

if [ -f "render.yaml" ]; then
    print_status "Render configuration file exists"
    
    # Check for both services
    if grep -q "groupifi-us-dev" "render.yaml"; then
        print_status "Development service configured in render.yaml"
    else
        print_warning "Development service not found in render.yaml"
    fi
    
    if grep -q "groupifi-us-prod" "render.yaml"; then
        print_status "Production service configured in render.yaml"
    else
        print_warning "Production service not found in render.yaml"
    fi
    
    # Check domains
    if grep -q "groupifi-dev.onrender.com" "render.yaml"; then
        print_status "Development domain configured"
    else
        print_warning "Development domain not configured"
    fi
    
    if grep -q "groupifi.us" "render.yaml"; then
        print_status "Production domain configured"
    else
        print_warning "Production domain not configured"
    fi
else
    print_error "Render configuration file missing"
fi

# Check environment files
echo -e "\n${YELLOW}Checking Environment Configuration${NC}"
echo "-----------------------------------"

for env_file in ".env.development" ".env.production" ".env.example"; do
    if [ -f "$env_file" ]; then
        print_status "$env_file exists"
        
        # Check for required variables
        if grep -q "VITE_POCKETBASE_URL" "$env_file"; then
            print_status "$env_file has VITE_POCKETBASE_URL"
        else
            print_warning "$env_file missing VITE_POCKETBASE_URL"
        fi
    else
        print_warning "$env_file missing"
    fi
done

# Check health endpoint
echo -e "\n${YELLOW}Checking Health Endpoint${NC}"
echo "-------------------------"

if [ -f "public/health" ]; then
    print_status "Health endpoint file exists"
    HEALTH_CONTENT=$(cat public/health)
    if [ "$HEALTH_CONTENT" = "OK" ]; then
        print_status "Health endpoint returns correct content: $HEALTH_CONTENT"
    else
        print_warning "Health endpoint content may be incorrect: $HEALTH_CONTENT"
    fi
else
    print_error "Health endpoint file missing"
fi

# Test environment accessibility
echo -e "\n${YELLOW}Testing Environment Accessibility${NC}"
echo "----------------------------------"

DEV_URL="https://groupifi-dev.onrender.com"
PROD_URL="https://groupifi.us"

echo "Testing development environment ($DEV_URL)..."
if curl -f -s --max-time 10 "${DEV_URL}/health" > /dev/null 2>&1; then
    print_status "Development environment is accessible"
    
    # Test if it returns OK
    RESPONSE=$(curl -s --max-time 10 "${DEV_URL}/health")
    if [ "$RESPONSE" = "OK" ]; then
        print_status "Development health check returns OK"
    else
        print_warning "Development health check returns: $RESPONSE"
    fi
else
    print_warning "Development environment not accessible (may not be deployed yet)"
fi

echo "Testing production environment ($PROD_URL)..."
if curl -f -s --max-time 10 "${PROD_URL}/health" > /dev/null 2>&1; then
    print_status "Production environment is accessible"
    
    # Test if it returns OK
    RESPONSE=$(curl -s --max-time 10 "${PROD_URL}/health")
    if [ "$RESPONSE" = "OK" ]; then
        print_status "Production health check returns OK"
    else
        print_warning "Production health check returns: $RESPONSE"
    fi
else
    print_warning "Production environment not accessible (may not be deployed yet)"
fi

# Check package.json scripts
echo -e "\n${YELLOW}Checking Package.json Scripts${NC}"
echo "-------------------------------"

if [ -f "package.json" ]; then
    print_status "package.json exists"
    
    # Check for required scripts
    for script in "build" "dev" "preview" "test"; do
        if grep -q "\"$script\":" "package.json"; then
            print_status "Script '$script' is defined"
        else
            print_warning "Script '$script' is missing"
        fi
    done
else
    print_error "package.json missing"
fi

# Summary
echo -e "\n${BLUE}📋 Deployment Readiness Summary${NC}"
echo "================================="

echo ""
echo "✅ Required for deployment:"
echo "   - GitHub repository with workflows"
echo "   - Render configuration (render.yaml)"
echo "   - Environment files"
echo "   - Health endpoint"
echo "   - Build scripts"
echo ""
echo "🔧 Next steps if environments are not accessible:"
echo "   1. Push to main branch to trigger development deployment"
echo "   2. Configure GitHub repository secrets:"
echo "      - RENDER_DEPLOY_HOOK_DEV"
echo "      - RENDER_DEPLOY_HOOK_PROD"
echo "      - DEV_URL"
echo "   3. Set up Render services with environment variables"
echo "   4. Use GitHub Actions to deploy to production"
echo "   5. Set up UptimeRobot monitoring"
echo ""
echo "📚 For detailed instructions, see:"
echo "   - DEPLOYMENT_SETUP.md"
echo "   - UPTIMEROBOT_SETUP.md"