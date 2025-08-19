/* eslint-env node */

'use strict'

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PDS_PORT || 2583;

// Middleware
app.use(cors());
app.use(express.json());

// Basic PDS endpoints
app.get('/.well-known/did.json', (req, res) => {
  res.json({
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: process.env.PDS_SERVICE_DID || 'did:web:pdsapi.sfproject.net',
    verificationMethod: [
      {
        id: `${process.env.PDS_SERVICE_DID || 'did:web:pdsapi.sfproject.net'}#key-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: process.env.PDS_SERVICE_DID || 'did:web:pdsapi.sfproject.net',
        publicKeyHex: process.env.PDS_REPO_SIGNING_KEY_K256_PRIVATE_KEY_HEX || '0000000000000000000000000000000000000000000000000000000000000000'
      }
    ],
    service: [
      {
        id: '#pds',
        type: 'AtprotoPersonalDataServer',
        serviceEndpoint: process.env.PDS_PUBLIC_URL || 'https://pdsapi.sfproject.net'
      }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pds', timestamp: new Date().toISOString() });
});

// Basic XRPC endpoint
app.get('/xrpc/com.atproto.server.describeServer', (req, res) => {
  res.json({
    did: process.env.PDS_SERVICE_DID || 'did:web:pdsapi.sfproject.net',
    version: '0.0.1',
    availableUserDomains: ['.sfproject.net'],
    links: {
      privacyPolicy: 'https://sfproject.net/privacy',
      termsOfService: 'https://sfproject.net/terms'
    }
  });
});

// Start server
app.listen(port, () => {
  console.log(`PDS server running on port ${port}`);
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
