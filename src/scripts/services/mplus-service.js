import authService from './auth.js';

class MplusService {
  constructor() {
    this.baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || window.location.hostname.startsWith('192.168.'))
      ? 'https://crbntyp.com/gld/api'
      : '/gld/api';
  }

  getHeaders() {
    const headers = { 'Content-Type': 'application/json' };
    const token = authService.getAccessToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }

  async getSessions(past = false) {
    const params = new URLSearchParams();
    if (past) params.set('past', '1');
    const response = await fetch(`${this.baseUrl}/mplus-sessions.php?${params.toString()}`);
    if (!response.ok) throw new Error('Failed to fetch sessions');
    const data = await response.json();
    return data.sessions || [];
  }

  async getSession(id) {
    const response = await fetch(`${this.baseUrl}/mplus-session.php?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch session');
    const data = await response.json();
    return data.session;
  }

  async createSession(sessionData) {
    const response = await fetch(`${this.baseUrl}/mplus-sessions.php`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(sessionData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create session');
    }
    return response.json();
  }

  async deleteSession(sessionId) {
    const response = await fetch(`${this.baseUrl}/mplus-sessions.php?id=${sessionId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete session');
    }
    return response.json();
  }

  async signup(signupData) {
    const response = await fetch(`${this.baseUrl}/mplus-signup.php`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(signupData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to sign up');
    }
    return response.json();
  }

  async withdraw(sessionId) {
    const response = await fetch(`${this.baseUrl}/mplus-signup.php?session_id=${sessionId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to withdraw');
    }
    return response.json();
  }

  async getGroups(sessionId) {
    const response = await fetch(`${this.baseUrl}/mplus-groups.php?session_id=${sessionId}`, {
      headers: this.getHeaders()
    });
    if (!response.ok) throw new Error('Failed to fetch groups');
    const data = await response.json();
    return data.groups || [];
  }

  async saveGroups(sessionId, groups) {
    const response = await fetch(`${this.baseUrl}/mplus-groups.php`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ session_id: sessionId, groups })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to save groups');
    }
    return response.json();
  }

  async clearGroups(sessionId) {
    const response = await fetch(`${this.baseUrl}/mplus-groups.php?session_id=${sessionId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to clear groups');
    }
    return response.json();
  }

  async linkDiscord(discordId, token) {
    const response = await fetch(`${this.baseUrl}/discord-link.php`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ discord_id: discordId, token })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to link accounts');
    }
    return response.json();
  }

  async claimSession(sessionId, token) {
    const response = await fetch(`${this.baseUrl}/mplus-claim.php`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({ session_id: sessionId, token })
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to claim session');
    }
    return response.json();
  }

  async checkAdmin() {
    try {
      const response = await fetch(`${this.baseUrl}/admin-check.php`, {
        headers: this.getHeaders()
      });
      if (!response.ok) return false;
      const data = await response.json();
      return data.isAdmin === true;
    } catch (e) {
      return false;
    }
  }
}

export default new MplusService();
