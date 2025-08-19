const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PLC_PORT || 2582;

// Middleware
app.use(cors());
app.use(express.json());

// Basic PLC endpoints
app.get('/.well-known/did.json', (req, res) => {
  res.json({
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: process.env.PLC_SERVER_DID || 'did:web:plc.sfproject.net',
    verificationMethod: [
      {
        id: `${process.env.PLC_SERVER_DID || 'did:web:plc.sfproject.net'}#key-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: process.env.PLC_SERVER_DID || 'did:web:plc.sfproject.net',
        publicKeyHex: process.env.PLC_SIGNING_KEY_HEX || '0000000000000000000000000000000000000000000000000000000000000000'
      }
    ],
    service: [
      {
        id: '#plc',
        type: 'PersonalLifecycleController',
        serviceEndpoint: process.env.PLC_PUBLIC_URL || 'https://plc.sfproject.net'
      }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'plc', timestamp: new Date().toISOString() });
});

// Basic DID operations endpoint
app.post('/xrpc/com.atproto.identity.submitPlcOperation', (req, res) => {
  // This is a simplified implementation
  // In production, you'd want proper DID operation handling
  res.json({
    operation: {
      did: req.body.did,
      operation: req.body.operation,
      timestamp: new Date().toISOString()
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`PLC server running on port ${port}`);
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
