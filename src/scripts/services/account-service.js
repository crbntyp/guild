import authService from './auth.js';
import config from '../config.js';
import cacheService from './cache-service.js';

/**
 * WoW Account Service - Fetch user's WoW characters
 */
class AccountService {
  constructor() {
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
    const cacheKey = cacheService.generateKey('account-characters', authService.getUser()?.id || 'default');
    const cached = cacheService.get(cacheKey);
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
      cacheService.set(cacheKey, allCharacters, this.cacheTTL);

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
   * Clear the cache
   */
  clearCache() {
    const cacheKey = cacheService.generateKey('account-characters', authService.getUser()?.id || 'default');
    cacheService.clear(cacheKey);
  }
}

export default new AccountService();
