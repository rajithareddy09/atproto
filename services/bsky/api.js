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

/*
 * COMPREHENSIVE AT PROTOCOL ENDPOINTS IMPLEMENTATION
 * 
 * This service implements 50+ AT Protocol endpoints covering:
 * 
 * FEEDS & CONTENT:
 * - getTimeline, getFeed, getPostThread, getAuthorFeed
 * - getLikes, getReposts, searchPosts
 * - getFeedGenerator, getPopularFeedGenerators, getFeedGeneratorRoutes
 * 
 * ACTORS & PROFILES:
 * - getProfile, searchActors, getActorStatus
 * - getActorFeeds, getActorLikes, getActorReposts
 * - getTypeahead, searchActorsTypeahead
 * 
 * SOCIAL GRAPH:
 * - getFollows, getFollowers, getLists, getList
 * - getBlocks, getMutes, getMuteLists
 * - getSuggestedFollowsByActor
 * 
 * NOTIFICATIONS & PREFERENCES:
 * - listNotifications, getPreferences
 * 
 * LABELS & MODERATION:
 * - getLabelerServices, queryLabels
 * - getReport, getReports
 * 
 * REPOSITORY & SYNC:
 * - getRepo, getRecord, getRepoStatus
 * - getStatus, notifyOfUpdate
 * 
 * IDENTITY & SESSIONS:
 * - resolveHandle, updateHandle
 * - getSession, refreshSession
 * 
 * CONFIGURATION:
 * - getConfig, getTaggedSuggestions, getSuggestions
 * 
 * All endpoints return realistic mock data and include proper error handling.
 */

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

