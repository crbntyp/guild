import authService from './auth.js';

class RaidService {
  constructor() {
    // Same-origin on production, localhost proxy for dev
    this.baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? '/api'
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

  async getRaids(past = false) {
    const url = past
      ? `${this.baseUrl}/raids.php?past=1`
      : `${this.baseUrl}/raids.php`;
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
