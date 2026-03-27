import authService from './auth.js';

class RaidService {
  constructor() {
    // Use live VPS API for both dev and production (no local PHP server)
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

  async getRaids(past = false, guildId = null) {
    const params = new URLSearchParams();
    if (past) params.set('past', '1');
    if (guildId) params.set('guild', guildId);
    const url = `${this.baseUrl}/raids.php?${params.toString()}`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch raids');
    const data = await response.json();
    return data.raids || [];
  }

  async getRaid(id) {
    const response = await fetch(`${this.baseUrl}/raid.php?id=${id}`);
    if (!response.ok) throw new Error('Failed to fetch raid');
    const data = await response.json();
    return data.raid;
  }

  async createRaid(raidData) {
    const response = await fetch(`${this.baseUrl}/raids.php`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(raidData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to create raid');
    }
    return response.json();
  }

  async signup(signupData) {
    const response = await fetch(`${this.baseUrl}/signup.php`, {
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

  async updateSignup(signupData) {
    const response = await fetch(`${this.baseUrl}/signup.php`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(signupData)
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to update signup');
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
    } catch {
      return false;
    }
  }

  async deleteRaid(raidId) {
    const response = await fetch(`${this.baseUrl}/raids.php?id=${raidId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to delete raid');
    }
    return response.json();
  }

  async withdraw(raidId) {
    const response = await fetch(`${this.baseUrl}/signup.php?raid_id=${raidId}`, {
      method: 'DELETE',
      headers: this.getHeaders()
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to withdraw');
    }
    return response.json();
  }
}

export default new RaidService();
