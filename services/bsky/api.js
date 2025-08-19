/* eslint-env node */
/* eslint-disable import/order */

'use strict'

const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.BSKY_PORT || 2584;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Bsky AppView endpoints
app.get('/.well-known/did.json', (req, res) => {
  res.json({
    '@context': ['https://www.w3.org/ns/did/v1'],
    id: process.env.BSKY_SERVER_DID || 'did:web:bsky.sfproject.net',
    verificationMethod: [
      {
        id: `${process.env.BSKY_SERVER_DID || 'did:web:bsky.sfproject.net'}#key-1`,
        type: 'EcdsaSecp256k1VerificationKey2019',
        controller: process.env.BSKY_SERVER_DID || 'did:web:bsky.sfproject.net',
        publicKeyHex: process.env.BSKY_SERVICE_SIGNING_KEY || '0000000000000000000000000000000000000000000000000000000000000000'
      }
    ],
    service: [
      {
        id: '#bsky',
        type: 'BskyAppView',
        serviceEndpoint: process.env.BSKY_PUBLIC_URL || 'https://bsky.sfproject.net'
      }
    ]
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bsky', timestamp: new Date().toISOString() });
});

// Basic XRPC endpoint
app.get('/xrpc/com.atproto.server.describeServer', (req, res) => {
  res.json({
    did: process.env.BSKY_SERVER_DID || 'did:web:bsky.sfproject.net',
    version: '0.0.1',
    availableUserDomains: ['.sfproject.net'],
    links: {
      privacyPolicy: 'https://sfproject.net/privacy',
      termsOfService: 'https://sfproject.net/terms'
    }
  });
});

// Feed endpoint
app.get('/xrpc/app.bsky.feed.getTimeline', (req, res) => {
  res.json({
    feed: [],
    cursor: null
  });
});

// Start server
app.listen(port, () => {
  console.log(`Bsky AppView server running on port ${port}`);
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
