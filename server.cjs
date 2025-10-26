// Simple OAuth proxy server for Battle.net authentication
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');
const fs = require('fs').promises;
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Battle.net OAuth configuration
const BNET_CONFIG = {
  clientId: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  tokenUrl: 'https://oauth.battle.net/token',
  userinfoUrl: 'https://oauth.battle.net/userinfo'
};

app.use(cors());
app.use(express.json());

// Exchange authorization code for access token
app.post('/api/auth/token', async (req, res) => {
  const { code, redirectUri } = req.body;

  if (!code || !redirectUri) {
    return res.status(400).json({ error: 'Missing code or redirectUri' });
  }

  try {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri,
      client_id: BNET_CONFIG.clientId,
      client_secret: BNET_CONFIG.clientSecret
    });

    const response = await fetch(BNET_CONFIG.tokenUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Token exchange failed:', response.status, errorText);
      return res.status(response.status).json({ error: 'Token exchange failed', details: errorText });
    }

    const tokenData = await response.json();
    res.json(tokenData);
  } catch (error) {
    console.error('Error exchanging token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get user info using access token
app.post('/api/auth/userinfo', async (req, res) => {
  const { accessToken } = req.body;

  if (!accessToken) {
    return res.status(400).json({ error: 'Missing accessToken' });
  }

  try {
    const response = await fetch(BNET_CONFIG.userinfoUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Userinfo fetch failed:', response.status, errorText);
      return res.status(response.status).json({ error: 'Userinfo fetch failed' });
    }

    const userData = await response.json();
    res.json(userData);
  } catch (error) {
    console.error('Error fetching userinfo:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Fetch URL metadata for todo cards
app.post('/api/fetch-metadata', async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: 'Missing url' });
  }

  // Validate URL
  try {
    new URL(url);
  } catch (error) {
    return res.status(400).json({ error: 'Invalid URL' });
  }

  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      },
      redirect: 'follow'
    });

    if (!response.ok) {
      return res.status(response.status).json({ error: 'Failed to fetch URL' });
    }

    const html = await response.text();

    // Extract Open Graph metadata using regex
    const getMetaTag = (property) => {
      const regex = new RegExp(`<meta[^>]*property=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const match = html.match(regex);
      if (match) return match[1];

      // Try with name attribute as fallback
      const nameRegex = new RegExp(`<meta[^>]*name=["']${property}["'][^>]*content=["']([^"']*)["']`, 'i');
      const nameMatch = html.match(nameRegex);
      return nameMatch ? nameMatch[1] : null;
    };

    // Extract title from <title> tag as fallback
    const getTitleTag = () => {
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      return titleMatch ? titleMatch[1] : null;
    };

    const metadata = {
      title: getMetaTag('og:title') || getMetaTag('twitter:title') || getTitleTag() || 'Untitled',
      description: getMetaTag('og:description') || getMetaTag('twitter:description') || getMetaTag('description') || '',
      image: getMetaTag('og:image') || getMetaTag('twitter:image') || null,
      url: url
    };

    console.log('📋 Fetched metadata for:', url);
    res.json(metadata);
  } catch (error) {
    console.error('Error fetching metadata:', error);
    res.status(500).json({ error: 'Failed to fetch metadata', details: error.message });
  }
});

// Fetch YouTube videos for a channel with search tags
app.post('/api/fetch-youtube', async (req, res) => {
  const { channelUrl, tags } = req.body;

  if (!channelUrl) {
    return res.status(400).json({ error: 'Missing channelUrl' });
  }

  // Extract channel ID from URL
  const extractChannelId = (url) => {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Handle @username format
      if (pathname.includes('/@')) {
        return pathname.split('/@')[1].split('/')[0];
      }
      // Handle /c/ format
      if (pathname.includes('/c/')) {
        return pathname.split('/c/')[1].split('/')[0];
      }
      // Handle /channel/ format (direct channel ID)
      if (pathname.includes('/channel/')) {
        return pathname.split('/channel/')[1].split('/')[0];
      }
      // Handle /user/ format
      if (pathname.includes('/user/')) {
        return pathname.split('/user/')[1].split('/')[0];
      }

      return null;
    } catch (error) {
      return null;
    }
  };

  const channelId = extractChannelId(channelUrl);
  if (!channelId) {
    return res.status(400).json({ error: 'Invalid YouTube channel URL' });
  }

  // Get YouTube API key from environment variable
  const YOUTUBE_API_KEY = process.env.YOUTUBE_API_KEY;
  if (!YOUTUBE_API_KEY) {
    console.error('YOUTUBE_API_KEY not set in environment variables');
    return res.status(500).json({ error: 'YouTube API key not configured' });
  }

  try {
    // First, resolve channel handle to channel ID if needed
    let actualChannelId = channelId;

    // If it's a handle (starts with @ or is a custom URL), we need to search for it
    if (!channelId.startsWith('UC')) {
      const searchResponse = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&type=channel&q=${encodeURIComponent(channelId)}&key=${YOUTUBE_API_KEY}&maxResults=1`
      );

      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        if (searchData.items && searchData.items.length > 0) {
          actualChannelId = searchData.items[0].snippet.channelId;
        }
      }
    }

    // Fetch videos from the channel with search query (if tags provided)
    let videosUrl;
    if (tags && tags.trim()) {
      const searchQuery = tags.split(',').map(t => t.trim()).join(' ');
      videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${actualChannelId}&q=${encodeURIComponent(searchQuery)}&type=video&order=date&maxResults=10&key=${YOUTUBE_API_KEY}`;
    } else {
      // No tags - fetch latest videos from channel
      videosUrl = `https://www.googleapis.com/youtube/v3/search?part=snippet&channelId=${actualChannelId}&type=video&order=date&maxResults=10&key=${YOUTUBE_API_KEY}`;
    }

    const response = await fetch(videosUrl);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('YouTube API request failed:', response.status, errorText);
      return res.status(response.status).json({ error: 'Failed to fetch YouTube videos' });
    }

    const data = await response.json();

    // Transform the data into a simpler format
    const videos = data.items.map(item => ({
      id: item.id.videoId,
      title: item.snippet.title,
      thumbnail: item.snippet.thumbnails.medium.url,
      url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
      publishedAt: item.snippet.publishedAt
    }));

    console.log(`📺 Fetched ${videos.length} videos for channel: ${channelId}`);
    res.json(videos);
  } catch (error) {
    console.error('Error fetching YouTube videos:', error);
    res.status(500).json({ error: 'Failed to fetch YouTube videos', details: error.message });
  }
});

