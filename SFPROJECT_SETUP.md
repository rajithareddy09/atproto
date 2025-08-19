# SF Project PDS Setup Guide

This guide will help you set up your own PDS (Personal Data Server) with the following domains:

- **PDS**: `pdsapi.sfproject.net`
- **AppView**: `bsky.sfproject.net`
- **Ozone**: `ozone.sfproject.net`
- **PLC**: `plc.sfproject.net`

## Prerequisites

1. **Domain Configuration**: Ensure all domains point to your server
2. **SSL Certificates**: Set up SSL certificates for all domains
3. **Server Requirements**:
   - Node.js 18+
   - PostgreSQL (for Ozone and PLC)
   - Sufficient storage for blobs and databases

## Step 1: Generate Secure Keys

Before starting, you need to generate secure cryptographic keys. You can use this Node.js script:

```javascript
const crypto = require('crypto');

// Generate 64-character hex strings for private keys
const repoSigningKey = crypto.randomBytes(32).toString('hex');
const plcRotationKey = crypto.randomBytes(32).toString('hex');
const dpopSecret = crypto.randomBytes(32).toString('hex');

// Generate JWT secret
const jwtSecret = crypto.randomBytes(32).toString('hex');

console.log('PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX:', repoSigningKey);
console.log('PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX:', plcRotationKey);
console.log('PDS_DPOP_SECRET:', dpopSecret);
console.log('PDS_JWT_SECRET:', jwtSecret);
```

## Step 2: Configure Environment Files

### PDS Configuration (`packages/pds/sfproject.env`)

Update the following values in your PDS environment file:

```env
# Replace these placeholder values with your generated keys
PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX="your-actual-64-char-hex-key"
PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX="your-actual-64-char-hex-key"
PDS_DPOP_SECRET="your-actual-32-random-bytes-hex-encoded"
PDS_JWT_SECRET="your-actual-jwt-secret"
PDS_ADMIN_PASSWORD="your-secure-admin-password"
```

### Ozone Configuration (`packages/ozone/sfproject.env`)

Update the database connection and admin settings:

```env
# Update database connection
OZONE_DB_POSTGRES_URL="postgresql://your-username:your-password@localhost:5432/ozone"

# Update admin DIDs (replace with actual DIDs)
OZONE_ADMIN_DIDS="did:web:your-admin-did"
OZONE_MODERATOR_DIDS="did:web:your-moderator-did"
OZONE_TRIAGE_DIDS="did:web:your-triage-did"
OZONE_ADMIN_PASSWORD="your-secure-admin-password"
OZONE_SIGNING_KEY_HEX="your-64-char-hex-signing-key"
```

### Bsky AppView Configuration (`services/bsky/sfproject.env`)

Update the service signing key and admin passwords:

```env
# Generate a did:key for service signing
BSKY_SERVICE_SIGNING_KEY="did:key:your-actual-service-signing-key"
BSKY_ADMIN_PASSWORDS="your-secure-admin-password-1,your-secure-admin-password-2"
```

### PLC Configuration (`services/plc/sfproject.env`)

Update the database connection and admin settings:

```env
# Update database connection
PLC_DB_POSTGRES_URL="postgresql://your-username:your-password@localhost:5432/plc"

# Update admin settings
PLC_ADMIN_PASSWORD="your-secure-admin-password"
PLC_SIGNING_KEY_HEX="your-64-char-hex-signing-key"
```

## Step 3: Database Setup

### Create PostgreSQL Databases

```sql
-- Create databases
CREATE DATABASE ozone;
CREATE DATABASE plc;

-- Create user (if needed)
CREATE USER atproto_user WITH PASSWORD 'your-secure-password';
GRANT ALL PRIVILEGES ON DATABASE ozone TO atproto_user;
GRANT ALL PRIVILEGES ON DATABASE plc TO atproto_user;
```

## Step 4: DNS Configuration

Ensure your DNS records point to your server:

