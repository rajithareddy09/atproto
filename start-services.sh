#!/bin/bash

# SF Project PDS Startup Script using dev-env (no Docker)
echo "🚀 Starting SF Project PDS using dev-env..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the atproto directory"
    exit 1
fi

# Check if pnpm is installed
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not installed. Please install it first:"
    echo "   npm install -g pnpm"
    exit 1
fi

# Install dependencies if needed
echo "📦 Installing dependencies..."
pnpm install

# Build the packages
echo "🔨 Building packages..."
pnpm build

# Start the development environment
echo "🌐 Starting development environment..."
echo ""
echo "📋 Available commands in the REPL:"
echo "   status()           - List active servers"
echo "   startPds(2583)     - Start PDS on port 2583"
echo "   startBsky(2584)    - Start Bsky AppView on port 2584"
echo "   startOzone(3000)   - Start Ozone on port 3000"
echo "   startPlc(2582)     - Start PLC on port 2582"
echo "   mkuser('test')     - Create a test user"
echo "   stop(port)         - Stop server on specific port"
echo ""
echo "💡 Example usage:"
echo "   startPds(2583)"
echo "   startBsky(2584)"
echo "   startOzone(3000)"
echo "   startPlc(2582)"
echo "   status()"
echo ""

# Start the dev-env REPL
cd packages/dev-env
pnpm start
