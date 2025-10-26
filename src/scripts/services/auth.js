import config from '../config.js';

// OAuth Proxy Server URL - automatically detects environment
const API_PROXY_URL = window.location.hostname === 'localhost'
  ? 'http://localhost:3001'
  : 'https://guild-production.up.railway.app';

/**
 * Battle.net OAuth Authentication Service
 */
class AuthService {
  constructor() {
    this.storageKey = 'bnet_auth';
    this.authCheckPromise = this.checkAuthStatus();
  }

  /**
   * Wait for initial auth check to complete
   */
  async waitForAuthCheck() {
    return this.authCheckPromise;
  }

  /**
   * Check if user is authenticated on page load
   */
  async checkAuthStatus() {
    // Check for OAuth callback with code
    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');

    if (code) {

      const isPopup = window.opener && !window.opener.closed;

      // If we're in a popup, show loading screen immediately
      if (isPopup) {
        document.body.innerHTML = `
          <div style="display: flex; align-items: center; justify-content: center; height: 100vh; background: #0a0a0a; color: white; font-family: 'Muli', sans-serif;">
            <div style="text-align: center;">
              <div style="font-size: 48px; margin-bottom: 20px;">✅</div>
              <div style="font-size: 18px; font-weight: 600;">Logged in successfully!</div>
              <div style="font-size: 14px; color: rgba(255,255,255,0.6); margin-top: 10px;">Closing window...</div>
            </div>
          </div>
        `;
      }

      await this.exchangeCodeForToken(code);

      // Clean up URL
      window.history.replaceState({}, document.title, window.location.pathname);

      // If we're in a popup, notify parent and close
      if (isPopup) {

        window.opener.postMessage({ type: 'bnet-auth-success' }, window.location.origin);

        // Reduced delay
        setTimeout(() => {

          window.close();
        }, 100);
      } else {
        // If not in popup (direct redirect), dispatch event for current window

        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
    }
  }

  /**
   * Exchange authorization code for access token via backend proxy
   */
  async exchangeCodeForToken(code) {
    try {
      const proxyUrl = `${API_PROXY_URL}/api/auth/token`;

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          code: code,
          redirectUri: config.battlenet.redirectUri
        })
      });

      if (!response.ok) {
        throw new Error('Failed to exchange code for token');
      }

      const tokenData = await response.json();

      // Store token data
      this.storeAuthData({
        access_token: tokenData.access_token,
        expires_in: tokenData.expires_in,
        timestamp: Date.now()
      });

      // Fetch user profile
      await this.fetchUserProfile();
    } catch (error) {
      console.error('❌ Token exchange error:', error);
      alert('Login failed. Please make sure the OAuth proxy server is running.');
    }
  }

  /**
   * Check if user is on mobile device
   */
  isMobileDevice() {
    // Check for iPad specifically (including iPadOS 13+ which reports as Macintosh)
    const isIPad = /iPad/.test(navigator.userAgent) ||
                   (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
           isIPad ||
           window.innerWidth <= 768;
  }

  /**
   * Initiate Battle.net OAuth login flow (popup window on desktop, redirect on mobile)
   */
  login() {
    const authUrl = `${config.getOAuthUrl()}/authorize`;
    const params = new URLSearchParams({
      client_id: config.battlenet.clientId,
      redirect_uri: config.battlenet.redirectUri,
      response_type: 'code', // Authorization code flow
      scope: 'wow.profile'
    });

    // On mobile, use full page redirect instead of popup
    if (this.isMobileDevice()) {

      window.location.href = `${authUrl}?${params.toString()}`;
      return;
    }

    // Desktop: Open popup window
    const width = 500;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const fullAuthUrl = `${authUrl}?${params.toString()}`;

    // Open blank popup first to avoid issues
    const popup = window.open(
      'about:blank',
      '_blank',
      `width=${width},height=${height},left=${left},top=${top},toolbar=0,location=0,menubar=0,scrollbars=1,resizable=1`
    );

    if (!popup) {
      alert('Popup blocked! Please allow popups for this site.');
      return;
    }

    // Navigate popup to auth URL
    popup.location.href = fullAuthUrl;

    // Listen for message from popup
    const messageHandler = (event) => {
      if (event.origin !== window.location.origin) return;
      if (event.data?.type === 'bnet-auth-success') {

        window.removeEventListener('message', messageHandler);
        // Dispatch custom event instead of reloading page
        window.dispatchEvent(new CustomEvent('auth-state-changed'));
      }
    };
    window.addEventListener('message', messageHandler);

    // Poll for popup close
    const pollTimer = setInterval(() => {
      try {
        if (popup.closed) {
          clearInterval(pollTimer);
          window.removeEventListener('message', messageHandler);
          // Check if auth completed and dispatch event
          if (this.isAuthenticated()) {
            window.dispatchEvent(new CustomEvent('auth-state-changed'));
          }
        }
      } catch (e) {
        // Cross-origin error is expected
      }
    }, 500);
  }

  /**
   * Fetch Battle.net user profile
   */
  async fetchUserProfile() {
    const authData = this.getAuthData();
    if (!authData || !authData.access_token) {
      return null;
    }

    try {
      const response = await fetch(`${config.getOAuthUrl()}/userinfo`, {
        headers: {
          'Authorization': `Bearer ${authData.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch user profile');
      }

      const userData = await response.json();

      // Store user data
      authData.user = userData;
      this.storeAuthData(authData);

      return userData;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }
  }

  /**
   * Logout user
   */
  logout() {
    localStorage.removeItem(this.storageKey);
    // Dispatch custom event instead of reloading page
    window.dispatchEvent(new CustomEvent('auth-state-changed'));
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated() {
    const authData = this.getAuthData();
    if (!authData || !authData.access_token) {
      return false;
    }

    // Check if token is expired
    const expiresAt = authData.timestamp + (authData.expires_in * 1000);
    if (Date.now() >= expiresAt) {
      this.logout();
      return false;
    }

    return true;
  }

  /**
   * Get current user data
   */
  getUser() {
    const authData = this.getAuthData();
    return authData?.user || null;
  }

  /**
   * Store auth data in localStorage
   */
  storeAuthData(data) {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(data));
      // Verify it was stored (Safari private browsing fails silently)
      const stored = localStorage.getItem(this.storageKey);
      if (!stored) {
        console.error('❌ localStorage.setItem failed silently (possibly private browsing)');
        alert('Login failed: Please disable private browsing mode and try again.');
      }
    } catch (error) {
      console.error('❌ localStorage error:', error);
      alert('Login failed: localStorage is blocked. Please check your browser settings (Safari → Prevent Cross-Site Tracking)');
    }
  }

  /**
   * Get auth data from localStorage
   */
  getAuthData() {
    try {
      const data = localStorage.getItem(this.storageKey);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('❌ Error reading from localStorage:', error);
      return null;
    }
  }

  /**
   * Get access token
   */
  getAccessToken() {
    const authData = this.getAuthData();
    return authData?.access_token || null;
  }
}

export default new AuthService();
