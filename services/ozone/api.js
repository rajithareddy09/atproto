'use strict'

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const port = process.env.OZONE_PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Mock admin users (in production, this would come from environment variables)
const ADMIN_USERS = [
  {
    did: process.env.OZONE_ADMIN_DIDS?.split(',')[0] || 'did:web:admin.sfproject.net',
    password: process.env.OZONE_ADMIN_PASSWORD || 'admin123'
  }
];

// Helper function to authenticate admin
function authenticateAdmin(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, process.env.OZONE_SIGNING_KEY_HEX || 'admin-secret-key');
    const adminUser = ADMIN_USERS.find(u => u.did === decoded.did);

    if (!adminUser) {
      return res.status(403).json({ error: 'Admin access required' });
    }

    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
}

// AT Protocol Endpoints

// 1. Server Description
app.get('/xrpc/com.atproto.server.describeServer', (req, res) => {
  res.json({
    did: process.env.OZONE_SERVER_DID || 'did:web:ozone.sfproject.net',
    version: '0.0.1',
    availableUserDomains: ['.sfproject.net'],
    links: {
      privacyPolicy: 'https://sfproject.net/privacy',
      termsOfService: 'https://sfproject.net/terms'
    }
  });
});

// 2. Admin Login
app.post('/xrpc/com.atproto.server.createSession', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find admin user
    const adminUser = ADMIN_USERS.find(u => u.did === identifier);
    if (!adminUser) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValid = await bcrypt.compare(password, adminUser.password);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const accessJwt = jwt.sign(
      { did: adminUser.did, role: 'admin' },
      process.env.OZONE_SIGNING_KEY_HEX || 'admin-secret-key',
      { expiresIn: '1h' }
    );

    const refreshJwt = jwt.sign(
      { did: adminUser.did, role: 'admin' },
      process.env.OZONE_SIGNING_KEY_HEX || 'admin-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      did: adminUser.did,
      handle: 'admin.sfproject.net',
      accessJwt,
      refreshJwt
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get Moderation Reports
app.get('/xrpc/com.atproto.moderation.queryReports', authenticateAdmin, (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;

    // Mock reports data
    const reports = {
      reports: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock reports
    for (let i = 0; i < Math.min(limit, 20); i++) {
      reports.reports.push({
        id: crypto.randomBytes(16).toString('hex'),
        reasonType: 'spam',
        reason: 'User reported for spam',
        reportedBy: `did:web:user${i}.sfproject.net`,
        createdAt: new Date().toISOString(),
        resolvedByActionIds: []
      });
    }

    res.json(reports);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Get Moderation Actions
app.get('/xrpc/com.atproto.moderation.queryActions', authenticateAdmin, (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;

    // Mock actions data
    const actions = {
      actions: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock actions
    for (let i = 0; i < Math.min(limit, 20); i++) {
      actions.actions.push({
        id: crypto.randomBytes(16).toString('hex'),
        action: 'flag',
        subject: `did:web:user${i}.sfproject.net`,
        subjectBlobCids: [],
        reason: 'Content flagged for review',
        createdBy: req.admin.did,
        createdAt: new Date().toISOString(),
        resolvedReports: []
      });
    }

    res.json(actions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Create Moderation Action
app.post('/xrpc/com.atproto.moderation.emitEvent', authenticateAdmin, (req, res) => {
  try {
    const { event } = req.body;

    if (!event) {
      return res.status(400).json({ error: 'Missing event parameter' });
    }

    // Mock event creation
    const eventId = crypto.randomBytes(16).toString('hex');

    res.json({
      id: eventId,
      createdAt: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'ozone', timestamp: new Date().toISOString() });
});

// DID document endpoint
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
        type: 'AtprotoModeration',
        serviceEndpoint: process.env.OZONE_PUBLIC_URL || 'https://ozone.sfproject.net'
      }
    ]
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
