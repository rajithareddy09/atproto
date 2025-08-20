/* eslint-env node */
/* eslint-disable import/order */

'use strict'

const express = require('express');
const cors = require('cors');
const crypto = require('crypto');

const app = express();
const port = process.env.BSKY_PORT || 2584;

// Middleware
app.use(cors());
app.use(express.json());

// AT Protocol Endpoints

// 1. Server Description
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

// 2. Feed Timeline
app.get('/xrpc/app.bsky.feed.getTimeline', (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;

    // Mock timeline data
    const timeline = {
      feed: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock posts
    for (let i = 0; i < Math.min(limit, 20); i++) {
      timeline.feed.push({
        post: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        reply: null,
        repost: null,
        like: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(timeline);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Get Post Thread
app.get('/xrpc/app.bsky.feed.getPostThread', (req, res) => {
  try {
    const { uri } = req.query;

    if (!uri) {
      return res.status(400).json({ error: 'Missing URI parameter' });
    }

    // Mock thread data
    const thread = {
      thread: {
        post: {
          uri: uri,
          cid: crypto.randomBytes(16).toString('hex'),
          author: {
            did: 'did:web:user.sfproject.net',
            handle: 'user.sfproject.net'
          },
          record: {
            text: 'This is a mock post from the Bsky AppView service',
            createdAt: new Date().toISOString()
          },
          indexedAt: new Date().toISOString()
        },
        replies: []
      }
    };

    res.json(thread);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Get Author Feed
app.get('/xrpc/app.bsky.feed.getAuthorFeed', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;

    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock author feed
    const feed = {
      feed: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock posts for the author
    for (let i = 0; i < Math.min(limit, 20); i++) {
      feed.feed.push({
        post: `at://${actor}/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        reply: null,
        repost: null,
        like: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(feed);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'bsky', timestamp: new Date().toISOString() });
});

// AT Protocol health check endpoint (what the social app expects)
app.get('/xrpc/_health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'bsky', 
    timestamp: new Date().toISOString(),
    version: '0.0.1'
  });
});

// DID document endpoint
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
        type: 'AtprotoAppView',
        serviceEndpoint: process.env.BSKY_PUBLIC_URL || 'https://bsky.sfproject.net'
      }
    ]
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
