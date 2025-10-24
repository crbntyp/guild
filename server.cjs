// Simple OAuth proxy server for Battle.net authentication
const express = require('express');
const cors = require('cors');
const fetch = require('node-fetch');

const app = express();
const PORT = process.env.PORT || 3001;

// Battle.net OAuth configuration
const BNET_CONFIG = {
  clientId: process.env.BNET_CLIENT_ID || '86af3b20703442e78f9a90778846ce3b',
  clientSecret: process.env.BNET_CLIENT_SECRET || 'xHpqmVAnuwV8DFcMQncEYxCio35MSUHq',
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

app.listen(PORT, () => {
  console.log(`🔐 OAuth proxy server running on http://localhost:${PORT}`);
});
