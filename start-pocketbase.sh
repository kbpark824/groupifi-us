#!/bin/bash

# Start PocketBase server for Groupifi Us
echo "🚀 Starting PocketBase server..."

# Check if PocketBase binary exists
if [ ! -f "./bin/pocketbase" ]; then
    echo "❌ PocketBase binary not found at ./bin/pocketbase"
    echo "Please download PocketBase from https://pocketbase.io/docs/"
    exit 1
fi

# Make sure the binary is executable
chmod +x ./bin/pocketbase

# Start PocketBase server
echo "📡 PocketBase will be available at:"
echo "   Admin UI: http://127.0.0.1:8090/_/"
echo "   API: http://127.0.0.1:8090/api/"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

./bin/pocketbase serve --http=127.0.0.1:8090