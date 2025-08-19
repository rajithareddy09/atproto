const crypto = require('crypto');

console.log('🔐 Generating Secure Keys for SF Project PDS');
console.log('=============================================\n');

// Generate 64-character hex strings for private keys (256-bit)
const repoSigningKey = crypto.randomBytes(32).toString('hex');
const plcRotationKey = crypto.randomBytes(32).toString('hex');
const dpopSecret = crypto.randomBytes(32).toString('hex');

// Generate JWT secret (32 bytes)
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Generate admin passwords (32 characters)
const adminPassword = crypto.randomBytes(16).toString('hex');
const ozoneAdminPassword = crypto.randomBytes(16).toString('hex');
const plcAdminPassword = crypto.randomBytes(16).toString('hex');

// Generate signing keys for services (64 characters)
const ozoneSigningKey = crypto.randomBytes(32).toString('hex');
const plcSigningKey = crypto.randomBytes(32).toString('hex');

// Generate service signing key (did:key format)
const serviceSigningKeyBytes = crypto.randomBytes(32);
const serviceSigningKeyMultibase = 'z' + serviceSigningKeyBytes.toString('base58btc');
const serviceSigningKey = `did:key:${serviceSigningKeyMultibase}`;

console.log('📋 PDS Keys:');
console.log('-------------');
console.log(`PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX="${repoSigningKey}"`);
console.log(`PDS_PLC_ROTATION_KEY_K256_PRIVATE_KEY_HEX="${plcRotationKey}"`);
console.log(`PDS_DPOP_SECRET="${dpopSecret}"`);
console.log(`PDS_JWT_SECRET="${jwtSecret}"`);
console.log(`PDS_ADMIN_PASSWORD="${adminPassword}"`);

console.log('\n📋 Ozone Keys:');
console.log('---------------');
console.log(`OZONE_SIGNING_KEY_HEX="${ozoneSigningKey}"`);
console.log(`OZONE_ADMIN_PASSWORD="${ozoneAdminPassword}"`);

console.log('\n📋 PLC Keys:');
console.log('-------------');
console.log(`PLC_SIGNING_KEY_HEX="${plcSigningKey}"`);
console.log(`PLC_ADMIN_PASSWORD="${plcAdminPassword}"`);

console.log('\n📋 Bsky AppView Keys:');
console.log('---------------------');
console.log(`BSKY_SERVICE_SIGNING_KEY="${serviceSigningKey}"`);
console.log(`BSKY_ADMIN_PASSWORDS="${adminPassword},${ozoneAdminPassword}"`);

console.log('\n📋 Admin DIDs (you need to create these):');
console.log('------------------------------------------');
console.log('OZONE_ADMIN_DIDS="did:web:your-admin-did"');
console.log('OZONE_MODERATOR_DIDS="did:web:your-moderator-did"');
console.log('OZONE_TRIAGE_DIDS="did:web:your-triage-did"');

console.log('\n⚠️  IMPORTANT SECURITY NOTES:');
console.log('============================');
console.log('1. Store these keys securely - never commit them to version control');
console.log('2. Use different keys for each environment (dev, staging, production)');
console.log('3. Keep backups of your keys in a secure location');
console.log('4. Rotate keys regularly in production');
console.log('5. Use strong, unique passwords for admin accounts');

console.log('\n📝 Next Steps:');
console.log('===============');
console.log('1. Copy these keys to your environment files');
console.log('2. Replace placeholder values in:');
console.log('   - packages/pds/sfproject.env');
console.log('   - packages/ozone/sfproject.env');
console.log('   - services/bsky/sfproject.env');
console.log('   - services/plc/sfproject.env');
console.log('3. Create admin DIDs and update the admin DID lists');
console.log('4. Start your services with: docker-compose up -d');
