#!/bin/bash

echo "🚀 Setting up PocketBase for Groupifi Us..."
echo ""

# Check if PocketBase binary exists
if [ ! -f "./pocketbase" ]; then
    echo "❌ PocketBase binary not found. Please run the download script first."
    exit 1
fi

# Start PocketBase in background
echo "📡 Starting PocketBase server..."
./pocketbase serve --http=127.0.0.1:8090 &
POCKETBASE_PID=$!

# Wait for server to start
echo "⏳ Waiting for PocketBase to start..."
sleep 3

# Check if server is running
if curl -s http://127.0.0.1:8090/api/health > /dev/null; then
    echo "✅ PocketBase server is running"
else
    echo "❌ Failed to start PocketBase server"
    kill $POCKETBASE_PID 2>/dev/null
    exit 1
fi

echo ""
echo "🔧 Manual Setup Required:"
echo ""
echo "1. Open your browser and go to: http://127.0.0.1:8090/_/"
echo "2. Create an admin account with these credentials:"
echo "   Email: admin@groupifi.us"
echo "   Password: admin123456"
echo ""
echo "3. After creating the admin account, press Enter to continue..."
read -p "Press Enter when admin account is created..."

echo ""
echo "📦 Setting up collections automatically..."

# Run the collection setup script
if node setup-collections.js; then
    echo ""
    echo "🎉 PocketBase setup complete!"
    echo ""
    echo "✅ What was configured:"
    echo "   - PocketBase server running on http://127.0.0.1:8090"
    echo "   - Admin account: admin@groupifi.us"
    echo "   - Collections: saved_groups, constraints, grouping_sessions"
    echo "   - User permissions and validation rules"
    echo "   - Environment variables updated"
    echo ""
    echo "📝 Next steps:"
    echo "   1. Keep PocketBase running during development"
    echo "   2. Update frontend code to use PocketBase SDK"
    echo "   3. Test authentication and data operations"
    echo ""
    echo "🔧 PocketBase Admin Panel: http://127.0.0.1:8090/_/"
    echo "📊 API Health Check: http://127.0.0.1:8090/api/health"
else
    echo ""
    echo "❌ Collection setup failed. Please check the error messages above."
    echo "You can try running 'node setup-collections.js' manually."
fi

echo ""
echo "PocketBase is running in the background (PID: $POCKETBASE_PID)"
echo "To stop PocketBase, run: kill $POCKETBASE_PID"
echo "Or use: pkill -f pocketbase"