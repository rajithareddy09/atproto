'use strict'

const express = require('express');
const cors = require('cors');
const sqlite3 = require('sqlite3').verbose();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const path = require('path');

const app = express();
const port = process.env.PDS_PORT || 2583;

// Middleware
app.use(cors());
app.use(express.json());

// Initialize SQLite database
const dbPath = path.join(process.env.PDS_DATA_DIR || '/app/data', 'pds.db');
const dbDir = path.dirname(dbPath);

// Ensure data directory exists
try {
  if (!require('fs').existsSync(dbDir)) {
    require('fs').mkdirSync(dbDir, { recursive: true });
  }
} catch (error) {
  console.warn('Warning: Could not create data directory:', error.message);
}

let db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
    // Try to create the database in a fallback location
    const fallbackPath = '/tmp/pds.db';
    console.log(`Trying fallback database path: ${fallbackPath}`);
    db = new sqlite3.Database(fallbackPath);
  } else {
    console.log('Connected to SQLite database:', dbPath);
  }
});

// Create tables if they don't exist
db.serialize(() => {
  // Users table
  db.run(`CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    did TEXT UNIQUE NOT NULL,
    handle TEXT UNIQUE NOT NULL,
    email TEXT,
    password_hash TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);

  // Sessions table
  db.run(`CREATE TABLE IF NOT EXISTS sessions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    token TEXT UNIQUE NOT NULL,
    expires_at DATETIME NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Repositories table
  db.run(`CREATE TABLE IF NOT EXISTS repositories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )`);

  // Records table
  db.run(`CREATE TABLE IF NOT EXISTS records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    repo_id INTEGER NOT NULL,
    collection TEXT NOT NULL,
    rkey TEXT NOT NULL,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (repo_id) REFERENCES repositories (id),
    UNIQUE(repo_id, collection, rkey)
  )`);
});

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
    db.get('SELECT id FROM users WHERE handle = ?', [handle], (err, row) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (row) {
        return res.status(400).json({ error: 'Handle already taken' });
      }

      // Hash password
      bcrypt.hash(password, 10, (err, hash) => {
        if (err) {
          return res.status(500).json({ error: 'Password hashing failed' });
        }

        const did = generateDid(handle);

        // Insert user
        db.run(
          'INSERT INTO users (did, handle, email, password_hash) VALUES (?, ?, ?, ?)',
          [did, handle, email, hash],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create account' });
            }

            // Create default repository
            const repoData = JSON.stringify({
              did: did,
              handle: handle,
              collections: ['app.bsky.feed.post', 'app.bsky.graph.follow']
            });

            db.run(
              'INSERT INTO repositories (user_id, name, data) VALUES (?, ?, ?)',
              [this.lastID, 'main', repoData],
              function(err) {
                if (err) {
                  console.error('Failed to create repository:', err);
                }
              }
            );

            res.json({
              did: did,
              handle: handle,
              accessJwt: jwt.sign({ userId: this.lastID, did, handle }, process.env.PDS_JWT_SECRET || 'your-secret-key', { expiresIn: '1h' }),
              refreshJwt: jwt.sign({ userId: this.lastID, did, handle }, process.env.PDS_JWT_SECRET || 'your-secret-key', { expiresIn: '7d' })
            });
          }
        );
      });
    });
  } catch (error) {
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
    db.get('SELECT id, did, handle, password_hash FROM users WHERE handle = ? OR email = ?',
      [identifier, identifier],
      (err, user) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!user) {
          return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        bcrypt.compare(password, user.password_hash, (err, isValid) => {
          if (err || !isValid) {
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
        });
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Create Record
app.post('/xrpc/com.atproto.repo.createRecord', authenticateToken, (req, res) => {
  try {
    const { repo, collection, rkey, record } = req.body;

    if (!repo || !collection || !rkey || !record) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Find repository
    db.get('SELECT id FROM repositories WHERE name = ? AND user_id = ?',
      [repo, req.user.userId],
      (err, repoRow) => {
        if (err) {
          return res.status(500).json({ error: 'Database error' });
        }
        if (!repoRow) {
          return res.status(404).json({ error: 'Repository not found' });
        }

        // Insert record
        db.run(
          'INSERT INTO records (repo_id, collection, rkey, data) VALUES (?, ?, ?, ?)',
          [repoRow.id, collection, rkey, JSON.stringify(record)],
          function(err) {
            if (err) {
              return res.status(500).json({ error: 'Failed to create record' });
            }

            res.json({
              uri: `at://${req.user.did}/${collection}/${rkey}`,
              cid: crypto.randomBytes(16).toString('hex')
            });
          }
        );
      }
    );
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 5. Get Record
app.get('/xrpc/com.atproto.repo.getRecord', (req, res) => {
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
    db.get('SELECT id FROM users WHERE did = ?', [did], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Find repository
      db.get('SELECT id FROM repositories WHERE user_id = ? AND name = ?',
        [user.id, 'main'],
        (err, repo) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }
          if (!repo) {
            return res.status(404).json({ error: 'Repository not found' });
          }

          // Find record
          db.get('SELECT data FROM records WHERE repo_id = ? AND collection = ? AND rkey = ?',
            [repo.id, collection, rkey],
            (err, record) => {
              if (err) {
                return res.status(500).json({ error: 'Database error' });
              }
              if (!record) {
                return res.status(404).json({ error: 'Record not found' });
              }

              res.json({
                uri: uri,
                cid: crypto.randomBytes(16).toString('hex'),
                value: JSON.parse(record.data)
              });
            }
          );
        }
      );
    });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Sync Get Repo
app.get('/xrpc/com.atproto.sync.getRepo', (req, res) => {
  try {
    const { did } = req.query;

    if (!did) {
      return res.status(400).json({ error: 'Missing DID parameter' });
    }

    // Find user by DID
    db.get('SELECT id FROM users WHERE did = ?', [did], (err, user) => {
      if (err) {
        return res.status(500).json({ error: 'Database error' });
      }
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Get all records for the user's repository
      db.all('SELECT r.collection, r.rkey, r.data FROM records r JOIN repositories repo ON r.repo_id = repo.id WHERE repo.user_id = ?',
        [user.id],
        (err, records) => {
          if (err) {
            return res.status(500).json({ error: 'Database error' });
          }

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
        }
      );
    });
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
  console.log(`Database: ${dbPath}`);
  console.log(`DID endpoint: http://localhost:${port}/.well-known/did.json`);
  console.log(`Health check: http://localhost:${port}/health`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, shutting down gracefully');
  db.close();
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received, shutting down gracefully');
  db.close();
  process.exit(0);
});
