#!/bin/bash

# SF Project PDS Startup Script
echo "🚀 Starting SF Project PDS..."

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "❌ Docker Compose is not installed. Please install Docker Compose first."
    exit 1
fi

# Check if the environment files exist
if [ ! -f "packages/pds/sfproject.env" ]; then
    echo "❌ PDS environment file not found: packages/pds/sfproject.env"
    exit 1
fi

if [ ! -f "packages/ozone/sfproject.env" ]; then
    echo "❌ Ozone environment file not found: packages/ozone/sfproject.env"
    exit 1
fi

if [ ! -f "services/bsky/sfproject.env" ]; then
    echo "❌ Bsky environment file not found: services/bsky/sfproject.env"
    exit 1
fi

if [ ! -f "services/plc/sfproject.env" ]; then
    echo "❌ PLC environment file not found: services/plc/sfproject.env"
    exit 1
fi

echo "✅ Environment files found"

# Create data directories
echo "📁 Creating data directories..."
mkdir -p data blobs

# Start the services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to start
echo "⏳ Waiting for services to start..."
sleep 10

# Check service status
echo "🔍 Checking service status..."
docker-compose ps

echo ""
echo "🎉 SF Project PDS is starting up!"
echo ""
echo "📋 Service URLs:"
echo "   PDS:     https://pdsapi.sfproject.net"
echo "   AppView: https://bsky.sfproject.net"
echo "   Ozone:   https://ozone.sfproject.net"
echo "   PLC:     https://plc.sfproject.net"
echo ""
echo "📊 View logs: docker-compose logs -f"
echo "🛑 Stop services: docker-compose down"
echo ""
echo "⚠️  Remember to:"
echo "   1. Update your DNS records to point to your server"
echo "   2. Set up SSL certificates for all domains"
echo "   3. Generate secure keys and update the environment files"
echo "   4. Configure your firewall to allow ports 2582-2584 and 3000"
