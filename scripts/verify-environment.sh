#!/bin/bash

# Environment Verification Script for Groupifi Us
# This script verifies that environment variables are properly configured

echo "🔍 Verifying Environment Configuration..."
echo "================================================"

# Check if required environment files exist
echo "📁 Checking environment files..."
if [ -f ".env.example" ]; then
    echo "✅ .env.example exists"
else
    echo "❌ .env.example missing"
    exit 1
fi

if [ -f ".env.development" ]; then
    echo "✅ .env.development exists"
else
    echo "❌ .env.development missing"
    exit 1
fi

if [ -f ".env.production" ]; then
    echo "✅ .env.production exists"
else
    echo "❌ .env.production missing"
    exit 1
fi

# Check package.json for correct dependencies
echo ""
echo "📦 Checking dependencies..."
if grep -q '"pocketbase"' package.json; then
    echo "✅ PocketBase dependency found"
else
    echo "❌ PocketBase dependency missing"
    exit 1
fi

if grep -q '@supabase' package.json; then
    echo "❌ Supabase dependencies still present"
    exit 1
else
    echo "✅ No Supabase dependencies found"
fi

# Check build scripts
echo ""
echo "🔧 Checking build scripts..."
if grep -q '"build:dev"' package.json; then
    echo "✅ Development build script exists"
else
    echo "❌ Development build script missing"
    exit 1
fi

if grep -q '"build:prod"' package.json; then
    echo "✅ Production build script exists"
else
    echo "❌ Production build script missing"
    exit 1
fi

# Test environment-specific builds
echo ""
echo "🏗️  Testing environment-specific builds..."

echo "Testing development build..."
if npm run build:dev > /dev/null 2>&1; then
    echo "✅ Development build successful"
else
    echo "❌ Development build failed"
    exit 1
fi

echo "Testing production build..."
if npm run build:prod > /dev/null 2>&1; then
    echo "✅ Production build successful"
else
    echo "❌ Production build failed"
    exit 1
fi

# Clean up temporary files
rm -f .env.local

# Test TypeScript compilation
echo ""
echo "🔍 Testing TypeScript compilation..."
if npm run type-check > /dev/null 2>&1; then
    echo "✅ TypeScript compilation successful"
else
    echo "❌ TypeScript compilation failed"
    exit 1
fi

# Test unit tests
echo ""
echo "🧪 Running tests..."
if npm run test > /dev/null 2>&1; then
    echo "✅ All tests passing"
else
    echo "❌ Tests failing"
    exit 1
fi

echo ""
echo "🎉 Environment configuration verification complete!"
echo "✅ All checks passed - ready for deployment"