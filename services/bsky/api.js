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

// 5. Get Labeler Services
app.get('/xrpc/app.bsky.labeler.getServices', (req, res) => {
  try {
    // Handle multiple dids parameters (Express provides them as an array)
    const dids = Array.isArray(req.query.dids) ? req.query.dids : [req.query.dids];
    const detailed = req.query.detailed === 'true';

    if (!dids || dids.length === 0) {
      return res.status(400).json({ error: 'Missing dids parameter' });
    }

    // Filter out undefined values and create unique list
    const didList = [...new Set(dids.filter(did => did))];

    // Mock labeler services data
    const services = {
      views: didList.map(did => {
        const baseService = {
          uri: did,
          cid: crypto.randomBytes(16).toString('hex'),
          did: did,
          creator: did,
          displayName: 'SF Project Labeler',
          description: 'Content labeling service for SF Project',
          descriptionFacets: [],
          avi: null,
          labels: [],
          indexedAt: new Date().toISOString()
        };

        // Add detailed information if requested
        if (detailed) {
          baseService.labels = [
            {
              src: did,
              uri: `at://did:web:user.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
              cid: crypto.randomBytes(16).toString('hex'),
              val: 'porn',
              neg: false,
              cts: new Date().toISOString()
            },
            {
              src: did,
              uri: `at://did:web:user.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
              cid: crypto.randomBytes(16).toString('hex'),
              val: 'hate',
              neg: false,
              cts: new Date().toISOString()
            }
          ];
          baseService.descriptionFacets = [
            {
              features: [
                {
                  $type: 'app.bsky.richtext.facet#link',
                  uri: 'https://sfproject.net/labels'
                }
              ]
            }
          ];
        }

        return baseService;
      })
    };

    res.json(services);
  } catch (error) {
    console.error('Error in labeler getServices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 6. Get Post Thread
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

// 7. Get Actor Profile
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
      description: 'A user on SF Project Bsky',
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

// 8. Search Actors
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

// 9. Get Feed (Feed Generator)
app.get('/xrpc/app.bsky.feed.getFeed', (req, res) => {
  try {
    const { feed, limit = 30, cursor } = req.query;

    if (!feed) {
      return res.status(400).json({ error: 'Missing feed parameter' });
    }

    // Parse feed URI to determine feed type
    const feedUri = feed;
    let feedName = 'Custom Feed';
    
    if (feedUri.includes('whats-hot')) {
      feedName = 'What\'s Hot';
    } else if (feedUri.includes('following')) {
      feedName = 'Following';
    } else if (feedUri.includes('trending')) {
      feedName = 'Trending';
    }

    // Mock feed data
    const feedData = {
      feed: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock posts for the feed
    for (let i = 0; i < Math.min(limit, 30); i++) {
      feedData.feed.push({
        post: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        reply: null,
        repost: null,
        like: null,
        feedContext: {
          feed: feedUri,
          feedName: feedName
        },
        indexedAt: new Date().toISOString()
      });
    }

    res.json(feedData);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 10. Get Notifications
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

// 11. Get Preferences
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

// 12. Get Follows
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

// 13. Get Followers
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

// 14. Get Unspecced Config
app.get('/xrpc/app.bsky.unspecced.getConfig', (req, res) => {
  try {
    // Mock unspecced configuration data
    const config = {
      feeds: {
        'whats-hot': {
          uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
          cid: crypto.randomBytes(16).toString('hex'),
          did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
          creator: 'did:plc:z72i7hdynmk6r22z27h6tvur',
          displayName: 'What\'s Hot',
          description: 'Popular posts from the network',
          descriptionFacets: [],
          avatar: null,
          likeCount: Math.floor(Math.random() * 1000),
          viewer: null,
          indexedAt: new Date().toISOString()
        },
        'following': {
          uri: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/following',
          cid: crypto.randomBytes(16).toString('hex'),
          did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
          creator: 'did:plc:z72i7hdynmk6r22z27h6tvur',
          displayName: 'Following',
          description: 'Posts from people you follow',
          descriptionFacets: [],
          avatar: null,
          likeCount: Math.floor(Math.random() * 1000),
          viewer: null,
          indexedAt: new Date().toISOString()
        }
      },
      labels: {
        enabled: true,
        providers: ['did:web:labeler.sfproject.net']
      },
      moderation: {
        enabled: true,
        providers: ['did:web:ozone.sfproject.net']
      },
      features: {
        'com.atproto.labeler.defs#selfLabels': true,
        'com.atproto.unspecced.defs#taggedSuggestions': true,
        'app.bsky.actor.defs#adultContentPref': true,
        'app.bsky.actor.defs#contentLabelPref': true
      }
    };

    res.json(config);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 15. Get Tagged Suggestions
app.get('/xrpc/com.atproto.unspecced.getTaggedSuggestions', (req, res) => {
  try {
    // Mock tagged suggestions data
    const suggestions = {
      suggestions: [
        {
          tag: 'tech',
          subjectType: 'com.atproto.unspecced.defs#suggestionSubject',
          subject: 'did:web:tech.sfproject.net'
        },
        {
          tag: 'news',
          subjectType: 'com.atproto.unspecced.defs#suggestionSubject',
          subject: 'did:web:news.sfproject.net'
        },
        {
          tag: 'sports',
          subjectType: 'com.atproto.unspecced.defs#suggestionSubject',
          subject: 'did:web:sports.sfproject.net'
        }
      ]
    };

    res.json(suggestions);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 16. Get Suggested Follows
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

// 17. Get Popular Feed Generators
app.get('/xrpc/app.bsky.unspecced.getPopularFeedGenerators', (req, res) => {
  try {
    const { limit = 10, cursor } = req.query;
    
    // Mock popular feed generators data
    const feedGenerators = {
      feeds: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock popular feed generators
    const popularFeeds = [
      {
        name: 'whats-hot',
        displayName: 'What\'s Hot',
        description: 'Popular posts from the network',
        descriptionFacets: []
      },
      {
        name: 'following',
        displayName: 'Following',
        description: 'Posts from people you follow',
        descriptionFacets: []
      },
      {
        name: 'trending',
        displayName: 'Trending',
        description: 'Trending topics and posts',
        descriptionFacets: []
      },
      {
        name: 'tech-news',
        displayName: 'Tech News',
        description: 'Latest technology news and updates',
        descriptionFacets: []
      },
      {
        name: 'sports',
        displayName: 'Sports',
        description: 'Sports news and updates',
        descriptionFacets: []
      }
    ];

    // Limit the number of feeds returned
    const limitedFeeds = popularFeeds.slice(0, Math.min(limit, popularFeeds.length));

    feedGenerators.feeds = limitedFeeds.map((feed, index) => ({
      uri: `at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/${feed.name}`,
      cid: crypto.randomBytes(16).toString('hex'),
      did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
      creator: 'did:plc:z72i7hdynmk6r22z27h6tvur',
      displayName: feed.displayName,
      description: feed.description,
      descriptionFacets: feed.descriptionFacets,
      avatar: null,
      likeCount: Math.floor(Math.random() * 1000) + 100,
      viewer: null,
      indexedAt: new Date().toISOString()
    }));

    res.json(feedGenerators);
  } catch (error) {
    console.error('Error in getPopularFeedGenerators:', error);
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
