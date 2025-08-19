-- Database Setup for SF Project PDS
-- This script creates the required PostgreSQL databases and users

-- Create databases
CREATE DATABASE ozone;
CREATE DATABASE plc;

-- Create user for AT Protocol services
CREATE USER atproto_user WITH PASSWORD 'atproto_user';

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE ozone TO atproto_user;
GRANT ALL PRIVILEGES ON DATABASE plc TO atproto_user;

-- Connect to ozone database and create schema
\c ozone;
CREATE SCHEMA IF NOT EXISTS ozone;
GRANT ALL PRIVILEGES ON SCHEMA ozone TO atproto_user;

-- Connect to plc database and create schema
\c plc;
CREATE SCHEMA IF NOT EXISTS plc;
GRANT ALL PRIVILEGES ON SCHEMA plc TO atproto_user;

-- Grant additional privileges
GRANT CREATE ON DATABASE ozone TO atproto_user;
GRANT CREATE ON DATABASE plc TO atproto_user;
