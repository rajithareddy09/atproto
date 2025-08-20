'use strict'

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PDS_PORT || 2583;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize PostgreSQL database
const pool = new Pool({
  user: process.env.POSTGRES_USER || 'atproto_user',
  host: process.env.POSTGRES_HOST || 'postgres',
  database: process.env.POSTGRES_DB || 'ozone',
  password: process.env.POSTGRES_PASSWORD || 'atproto_user',
  port: process.env.POSTGRES_PORT || 5432,
});

// Test database connection
pool.query('SELECT NOW()', (err, res) => {
  if (err) {
    console.error('Error connecting to PostgreSQL:', err.message);
  } else {
    console.log('Connected to PostgreSQL database');
  }
});

// Create tables if they don't exist
const createTables = async () => {
  try {
    // Users table
    await pool.query(`CREATE TABLE IF NOT EXISTS users (
      id SERIAL PRIMARY KEY,
      did TEXT UNIQUE NOT NULL,
      handle TEXT UNIQUE NOT NULL,
      email TEXT,
      password_hash TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )`);

    // Sessions table
    await pool.query(`CREATE TABLE IF NOT EXISTS sessions (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      token TEXT UNIQUE NOT NULL,
      expires_at TIMESTAMP NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Repositories table
    await pool.query(`CREATE TABLE IF NOT EXISTS repositories (
      id SERIAL PRIMARY KEY,
      user_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users (id)
    )`);

    // Records table
    await pool.query(`CREATE TABLE IF NOT EXISTS records (
      id SERIAL PRIMARY KEY,
      repo_id INTEGER NOT NULL,
      collection TEXT NOT NULL,
      rkey TEXT NOT NULL,
      data TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (repo_id) REFERENCES repositories (id),
      UNIQUE(repo_id, collection, rkey)
    )`);

    console.log('Database tables created successfully');
  } catch (error) {
    console.error('Error creating tables:', error.message);
  }
};

// Initialize tables
createTables();

// Helper function to generate DID
function generateDid(handle) {
  const timestamp = Date.now();
  const random = crypto.randomBytes(16).toString('hex');
  return `did:web:${handle}.sfproject.net:${timestamp}:${random}`;
}

// Helper function to authenticate JWT token
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, process.env.PDS_JWT_SECRET || 'your-secret-key', (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
}

// AT Protocol Endpoints

// 1. Server Description
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

// 2. Create Account
app.post('/xrpc/com.atproto.server.createAccount', async (req, res) => {
  try {
    const { email, password, handle } = req.body;

    if (!email || !password || !handle) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Check if handle already exists
    const { rows } = await pool.query('SELECT id FROM users WHERE handle = $1', [handle]);
    if (rows.length > 0) {
      return res.status(400).json({ error: 'Handle already taken' });
    }

    // Hash password
    const hash = await bcrypt.hash(password, 10);

    const did = generateDid(handle);

    // Insert user
    const { rows: userRows } = await pool.query(
      'INSERT INTO users (did, handle, email, password_hash) VALUES ($1, $2, $3, $4) RETURNING id',
      [did, handle, email, hash]
    );

    // Create default repository
    const repoData = JSON.stringify({
      did: did,
      handle: handle,
      collections: ['app.bsky.feed.post', 'app.bsky.graph.follow']
    });

    await pool.query(
      'INSERT INTO repositories (user_id, name, data) VALUES ($1, $2, $3)',
      [userRows[0].id, 'main', repoData]
    );

    res.json({
      did: did,
      handle: handle,
      accessJwt: jwt.sign({ userId: userRows[0].id, did, handle }, process.env.PDS_JWT_SECRET || 'your-secret-key', { expiresIn: '1h' }),
      refreshJwt: jwt.sign({ userId: userRows[0].id, did, handle }, process.env.PDS_JWT_SECRET || 'your-secret-key', { expiresIn: '7d' })
    });
  } catch (error) {
    console.error('Error creating account:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Create Session
app.post('/xrpc/com.atproto.server.createSession', async (req, res) => {
  try {
    const { identifier, password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find user by handle or email
    const { rows } = await pool.query('SELECT id, did, handle, password_hash FROM users WHERE handle = $1 OR email = $1', [identifier]);
    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = rows[0];

    // Verify password
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Create session
    const accessJwt = jwt.sign(
      { userId: user.id, did: user.did, handle: user.handle },
      process.env.PDS_JWT_SECRET || 'your-secret-key',
      { expiresIn: '1h' }
    );

    const refreshJwt = jwt.sign(
      { userId: user.id, did: user.did, handle: user.handle },
      process.env.PDS_JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );

    res.json({
      did: user.did,
      handle: user.handle,
      accessJwt,
      refreshJwt
    });
  } catch (error) {
    console.error('Error creating session:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Create Record
app.post('/xrpc/com.atproto.repo.createRecord', authenticateToken, async (req, res) => {
  try {
    const { repo, collection, rkey, record } = req.body;

    if (!repo || !collection || !rkey || !record) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find repository
    const { rows: repoRows } = await pool.query('SELECT id FROM repositories WHERE name = $1 AND user_id = $2', [repo, req.user.userId]);
    if (repoRows.length === 0) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    // Insert record
    await pool.query(
      'INSERT INTO records (repo_id, collection, rkey, data) VALUES ($1, $2, $3, $4)',
      [repoRows[0].id, collection, rkey, JSON.stringify(record)]
    );

    res.json({
      uri: `at://${req.user.did}/${collection}/${rkey}`,
      cid: crypto.randomBytes(16).toString('hex')
    });
  } catch (error) {
    console.error('Error creating record:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Get Record
app.get('/xrpc/com.atproto.repo.getRecord', async (req, res) => {
  try {
    const { uri } = req.query;

    if (!uri) {
      return res.status(400).json({ error: 'Missing URI parameter' });
    }

    // Parse URI: at://did/collection/rkey
    const uriParts = uri.replace('at://', '').split('/');
    if (uriParts.length !== 3) {
      return res.status(400).json({ error: 'Invalid URI format' });
    }

    const [did, collection, rkey] = uriParts;

    // Find user by DID
    const { rows: userRows } = await pool.query('SELECT id FROM users WHERE did = $1', [did]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Find repository
    const { rows: repoRows } = await pool.query('SELECT id FROM repositories WHERE user_id = $1 AND name = $2', [user.id, 'main']);
    if (repoRows.length === 0) {
      return res.status(404).json({ error: 'Repository not found' });
    }

    const repo = repoRows[0];

    // Find record
    const { rows: recordRows } = await pool.query('SELECT data FROM records WHERE repo_id = $1 AND collection = $2 AND rkey = $3', [repo.id, collection, rkey]);
    if (recordRows.length === 0) {
      return res.status(404).json({ error: 'Record not found' });
    }

    const record = recordRows[0];

    res.json({
      uri: uri,
      cid: crypto.randomBytes(16).toString('hex'),
      value: JSON.parse(record.data)
    });
  } catch (error) {
    console.error('Error getting record:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Sync Get Repo
app.get('/xrpc/com.atproto.sync.getRepo', async (req, res) => {
  try {
    const { did } = req.query;

    if (!did) {
      return res.status(400).json({ error: 'Missing DID parameter' });
    }

    // Find user by DID
    const { rows: userRows } = await pool.query('SELECT id FROM users WHERE did = $1', [did]);
    if (userRows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = userRows[0];

    // Get all records for the user's repository
    const { rows: records } = await pool.query(`
      SELECT r.collection, r.rkey, r.data
      FROM records r JOIN repositories repo ON r.repo_id = repo.id
      WHERE repo.user_id = $1
    `, [user.id]);

    const repo = {
      did: did,
      head: crypto.randomBytes(16).toString('hex'),
      rev: Date.now().toString(),
      records: records.map(r => ({
        collection: r.collection,
        rkey: r.rkey,
        value: JSON.parse(r.data)
      }))
    };

    res.json(repo);
  } catch (error) {
    console.error('Error getting repo:', error.message);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 7. Get Profile
app.get('/xrpc/app.bsky.actor.getProfile', (req, res) => {
  try {
    const { actor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock profile data
    const profile = {
      did: actor.startsWith('did:') ? actor : `did:web:${actor}.sfproject.net`,
      handle: actor.startsWith('did:') ? actor.split(':').pop() : actor,
      displayName: `User ${actor}`,
      description: 'A user on SF Project PDS',
      avatar: null,
      banner: null,
      followsCount: Math.floor(Math.random() * 100),
      followersCount: Math.floor(Math.random() * 100),
      postsCount: Math.floor(Math.random() * 50),
      indexedAt: new Date().toISOString()
    };

    res.json(profile);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 8. Get Follows
app.get('/xrpc/app.bsky.graph.getFollows', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock follows data
    const follows = {
      subject: {
        did: actor,
        handle: actor.split(':').pop() || actor
      },
      follows: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock follows
    for (let i = 0; i < Math.min(limit, 20); i++) {
      follows.follows.push({
        did: `did:web:user${i}.sfproject.net`,
        handle: `user${i}.sfproject.net`,
        displayName: `User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(follows);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 9. Get Followers
app.get('/xrpc/app.bsky.graph.getFollowers', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock followers data
    const followers = {
      subject: {
        did: actor,
        handle: actor.split(':').pop() || actor
      },
      followers: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock followers
    for (let i = 0; i < Math.min(limit, 20); i++) {
      followers.followers.push({
        did: `did:web:follower${i}.sfproject.net`,
        handle: `follower${i}.sfproject.net`,
        displayName: `Follower ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(followers);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 10. Get Posts
app.get('/xrpc/app.bsky.feed.getAuthorFeed', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock feed data
    const feed = {
      feed: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock posts
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

// 11. Get Post Thread
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
            did: uri.split('/')[2],
            handle: uri.split('/')[2].replace('did:web:', '')
          },
          record: {
            text: 'This is a mock post from SF Project PDS',
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

// 12. Get Suggestions
app.get('/xrpc/app.bsky.actor.getSuggestions', (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    
    // Mock suggestions data
    const suggestions = {
      actors: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock suggestions
    for (let i = 0; i < Math.min(limit, 20); i++) {
      suggestions.actors.push({
        did: `did:web:suggested${i}.sfproject.net`,
        handle: `suggested${i}.sfproject.net`,
        displayName: `Suggested User ${i}`,
        description: 'A suggested user to follow',
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 13. Search Users
app.get('/xrpc/app.bsky.actor.searchActors', (req, res) => {
  try {
    const { q, limit = 20, cursor } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    // Mock search results
    const results = {
      actors: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock search results
    for (let i = 0; i < Math.min(limit, 20); i++) {
      results.actors.push({
        did: `did:web:search${i}.sfproject.net`,
        handle: `search${i}.sfproject.net`,
        displayName: `Search Result ${i}`,
        description: `User matching "${q}"`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(results);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 14. Get Notifications
app.get('/xrpc/app.bsky.notification.listNotifications', (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    
    // Mock notifications data
    const notifications = {
      notifications: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock notifications
    for (let i = 0; i < Math.min(limit, 20); i++) {
      notifications.notifications.push({
        uri: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        cid: crypto.randomBytes(16).toString('hex'),
        author: {
          did: `did:web:user${i}.sfproject.net`,
          handle: `user${i}.sfproject.net`
        },
        reason: 'follow',
        reasonSubject: null,
        record: {
          text: 'Mock notification content'
        },
        isRead: false,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 15. Get Preferences
app.get('/xrpc/app.bsky.actor.getPreferences', (req, res) => {
  try {
    // Mock preferences data
    const preferences = {
      preferences: [
        {
          $type: 'app.bsky.actor.defs#adultContentPref',
          enabled: false
        },
        {
          $type: 'app.bsky.actor.defs#contentLabelPref',
          label: 'hide',
          visibility: 'hide'
        }
      ]
    };

    res.json(preferences);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'pds', timestamp: new Date().toISOString() });
});

// DID document endpoint
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

// Start server
app.listen(port, () => {
  console.log(`PDS server running on port ${port}`);
  console.log(`Database: PostgreSQL`);
  console.log(`DID endpoint: http://localhost:${port}/.well-known/did.json`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  pool.end();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  pool.end();
  process.exit(0);
});
