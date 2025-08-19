#!/bin/bash

# SF Project PDS Startup Script with Environment Variables
echo "🚀 Starting SF Project PDS with proper environment configuration..."

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ Please run this script from the atproto directory"
    exit 1
fi

# Load nvm and set Node.js version
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"

# Use Node.js 18
nvm use 18

# Check if pnpm is available
if ! command -v pnpm &> /dev/null; then
    echo "❌ pnpm is not found in PATH. Trying to find it..."
    
    # Look for pnpm in common locations
    PNPM_PATH=$(find ~/.nvm/versions/node -name "pnpm" 2>/dev/null | head -1)
    
    if [ -n "$PNPM_PATH" ]; then
        echo "✅ Found pnpm at: $PNPM_PATH"
        export PATH="$(dirname $PNPM_PATH):$PATH"
    else
        echo "❌ pnpm not found. Please install it:"
        echo "   npm install -g pnpm"
        exit 1
    fi
fi

echo "✅ Using pnpm: $(which pnpm)"
echo "✅ Using Node.js: $(node --version)"

# Install dependencies if needed
echo "📦 Installing dependencies..."
pnpm install

# Build the packages
echo "🔨 Building packages..."
pnpm build

# Load environment variables
echo "🔧 Loading environment configuration..."
export $(cat packages/pds/sfproject.env | xargs)
export $(cat services/bsky/sfproject.env | xargs)
export $(cat packages/ozone/sfproject.env | xargs)
export $(cat services/plc/sfproject.env | xargs)

# Start the development environment
echo "🌐 Starting development environment with SF Project configuration..."
echo ""
echo "📋 Environment loaded:"
echo "   PDS_HOSTNAME: $PDS_HOSTNAME"
echo "   BSKY_PUBLIC_URL: $BSKY_PUBLIC_URL"
echo "   PDS_SERVICE_DID: $PDS_SERVICE_DID"
echo "   BSKY_SERVER_DID: $BSKY_SERVER_DID"
echo ""
echo "💡 In the REPL, start services with:"
echo "   startPds(2583)"
echo "   startBsky(2584)"
echo "   startOzone(3000)"
echo "   startPlc(2582)"
echo "   status()"
echo ""

# Start the dev-env REPL with environment variables
cd packages/dev-env
PDS_HOSTNAME="$PDS_HOSTNAME" \
BSKY_PUBLIC_URL="$BSKY_PUBLIC_URL" \
PDS_SERVICE_DID="$PDS_SERVICE_DID" \
BSKY_SERVER_DID="$BSKY_SERVER_DID" \
pnpm start
