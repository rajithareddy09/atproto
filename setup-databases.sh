#!/bin/bash

# Database Setup Script for SF Project PDS
# This script sets up PostgreSQL databases manually

echo "Setting up databases for SF Project PDS..."

# Check if PostgreSQL is installed
if ! command -v psql &> /dev/null; then
    echo "PostgreSQL is not installed. Please install it first:"
    echo "Ubuntu/Debian: sudo apt install postgresql postgresql-contrib"
    echo "CentOS/RHEL: sudo yum install postgresql postgresql-server"
    echo "macOS: brew install postgresql"
    exit 1
fi

# Check if PostgreSQL is running
if ! pg_isready -q; then
    echo "PostgreSQL is not running. Please start it first:"
    echo "Ubuntu/Debian: sudo systemctl start postgresql"
    echo "CentOS/RHEL: sudo systemctl start postgresql"
    echo "macOS: brew services start postgresql"
    exit 1
fi

# Create databases and user
echo "Creating databases and user..."

# Create user (you'll be prompted for password)
sudo -u postgres createuser --interactive atproto_user

# Create databases
sudo -u postgres createdb ozone
sudo -u postgres createdb plc

# Grant privileges
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ozone TO atproto_user;"
sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE plc TO atproto_user;"

# Create schemas
sudo -u postgres psql -d ozone -c "CREATE SCHEMA IF NOT EXISTS ozone;"
sudo -u postgres psql -d ozone -c "GRANT ALL PRIVILEGES ON SCHEMA ozone TO atproto_user;"

sudo -u postgres psql -d plc -c "CREATE SCHEMA IF NOT EXISTS plc;"
sudo -u postgres psql -d plc -c "GRANT ALL PRIVILEGES ON SCHEMA plc TO atproto_user;"

echo "Database setup complete!"
echo ""
echo "Next steps:"
echo "1. Update the database connection strings in your .env files"
echo "2. Update the database passwords in your .env files"
echo "3. Run the services"