// ============================================
// User Data Storage (Simple JSON File System)
// ============================================

const USER_DATA_DIR = path.join(__dirname, 'user-data');

// Ensure user-data directory exists
async function ensureUserDataDir() {
  try {
    await fs.access(USER_DATA_DIR);
  } catch {
    await fs.mkdir(USER_DATA_DIR, { recursive: true });
    console.log('📁 Created user-data directory');
  }
}

// Middleware to verify Battle.net token and get user info
async function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Missing or invalid authorization header' });
  }

  const token = authHeader.substring(7);

  try {
    // Verify token with Battle.net
    const response = await fetch(BNET_CONFIG.userinfoUrl, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    if (!response.ok) {
      return res.status(401).json({ error: 'Invalid token' });
    }

    const userData = await response.json();
    req.user = userData;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    res.status(500).json({ error: 'Token verification failed' });
  }
}

// Get sanitized filename from battletag
function getUserFilename(battletag, type) {
  const sanitized = battletag.replace('#', '_').replace(/[^a-zA-Z0-9_]/g, '');
  return `${sanitized}_${type}.json`;
}

// GET user todos
app.get('/api/user/todos', verifyToken, async (req, res) => {
  try {
    await ensureUserDataDir();
    const filename = getUserFilename(req.user.battletag, 'todos');
    const filepath = path.join(USER_DATA_DIR, filename);

    try {
      const data = await fs.readFile(filepath, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      // File doesn't exist yet, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading todos:', error);
    res.status(500).json({ error: 'Failed to read todos' });
  }
});

// POST user todos
app.post('/api/user/todos', verifyToken, async (req, res) => {
  try {
    await ensureUserDataDir();
    const filename = getUserFilename(req.user.battletag, 'todos');
    const filepath = path.join(USER_DATA_DIR, filename);

    await fs.writeFile(filepath, JSON.stringify(req.body, null, 2));
    console.log(`💾 Saved todos for ${req.user.battletag}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving todos:', error);
    res.status(500).json({ error: 'Failed to save todos' });
  }
});

// GET user YouTube channels
app.get('/api/user/youtube', verifyToken, async (req, res) => {
  try {
    await ensureUserDataDir();
    const filename = getUserFilename(req.user.battletag, 'youtube');
    const filepath = path.join(USER_DATA_DIR, filename);

    try {
      const data = await fs.readFile(filepath, 'utf8');
      res.json(JSON.parse(data));
    } catch (error) {
      // File doesn't exist yet, return empty array
      res.json([]);
    }
  } catch (error) {
    console.error('Error reading YouTube channels:', error);
    res.status(500).json({ error: 'Failed to read YouTube channels' });
  }
});

// POST user YouTube channels
app.post('/api/user/youtube', verifyToken, async (req, res) => {
  try {
    await ensureUserDataDir();
    const filename = getUserFilename(req.user.battletag, 'youtube');
    const filepath = path.join(USER_DATA_DIR, filename);

    await fs.writeFile(filepath, JSON.stringify(req.body, null, 2));
    console.log(`💾 Saved YouTube channels for ${req.user.battletag}`);
    res.json({ success: true });
  } catch (error) {
    console.error('Error saving YouTube channels:', error);
    res.status(500).json({ error: 'Failed to save YouTube channels' });
  }
});

app.listen(PORT, () => {
  console.log(`🔐 OAuth proxy server running on http://localhost:${PORT}`);
});
