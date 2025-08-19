'use strict'

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');

const app = express();
const port = process.env.PLC_PORT || 2582;

// Middleware
app.use(cors());
app.use(express.json());

// Mock DID operations storage (in production, this would be a database)
const didOperations = new Map();

// AT Protocol Endpoints

// 1. Server Description
app.get('/xrpc/com.atproto.server.describeServer', (req, res) => {
  res.json({
    did: process.env.PLC_SERVER_DID || 'did:web:plc.sfproject.net',
    version: '0.0.1',
    availableUserDomains: ['.sfproject.net'],
    links: {
      privacyPolicy: 'https://sfproject.net/privacy',
      termsOfService: 'https://sfproject.net/terms'
    }
  });
});

// 2. Submit PLC Operation
app.post('/xrpc/com.atproto.identity.submitPlcOperation', (req, res) => {
  try {
    const { operation } = req.body;

    if (!operation) {
      return res.status(400).json({ error: 'Missing operation parameter' });
    }

    // Validate operation structure
    if (!operation.type || !operation.did) {
      return res.status(400).json({ error: 'Invalid operation structure' });
    }

    // Generate operation ID
    const operationId = crypto.randomBytes(16).toString('hex');

    // Store operation
    didOperations.set(operationId, {
      ...operation,
      id: operationId,
      createdAt: new Date().toISOString(),
      status: 'pending'
    });

    res.json({
      operationId: operationId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get PLC Operation
app.get('/xrpc/com.atproto.identity.getPlcOperation', (req, res) => {
  try {
    const { operationId } = req.query;

    if (!operationId) {
      return res.status(400).json({ error: 'Missing operationId parameter' });
    }

    const operation = didOperations.get(operationId);
    if (!operation) {
      return res.status(404).json({ error: 'Operation not found' });
    }

    res.json(operation);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Resolve DID
app.get('/xrpc/com.atproto.identity.resolveHandle', (req, res) => {
  try {
    const { handle } = req.query;

    if (!handle) {
      return res.status(400).json({ error: 'Missing handle parameter' });
    }

    // Mock DID resolution
    const did = `did:web:${handle}.sfproject.net`;

    res.json({
      did: did,
      handle: handle
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Update Handle
app.post('/xrpc/com.atproto.identity.updateHandle', (req, res) => {
  try {
    const { handle } = req.body;

    if (!handle) {
      return res.status(400).json({ error: 'Missing handle parameter' });
    }

    // Mock handle update
    const operationId = crypto.randomBytes(16).toString('hex');

    didOperations.set(operationId, {
      type: 'update_handle',
      did: `did:web:${handle}.sfproject.net`,
      handle: handle,
      id: operationId,
      createdAt: new Date().toISOString(),
      status: 'completed'
    });

    res.json({
      operationId: operationId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'plc', timestamp: new Date().toISOString() });
});

// DID document endpoint
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
        type: 'AtprotoPersonalLifecycle',
        serviceEndpoint: process.env.PLC_PUBLIC_URL || 'https://plc.sfproject.net'
      }
    ]
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