// 18. Get Feed Generator
app.get('/xrpc/app.bsky.feed.getFeedGenerator', (req, res) => {
  try {
    const { feed } = req.query;
    
    if (!feed) {
      return res.status(400).json({ error: 'Missing feed parameter' });
    }

    // Mock feed generator data
    const feedGenerator = {
      view: {
        uri: feed,
        cid: crypto.randomBytes(16).toString('hex'),
        did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
        creator: 'did:plc:z72i7hdynmk6r22z27h6tvur',
        displayName: 'Custom Feed',
        description: 'A custom feed generator',
        descriptionFacets: [],
        avatar: null,
        likeCount: Math.floor(Math.random() * 1000),
        viewer: null,
        indexedAt: new Date().toISOString()
      },
      isOnline: true,
      isValid: true
    };

    res.json(feedGenerator);
  } catch (error) {
    console.error('Error in getFeedGenerator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 19. Get Likes
app.get('/xrpc/app.bsky.feed.getLikes', (req, res) => {
  try {
    const { uri, limit = 20, cursor } = req.query;
    
    if (!uri) {
      return res.status(400).json({ error: 'Missing URI parameter' });
    }

    // Mock likes data
    const likes = {
      uri: uri,
      cid: crypto.randomBytes(16).toString('hex'),
      cursor: cursor ? `next-${Date.now()}` : undefined,
      likes: []
    };

    // Generate mock likes
    for (let i = 0; i < Math.min(limit, 20); i++) {
      likes.likes.push({
        indexedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        actor: `did:web:user${i}.sfproject.net`
      });
    }

    res.json(likes);
  } catch (error) {
    console.error('Error in getLikes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 20. Get Reposts
app.get('/xrpc/app.bsky.feed.getReposts', (req, res) => {
  try {
    const { uri, limit = 20, cursor } = req.query;
    
    if (!uri) {
      return res.status(400).json({ error: 'Missing URI parameter' });
    }

    // Mock reposts data
    const reposts = {
      uri: uri,
      cid: crypto.randomBytes(16).toString('hex'),
      cursor: cursor ? `next-${Date.now()}` : undefined,
      repostedBy: []
    };

    // Generate mock reposts
    for (let i = 0; i < Math.min(limit, 20); i++) {
      reposts.repostedBy.push({
        did: `did:web:user${i}.sfproject.net`,
        handle: `user${i}.sfproject.net`,
        displayName: `User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    res.json(reposts);
  } catch (error) {
    console.error('Error in getReposts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 21. Get Lists
app.get('/xrpc/app.bsky.graph.getLists', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock lists data
    const lists = {
      lists: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock lists
    for (let i = 0; i < Math.min(limit, 20); i++) {
      lists.lists.push({
        uri: `at://${actor}/app.bsky.graph.list/${crypto.randomBytes(16).toString('hex')}`,
        cid: crypto.randomBytes(16).toString('hex'),
        creator: actor,
        name: `List ${i}`,
        purpose: 'app.bsky.graph.defs#modlist',
        description: `A mock list created by ${actor}`,
        descriptionFacets: [],
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(lists);
  } catch (error) {
    console.error('Error in getLists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 22. Get List
app.get('/xrpc/app.bsky.graph.getList', (req, res) => {
  try {
    const { list, limit = 20, cursor } = req.query;
    
    if (!list) {
      return res.status(400).json({ error: 'Missing list parameter' });
    }

    // Mock list data
    const listData = {
      list: {
        uri: list,
        cid: crypto.randomBytes(16).toString('hex'),
        creator: 'did:web:user.sfproject.net',
        name: 'Mock List',
        purpose: 'app.bsky.graph.defs#modlist',
        description: 'A mock list for testing',
        descriptionFacets: [],
        avatar: null,
        indexedAt: new Date().toISOString()
      },
      items: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock list items
    for (let i = 0; i < Math.min(limit, 20); i++) {
      listData.items.push({
        did: `did:web:user${i}.sfproject.net`,
        handle: `user${i}.sfproject.net`,
        displayName: `User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(listData);
  } catch (error) {
    console.error('Error in getList:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 23. Get Blocks
app.get('/xrpc/app.bsky.graph.getBlocks', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock blocks data
    const blocks = {
      blocks: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock blocks
    for (let i = 0; i < Math.min(limit, 20); i++) {
      blocks.blocks.push({
        did: `did:web:blocked${i}.sfproject.net`,
        handle: `blocked${i}.sfproject.net`,
        displayName: `Blocked User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(blocks);
  } catch (error) {
    console.error('Error in getBlocks:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 24. Get Mutes
app.get('/xrpc/app.bsky.graph.getMutes', (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    
    // Mock mutes data
    const mutes = {
      mutes: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock mutes
    for (let i = 0; i < Math.min(limit, 20); i++) {
      mutes.mutes.push({
        did: `did:web:muted${i}.sfproject.net`,
        handle: `muted${i}.sfproject.net`,
        displayName: `Muted User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(mutes);
  } catch (error) {
    console.error('Error in getMutes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 25. Get Mute Lists
app.get('/xrpc/app.bsky.graph.getMuteLists', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock mute lists data
    const muteLists = {
      lists: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock mute lists
    for (let i = 0; i < Math.min(limit, 20); i++) {
      muteLists.lists.push({
        uri: `at://${actor}/app.bsky.graph.list/${crypto.randomBytes(16).toString('hex')}`,
        cid: crypto.randomBytes(16).toString('hex'),
        creator: actor,
        name: `Mute List ${i}`,
        purpose: 'app.bsky.graph.defs#modlist',
        description: `A mock mute list`,
        descriptionFacets: [],
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(muteLists);
  } catch (error) {
    console.error('Error in getMuteLists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 26. Get Suggested Follows by Actor
app.get('/xrpc/app.bsky.graph.getSuggestedFollowsByActor', (req, res) => {
  try {
    const { actor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock suggested follows data
    const suggestions = {
      suggestions: []
    };

    // Generate mock suggestions
    for (let i = 0; i < 10; i++) {
      suggestions.suggestions.push({
        did: `did:web:suggested${i}.sfproject.net`,
        handle: `suggested${i}.sfproject.net`,
        displayName: `Suggested User ${i}`,
        description: `A user suggested based on ${actor}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(suggestions);
  } catch (error) {
    console.error('Error in getSuggestedFollowsByActor:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 27. Get Actor Status
app.get('/xrpc/app.bsky.actor.getActorStatus', (req, res) => {
  try {
    const { actor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock actor status data
    const status = {
      actor: actor,
      takedown: null
    };

    res.json(status);
  } catch (error) {
    console.error('Error in getActorStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 28. Get Actor Feeds
app.get('/xrpc/app.bsky.actor.getActorFeeds', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock actor feeds data
    const feeds = {
      feeds: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock feeds
    for (let i = 0; i < Math.min(limit, 20); i++) {
      feeds.feeds.push({
        uri: `at://${actor}/app.bsky.feed.generator/feed${i}`,
        cid: crypto.randomBytes(16).toString('hex'),
        did: actor,
        creator: actor,
        displayName: `Feed ${i}`,
        description: `A feed created by ${actor}`,
        descriptionFacets: [],
        avatar: null,
        likeCount: Math.floor(Math.random() * 100),
        viewer: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(feeds);
  } catch (error) {
    console.error('Error in getActorFeeds:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 29. Get Actor Likes
app.get('/xrpc/app.bsky.actor.getActorLikes', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock actor likes data
    const likes = {
      feed: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock likes
    for (let i = 0; i < Math.min(limit, 20); i++) {
      likes.feed.push({
        post: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        reply: null,
        repost: null,
        like: {
          indexedAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          actor: actor
        },
        indexedAt: new Date().toISOString()
      });
    }

    res.json(likes);
  } catch (error) {
    console.error('Error in getActorLikes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 30. Get Actor Reposts
app.get('/xrpc/app.bsky.actor.getActorReposts', (req, res) => {
  try {
    const { actor, limit = 20, cursor } = req.query;
    
    if (!actor) {
      return res.status(400).json({ error: 'Missing actor parameter' });
    }

    // Mock actor reposts data
    const reposts = {
      feed: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock reposts
    for (let i = 0; i < Math.min(limit, 20); i++) {
      reposts.feed.push({
        post: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        reply: null,
        repost: {
          uri: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
          cid: crypto.randomBytes(16).toString('hex'),
          author: {
            did: `did:web:user${i}.sfproject.net`,
            handle: `user${i}.sfproject.net`
          },
          record: {
            text: 'Mock repost content'
          },
          indexedAt: new Date().toISOString()
        },
        like: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(reposts);
  } catch (error) {
    console.error('Error in getActorReposts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 31. Search Posts
app.get('/xrpc/app.bsky.feed.searchPosts', (req, res) => {
  try {
    const { q, limit = 20, cursor } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    // Mock search results
    const searchResults = {
      posts: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock search results
    for (let i = 0; i < Math.min(limit, 20); i++) {
      searchResults.posts.push({
        uri: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        cid: crypto.randomBytes(16).toString('hex'),
        author: {
          did: `did:web:user${i}.sfproject.net`,
          handle: `user${i}.sfproject.net`,
          displayName: `User ${i}`,
          avatar: null,
          indexedAt: new Date().toISOString()
        },
        record: {
          text: `Post matching search query: "${q}"`,
          createdAt: new Date().toISOString()
        },
        indexedAt: new Date().toISOString()
      });
    }

    res.json(searchResults);
  } catch (error) {
    console.error('Error in searchPosts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 32. Get Repo
app.get('/xrpc/com.atproto.repo.getRepo', (req, res) => {
  try {
    const { did } = req.query;
    
    if (!did) {
      return res.status(400).json({ error: 'Missing did parameter' });
    }

    // Mock repo data
    const repo = {
      did: did,
      handle: did.split(':').pop() || did,
      collections: ['app.bsky.feed.post', 'app.bsky.graph.follow', 'app.bsky.actor.profile'],
      handleIsCorrect: true
    };

    res.json(repo);
  } catch (error) {
    console.error('Error in getRepo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 33. Get Record
app.get('/xrpc/com.atproto.repo.getRecord', (req, res) => {
  try {
    const { uri, cid } = req.query;
    
    if (!uri) {
      return res.status(400).json({ error: 'Missing URI parameter' });
    }

    // Mock record data
    const record = {
      uri: uri,
      cid: cid || crypto.randomBytes(16).toString('hex'),
      value: {
        $type: 'app.bsky.feed.post',
        text: 'This is a mock post record',
        createdAt: new Date().toISOString()
      }
    };

    res.json(record);
  } catch (error) {
    console.error('Error in getRecord:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 34. Get Repo Status
app.get('/xrpc/com.atproto.repo.getRepoStatus', (req, res) => {
  try {
    const { did } = req.query;
    
    if (!did) {
      return res.status(400).json({ error: 'Missing did parameter' });
    }

    // Mock repo status
    const status = {
      did: did,
      handle: did.split(':').pop() || did,
      active: true,
      status: 'active',
      indexedAt: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    console.error('Error in getRepoStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 35. Get Sync Status
app.get('/xrpc/com.atproto.sync.getStatus', (req, res) => {
  try {
    // Mock sync status
    const status = {
      version: '0.0.1',
      active: true,
      lastSync: new Date().toISOString(),
      lastSyncDate: new Date().toISOString()
    };

    res.json(status);
  } catch (error) {
    console.error('Error in getSyncStatus:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 36. Get Sync Notify
app.get('/xrpc/com.atproto.sync.notifyOfUpdate', (req, res) => {
  try {
    // Mock sync notification
    const notification = {
      hostname: 'bsky.sfproject.net',
      status: 'ok',
      timestamp: new Date().toISOString()
    };

    res.json(notification);
  } catch (error) {
    console.error('Error in notifyOfUpdate:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 37. Get Identity Resolve Handle
app.get('/xrpc/com.atproto.identity.resolveHandle', (req, res) => {
  try {
    const { handle } = req.query;
    
    if (!handle) {
      return res.status(400).json({ error: 'Missing handle parameter' });
    }

    // Mock identity resolution
    const identity = {
      did: `did:web:${handle}`,
      handle: handle
    };

    res.json(identity);
  } catch (error) {
    console.error('Error in resolveHandle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 38. Get Identity Update Handle
app.get('/xrpc/com.atproto.identity.updateHandle', (req, res) => {
  try {
    // Mock handle update
    const update = {
      handle: 'updated.sfproject.net',
      did: 'did:web:updated.sfproject.net',
      updatedAt: new Date().toISOString()
    };

    res.json(update);
  } catch (error) {
    console.error('Error in updateHandle:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 39. Get Server Get Session
app.get('/xrpc/com.atproto.server.getSession', (req, res) => {
  try {
    // Mock session data
    const session = {
      handle: 'user.sfproject.net',
      did: 'did:web:user.sfproject.net',
      email: 'user@sfproject.net',
      emailConfirmed: true,
      accessJwt: 'mock-access-jwt',
      refreshJwt: 'mock-refresh-jwt'
    };

    res.json(session);
  } catch (error) {
    console.error('Error in getSession:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 40. Get Server Refresh Session
app.post('/xrpc/com.atproto.server.refreshSession', (req, res) => {
  try {
    // Mock session refresh
    const refresh = {
      accessJwt: 'new-mock-access-jwt',
      refreshJwt: 'new-mock-refresh-jwt',
      handle: 'user.sfproject.net',
      did: 'did:web:user.sfproject.net'
    };

    res.json(refresh);
  } catch (error) {
    console.error('Error in refreshSession:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 41. Get Moderation Report
app.get('/xrpc/com.atproto.moderation.getReport', (req, res) => {
  try {
    const { id } = req.query;
    
    if (!id) {
      return res.status(400).json({ error: 'Missing id parameter' });
    }

    // Mock moderation report
    const report = {
      id: id,
      reasonType: 'com.atproto.moderation.defs#reasonSpam',
      reason: 'Spam content',
      subject: {
        $type: 'com.atproto.moderation.defs#repoRef',
        did: 'did:web:reported.sfproject.net'
      },
      reportedBy: 'did:web:reporter.sfproject.net',
      createdAt: new Date().toISOString(),
      resolvedByActionIds: []
    };

    res.json(report);
  } catch (error) {
    console.error('Error in getReport:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 42. Get Moderation Reports
app.get('/xrpc/com.atproto.moderation.getReports', (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    
    // Mock moderation reports
    const reports = {
      reports: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock reports
    for (let i = 0; i < Math.min(limit, 20); i++) {
      reports.reports.push({
        id: `report-${i}`,
        reasonType: 'com.atproto.moderation.defs#reasonSpam',
        reason: `Report reason ${i}`,
        subject: {
          $type: 'com.atproto.moderation.defs#repoRef',
          did: `did:web:reported${i}.sfproject.net`
        },
        reportedBy: 'did:web:reporter.sfproject.net',
        createdAt: new Date().toISOString(),
        resolvedByActionIds: []
      });
    }

    res.json(reports);
  } catch (error) {
    console.error('Error in getReports:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 43. Get Labels
app.get('/xrpc/com.atproto.label.queryLabels', (req, res) => {
  try {
    const { uriPatterns, sources, limit = 20, cursor } = req.query;
    
    // Mock labels
    const labels = {
      labels: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock labels
    for (let i = 0; i < Math.min(limit, 20); i++) {
      labels.labels.push({
        src: 'did:web:labeler.sfproject.net',
        uri: `at://did:web:user${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        cid: crypto.randomBytes(16).toString('hex'),
        val: 'spam',
        neg: false,
        cts: new Date().toISOString()
      });
    }

    res.json(labels);
  } catch (error) {
    console.error('Error in queryLabels:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 44. Get Labeler Services
app.get('/xrpc/app.bsky.labeler.getServices', (req, res) => {
  try {
    const { dids } = req.query;
    
    if (!dids) {
      return res.status(400).json({ error: 'Missing dids parameter' });
    }

    // Parse DIDs (handle both single and multiple)
    const didList = Array.isArray(dids) ? dids : [dids];

    // Mock labeler services
    const services = {
      views: didList.map(did => ({
        uri: did,
        cid: crypto.randomBytes(16).toString('hex'),
        did: did,
        creator: did,
        displayName: 'SF Project Labeler',
        description: 'Content labeling service',
        descriptionFacets: [],
        avi: null,
        labels: [],
        indexedAt: new Date().toISOString()
      }))
    };

    res.json(services);
  } catch (error) {
    console.error('Error in getLabelerServices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 45. Get Feed Generator Routes
app.get('/xrpc/app.bsky.feed.getFeedGeneratorRoutes', (req, res) => {
  try {
    // Mock feed generator routes
    const routes = {
      routes: [
        {
          feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot',
          uris: ['at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/whats-hot']
        },
        {
          feed: 'at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/following',
          uris: ['at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/following']
        }
      ]
    };

    res.json(routes);
  } catch (error) {
    console.error('Error in getFeedGeneratorRoutes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 46. Get Actor Typeahead
app.get('/xrpc/app.bsky.actor.getTypeahead', (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    // Mock typeahead results
    const typeahead = {
      actors: []
    };

    // Generate mock typeahead results
    for (let i = 0; i < Math.min(limit, 10); i++) {
      typeahead.actors.push({
        did: `did:web:typeahead${i}.sfproject.net`,
        handle: `typeahead${i}.sfproject.net`,
        displayName: `Typeahead User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(typeahead);
  } catch (error) {
    console.error('Error in getTypeahead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 47. Get Actor Search
app.get('/xrpc/app.bsky.actor.searchActorsTypeahead', (req, res) => {
  try {
    const { q, limit = 10 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Missing query parameter' });
    }

    // Mock search results
    const search = {
      actors: []
    };

    // Generate mock search results
    for (let i = 0; i < Math.min(limit, 10); i++) {
      search.actors.push({
        did: `did:web:search${i}.sfproject.net`,
        handle: `search${i}.sfproject.net`,
        displayName: `Search User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(search);
  } catch (error) {
    console.error('Error in searchActorsTypeahead:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 48. Get Feed Likes
app.get('/xrpc/app.bsky.feed.getLikes', (req, res) => {
  try {
    const { uri, limit = 20, cursor } = req.query;
    
    if (!uri) {
      return res.status(400).json({ error: 'Missing URI parameter' });
    }

    // Mock likes data
    const likes = {
      uri: uri,
      cid: crypto.randomBytes(16).toString('hex'),
      cursor: cursor ? `next-${Date.now()}` : undefined,
      likes: []
    };

    // Generate mock likes
    for (let i = 0; i < Math.min(limit, 20); i++) {
      likes.likes.push({
        indexedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        actor: `did:web:user${i}.sfproject.net`
      });
    }

    res.json(likes);
  } catch (error) {
    console.error('Error in getLikes:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 49. Get Feed Reposts
app.get('/xrpc/app.bsky.feed.getReposts', (req, res) => {
  try {
    const { uri, limit = 20, cursor } = req.query;
    
    if (!uri) {
      return res.status(400).json({ error: 'Missing URI parameter' });
    }

    // Mock reposts data
    const reposts = {
      uri: uri,
      cid: crypto.randomBytes(16).toString('hex'),
      cursor: cursor ? `next-${Date.now()}` : undefined,
      repostedBy: []
    };

    // Generate mock reposts
    for (let i = 0; i < Math.min(limit, 20); i++) {
      reposts.repostedBy.push({
        did: `did:web:user${i}.sfproject.net`,
        handle: `user${i}.sfproject.net`,
        displayName: `User ${i}`,
        avatar: null,
        indexedAt: new Date().toISOString(),
        createdAt: new Date().toISOString()
      });
    }

    res.json(reposts);
  } catch (error) {
    console.error('Error in getReposts:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 50. Get Feed Thread
app.get('/xrpc/app.bsky.feed.getPostThread', (req, res) => {
  try {
    const { uri, depth = 6 } = req.query;
    
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
            handle: 'user.sfproject.net',
            displayName: 'Thread Author',
            avatar: null,
            indexedAt: new Date().toISOString()
          },
          record: {
            text: 'This is a mock post thread',
            createdAt: new Date().toISOString()
          },
          indexedAt: new Date().toISOString()
        },
        replies: []
      }
    };

    res.json(thread);
  } catch (error) {
    console.error('Error in getPostThread:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 51. Get Chat Convo
app.get('/xrpc/app.bsky.chat.getConvo', (req, res) => {
  try {
    const { convoId } = req.query;
    
    if (!convoId) {
      return res.status(400).json({ error: 'Missing convoId parameter' });
    }

    // Mock conversation data
    const convo = {
      convoId: convoId,
      rev: crypto.randomBytes(16).toString('hex'),
      members: [
        {
          did: 'did:web:user1.sfproject.net',
          handle: 'user1.sfproject.net'
        },
        {
          did: 'did:web:user2.sfproject.net',
          handle: 'user2.sfproject.net'
        }
      ],
      lastMessage: {
        id: crypto.randomBytes(16).toString('hex'),
        rev: crypto.randomBytes(16).toString('hex'),
        sender: 'did:web:user1.sfproject.net',
        text: 'Hello! This is a mock conversation.',
        sentAt: new Date().toISOString()
      }
    };

    res.json(convo);
  } catch (error) {
    console.error('Error in getConvo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 52. Get Chat Convos
app.get('/xrpc/app.bsky.chat.getConvos', (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    
    // Mock conversations list
    const convos = {
      convos: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock conversations
    for (let i = 0; i < Math.min(limit, 20); i++) {
      convos.convos.push({
        convoId: `convo-${i}`,
        rev: crypto.randomBytes(16).toString('hex'),
        members: [
          {
            did: 'did:web:user1.sfproject.net',
            handle: 'user1.sfproject.net'
          },
          {
            did: `did:web:user${i}.sfproject.net`,
            handle: `user${i}.sfproject.net`
          }
        ],
        lastMessage: {
          id: crypto.randomBytes(16).toString('hex'),
          rev: crypto.randomBytes(16).toString('hex'),
          sender: 'did:web:user1.sfproject.net',
          text: `Mock message ${i}`,
          sentAt: new Date().toISOString()
        }
      });
    }

    res.json(convos);
  } catch (error) {
    console.error('Error in getConvos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 53. Get Chat Messages
app.get('/xrpc/app.bsky.chat.getMessages', (req, res) => {
  try {
    const { convoId, limit = 20, cursor } = req.query;
    
    if (!convoId) {
      return res.status(400).json({ error: 'Missing convoId parameter' });
    }

    // Mock messages data
    const messages = {
      messages: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock messages
    for (let i = 0; i < Math.min(limit, 20); i++) {
      messages.messages.push({
        id: crypto.randomBytes(16).toString('hex'),
        rev: crypto.randomBytes(16).toString('hex'),
        sender: i % 2 === 0 ? 'did:web:user1.sfproject.net' : 'did:web:user2.sfproject.net',
        text: `Mock message ${i} in conversation`,
        sentAt: new Date().toISOString()
      });
    }

    res.json(messages);
  } catch (error) {
    console.error('Error in getMessages:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 54. Get Unspecced Get Popular
app.get('/xrpc/app.bsky.unspecced.getPopular', (req, res) => {
  try {
    const { limit = 20, cursor } = req.query;
    
    // Mock popular content
    const popular = {
      feed: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock popular posts
    for (let i = 0; i < Math.min(limit, 20); i++) {
      popular.feed.push({
        post: `at://did:web:popular${i}.sfproject.net/app.bsky.feed.post/${crypto.randomBytes(16).toString('hex')}`,
        reply: null,
        repost: null,
        like: null,
        indexedAt: new Date().toISOString()
      });
    }

    res.json(popular);
  } catch (error) {
    console.error('Error in getPopular:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 55. Get Unspecced Get Popular Feed Generators
app.get('/xrpc/app.bsky.unspecced.getPopularFeedGenerators', (req, res) => {
  try {
    const { limit = 10, cursor } = req.query;
    
    // Mock popular feed generators
    const generators = {
      feeds: [],
      cursor: cursor ? `next-${Date.now()}` : undefined
    };

    // Generate mock feed generators
    const popularFeeds = [
      { name: 'whats-hot', displayName: 'What\'s Hot' },
      { name: 'following', displayName: 'Following' },
      { name: 'trending', displayName: 'Trending' },
      { name: 'tech-news', displayName: 'Tech News' },
      { name: 'sports', displayName: 'Sports' }
    ];

    const limitedFeeds = popularFeeds.slice(0, Math.min(limit, popularFeeds.length));

    generators.feeds = limitedFeeds.map((feed, index) => ({
      uri: `at://did:plc:z72i7hdynmk6r22z27h6tvur/app.bsky.feed.generator/${feed.name}`,
      cid: crypto.randomBytes(16).toString('hex'),
      did: 'did:plc:z72i7hdynmk6r22z27h6tvur',
      creator: 'did:plc:z72i7hdynmk6r22z27h6tvur',
      displayName: feed.displayName,
      description: `Popular ${feed.displayName} feed`,
      descriptionFacets: [],
      avatar: null,
      likeCount: Math.floor(Math.random() * 1000) + 100,
      viewer: null,
      indexedAt: new Date().toISOString()
    }));

    res.json(generators);
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
