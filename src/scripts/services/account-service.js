import authService from './auth.js';
import config from '../config.js';

/**
 * WoW Account Service - Fetch user's WoW characters
 */
class AccountService {
  constructor() {
    this.cacheKey = 'wow_account_characters';
    this.cacheTTL = 300000; // 5 minutes
  }

  /**
   * Get user's WoW account summary (includes all characters)
   */
  async getAccountCharacters() {
    const accessToken = authService.getAccessToken();
    if (!accessToken) {
      throw new Error('Not authenticated');
    }

    // Check cache first
    const cached = this.getFromCache();
    if (cached) {

      return cached;
    }

    try {

      // First, get the account profile to find WoW accounts
      const profileUrl = `${config.getApiUrl()}/profile/user/wow?namespace=${config.api.namespace.profile}&locale=${config.api.locale}`;

      const response = await fetch(profileUrl, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Response error:', errorText);
        throw new Error(`Failed to fetch WoW profile: ${response.status} - ${errorText}`);
      }

      const profileData = await response.json();

      // Get all characters from all WoW accounts
      const allCharacters = [];

      if (profileData.wow_accounts) {
        for (const account of profileData.wow_accounts) {
          if (account.characters) {
            allCharacters.push(...account.characters);
          }
        }
      }

      // Cache the results
      this.saveToCache(allCharacters);

      return allCharacters;
    } catch (error) {
      console.error('❌ Error fetching account characters:', error);
      throw error;
    }
  }

  /**
   * Get the user's main character (highest level or first character)
   */
  async getMainCharacter() {
    const characters = await this.getAccountCharacters();

    if (!characters || characters.length === 0) {
      return null;
    }

    // Find highest level character
    const mainChar = characters.reduce((prev, current) => {
      return (current.level > prev.level) ? current : prev;
    });

    return mainChar;
  }

  /**
   * Save characters to cache
   */
  saveToCache(data) {
    const cacheData = {
      data: data,
      timestamp: Date.now()
    };
    localStorage.setItem(this.cacheKey, JSON.stringify(cacheData));
  }

  /**
   * Get characters from cache if not expired
   */
  getFromCache() {
    const cached = localStorage.getItem(this.cacheKey);
    if (!cached) return null;

    try {
      const cacheData = JSON.parse(cached);
      const age = Date.now() - cacheData.timestamp;

      if (age < this.cacheTTL) {
        return cacheData.data;
      }

      // Cache expired
      localStorage.removeItem(this.cacheKey);
      return null;
    } catch (error) {
      console.error('Error reading cache:', error);
      return null;
    }
  }

  /**
   * Clear the cache
   */
  clearCache() {
    localStorage.removeItem(this.cacheKey);
  }
}

export default new AccountService();
