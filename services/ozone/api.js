const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.OZONE_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Ozone endpoints
app.get('/.well-known/did.json', (req, res) => {
  res.json({
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: process.env.OZONE_SERVER_DID || 'did:web:ozone.sfproject.net',
    verificationMethod: [
      {
        id: `${process.env.OZONE_SERVER_DID || 'did:web:ozone.sfproject.net'}#key-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: process.env.OZONE_SERVER_DID || 'did:web:ozone.sfproject.net',
        publicKeyHex: process.env.OZONE_SIGNING_KEY_HEX || '0000000000000000000000000000000000000000000000000000000000000000'
      }
    ],
    service: [
      {
        id: '#ozone',
        type: 'OzoneModerationService',
        serviceEndpoint: process.env.OZONE_PUBLIC_URL || 'https://ozone.sfproject.net'
      }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ozone', timestamp: new Date().toISOString() });
});

// Basic moderation endpoints
app.get('/xrpc/com.atproto.moderation.getModerationActions', (req, res) => {
  res.json({
    actions: [],
    cursor: null
  });
});

app.get('/xrpc/com.atproto.moderation.getModerationReports', (req, res) => {
  res.json({
    reports: [],
    cursor: null
  });
});

// Admin endpoints
app.post('/xrpc/com.atproto.admin.takeModerationAction', (req, res) => {
  res.json({
    action: {
      id: 'action-' + Date.now(),
      action: req.body.action,
      subject: req.body.subject,
      createdAt: new Date().toISOString()
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`Ozone moderation server running on port ${port}`);
  console.log(`DID endpoint: http://localhost:${port}/.well-known/did.json`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  process.exit(0);
});