```
pdsapi.sfproject.net    A    YOUR_SERVER_IP
bsky.sfproject.net      A    YOUR_SERVER_IP
ozone.sfproject.net     A    YOUR_SERVER_IP
plc.sfproject.net       A    YOUR_SERVER_IP
```

## Step 5: SSL Certificate Setup

Set up SSL certificates for all domains. You can use Let's Encrypt:

```bash
# Install certbot
sudo apt install certbot

# Get certificates for all domains
sudo certbot certonly --standalone -d pdsapi.sfproject.net
sudo certbot certonly --standalone -d bsky.sfproject.net
sudo certbot certonly --standalone -d ozone.sfproject.net
sudo certbot certonly --standalone -d plc.sfproject.net
```

## Step 6: Firewall Configuration

Open the necessary ports on your server:

```bash
# Open ports for each service
sudo ufw allow 2583  # PDS
sudo ufw allow 2584  # Bsky AppView
sudo ufw allow 3000  # Ozone
sudo ufw allow 2582  # PLC
sudo ufw allow 80    # HTTP (for SSL)
sudo ufw allow 443   # HTTPS
```

## Step 7: Service Deployment

### Using Docker (Recommended)

Create a `docker-compose.yml` file:

```yaml
version: '3.8'

services:
  pds:
    build: ./packages/pds
    ports:
      - "2583:2583"
    env_file:
      - ./packages/pds/sfproject.env
    volumes:
      - ./data:/app/data
      - ./blobs:/app/blobs

  bsky:
    build: ./services/bsky
    ports:
      - "2584:2584"
    env_file:
      - ./services/bsky/sfproject.env

  ozone:
    build: ./packages/ozone
    ports:
      - "3000:3000"
    env_file:
      - ./packages/ozone/sfproject.env
    depends_on:
      - postgres

  plc:
    build: ./services/plc
    ports:
      - "2582:2582"
    env_file:
      - ./services/plc/sfproject.env
    depends_on:
      - postgres

  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: your-secure-password
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### Manual Deployment

1. **Install dependencies**:
   ```bash
   pnpm install
   ```

2. **Build services**:
   ```bash
   pnpm build
   ```

3. **Start services** (in separate terminals):
   ```bash
   # PDS
   cd packages/pds
   pnpm start

   # Bsky AppView
   cd services/bsky
   node api.js

   # Ozone
   cd packages/ozone
   pnpm start

   # PLC
   cd services/plc
   node api.js
   ```

## Step 8: Verification

Test your setup by visiting:

- PDS: `https://pdsapi.sfproject.net`
- AppView: `https://bsky.sfproject.net`
- Ozone: `https://ozone.sfproject.net`
- PLC: `https://plc.sfproject.net`

## Step 9: Client Configuration

Users can connect to your PDS using:

- **Official Bluesky App**: Add your PDS URL in settings
- **Third-party clients**: Configure to use `https://pdsapi.sfproject.net`
- **Handle registration**: Users can register handles ending with `.sfproject.net`

## Security Considerations

1. **Change all default passwords**
2. **Use strong, unique keys for each service**
3. **Regularly update SSL certificates**
4. **Monitor logs for suspicious activity**
5. **Backup databases regularly**
6. **Use firewall rules to restrict access**

## Troubleshooting

### Common Issues

1. **SSL Certificate Errors**: Ensure certificates are valid and properly configured
2. **Database Connection Errors**: Verify PostgreSQL is running and credentials are correct
3. **Port Conflicts**: Ensure no other services are using the required ports
4. **DNS Resolution**: Verify all domains resolve to your server IP

### Logs

Check service logs for errors:
```bash
# PDS logs
tail -f packages/pds/logs/pds.log

# Ozone logs
tail -f packages/ozone/logs/ozone.log
```

## Support

For issues specific to your setup, check:
- [AT Protocol Documentation](https://atproto.com/docs)
- [Bluesky Community](https://bsky.app)
- [GitHub Issues](https://github.com/bluesky-social/atproto/issues)
