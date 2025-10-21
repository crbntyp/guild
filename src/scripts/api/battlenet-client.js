import config from '../config.js';

class BattleNetClient {
  constructor() {
    this.accessToken = null;
    this.tokenExpiry = null;
    this.loadTokenFromStorage();
  }

  // Load token from localStorage
  loadTokenFromStorage() {
    const stored = localStorage.getItem('battlenet_token');
    if (stored) {
      try {
        const data = JSON.parse(stored);
        if (data.expiry > Date.now()) {
          this.accessToken = data.token;
          this.tokenExpiry = data.expiry;
        } else {
          localStorage.removeItem('battlenet_token');
        }
      } catch (e) {
        console.error('Failed to load token from storage:', e);
      }
    }
  }

  // Save token to localStorage
  saveTokenToStorage(token, expiresIn) {
    const expiry = Date.now() + (expiresIn * 1000);
    this.accessToken = token;
    this.tokenExpiry = expiry;

    localStorage.setItem('battlenet_token', JSON.stringify({
      token,
      expiry
    }));
  }

  // Check if we have a valid token
  hasValidToken() {
    return this.accessToken && this.tokenExpiry && this.tokenExpiry > Date.now();
  }

  // Get OAuth authorization URL
  getAuthorizationUrl() {
    const params = new URLSearchParams({
      client_id: config.battlenet.clientId,
      redirect_uri: config.battlenet.redirectUri,
      response_type: 'code',
      scope: 'wow.profile'
    });

    return `${config.getOAuthUrl()}/authorize?${params.toString()}`;
  }

  // Exchange authorization code for access token
  async getAccessToken(code) {
    const params = new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: config.battlenet.redirectUri
    });

    // Create Basic Auth header
    const credentials = btoa(`${config.battlenet.clientId}:${config.battlenet.clientSecret}`);

    try {
      const response = await fetch(`${config.getOAuthUrl()}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.saveTokenToStorage(data.access_token, data.expires_in);

      return data;
    } catch (error) {
      console.error('Error getting access token:', error);
      throw error;
    }
  }

  // Get access token using client credentials (for public data)
  async getClientAccessToken() {
    const params = new URLSearchParams({
      grant_type: 'client_credentials'
    });

    const credentials = btoa(`${config.battlenet.clientId}:${config.battlenet.clientSecret}`);

    try {
      const response = await fetch(`${config.getOAuthUrl()}/token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'Authorization': `Basic ${credentials}`
        },
        body: params.toString()
      });

      if (!response.ok) {
        throw new Error(`Token request failed: ${response.statusText}`);
      }

      const data = await response.json();
      this.saveTokenToStorage(data.access_token, data.expires_in);

      return data;
    } catch (error) {
      console.error('Error getting client access token:', error);
      throw error;
    }
  }

  // Make authenticated API request
  async request(endpoint, options = {}) {
    // Ensure we have a valid token
    if (!this.hasValidToken()) {
      await this.getClientAccessToken();
    }

    const url = `${config.getApiUrl()}${endpoint}`;
    const params = new URLSearchParams({
      locale: config.api.locale,
      ...options.params
    });

    try {
      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          ...options.headers
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          // Token expired, try to refresh
          this.accessToken = null;
          await this.getClientAccessToken();
          return this.request(endpoint, options);
        }
        // Don't log 404s as errors - they're expected for characters that don't exist
        if (response.status !== 404) {
          console.error(`API Error: ${response.status} ${response.statusText} - ${endpoint}`);
        }
        const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
        error.status = response.status; // Attach status code to error
        throw error;
      }

      return await response.json();
    } catch (error) {
      // Don't log 404s as errors - they're expected for characters that don't exist
      if (error.status !== 404) {
        console.error('API request error:', error);
      }
      throw error;
    }
  }

  // Logout - clear token
  logout() {
    this.accessToken = null;
    this.tokenExpiry = null;
    localStorage.removeItem('battlenet_token');
  }
}

export default new BattleNetClient();
