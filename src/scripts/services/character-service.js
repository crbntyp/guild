import wowAPI from '../api/wow-api.js';
import cacheService from './cache-service.js';
import config from '../config.js';

class CharacterService {
  constructor() {
    this.characterCache = new Map();
    this.loading = new Set();
  }

  // Fetch character profile with caching
  async fetchCharacterProfile(realmSlug, characterName, forceRefresh = false) {
    const cacheKey = cacheService.generateKey('character-profile', realmSlug, characterName);

    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get(cacheKey);
    }

    // Prevent duplicate requests
    if (this.loading.has(cacheKey)) {
      return new Promise((resolve, reject) => {
        const checkInterval = setInterval(() => {
          if (!this.loading.has(cacheKey)) {
            clearInterval(checkInterval);
            const cached = cacheService.get(cacheKey);
            if (cached) {
              resolve(cached);
            } else {
              reject(new Error('Failed to load character'));
            }
          }
        }, 100);
      });
    }

    this.loading.add(cacheKey);

    try {
      const data = await wowAPI.getCharacterProfile(realmSlug, characterName);
      cacheService.set(cacheKey, data, config.cache.characterTTL);
      this.characterCache.set(cacheKey, data);
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters that don't exist
      if (error.status !== 404) {
        console.error(`Error fetching character ${characterName}:`, error);
      }
      throw error;
    } finally {
      this.loading.delete(cacheKey);
    }
  }

  // Fetch character equipment
  async fetchCharacterEquipment(realmSlug, characterName, forceRefresh = false) {
    const cacheKey = cacheService.generateKey('character-equipment', realmSlug, characterName);

    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get(cacheKey);
    }

    try {
      const data = await wowAPI.getCharacterEquipment(realmSlug, characterName);
      cacheService.set(cacheKey, data, config.cache.characterTTL);
      return data;
    } catch (error) {
      console.error(`Error fetching equipment for ${characterName}:`, error);
      throw error;
    }
  }

  // Fetch character specializations
  async fetchCharacterSpecializations(realmSlug, characterName, forceRefresh = false) {
    const cacheKey = cacheService.generateKey('character-specs', realmSlug, characterName);

    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get(cacheKey);
    }

    try {
      const data = await wowAPI.getCharacterSpecializations(realmSlug, characterName);
      // Don't cache specs to avoid localStorage quota issues
      // cacheService.set(cacheKey, data, config.cache.characterTTL);
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters that don't exist
      if (error.status !== 404) {
        console.error(`Error fetching specs for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Fetch character media (avatar, bust, render)
  async fetchCharacterMedia(realmSlug, characterName, forceRefresh = false) {
    const cacheKey = cacheService.generateKey('character-media', realmSlug, characterName);

    if (!forceRefresh && cacheService.has(cacheKey)) {
      return cacheService.get(cacheKey);
    }

    try {
      const data = await wowAPI.getCharacterMedia(realmSlug, characterName);
      cacheService.set(cacheKey, data, config.cache.characterTTL);
      return data;
    } catch (error) {
      // Don't log 404s or 403s - they're expected for characters that don't exist or have privacy settings
      if (error.status !== 404 && error.status !== 403) {
        console.error(`Error fetching media for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Get full character data (profile + equipment + specs + media)
  async fetchFullCharacterData(realmSlug, characterName, forceRefresh = false) {
    try {
      const [profile, equipment, specs, media] = await Promise.allSettled([
        this.fetchCharacterProfile(realmSlug, characterName, forceRefresh),
        this.fetchCharacterEquipment(realmSlug, characterName, forceRefresh),
        this.fetchCharacterSpecializations(realmSlug, characterName, forceRefresh),
        this.fetchCharacterMedia(realmSlug, characterName, forceRefresh)
      ]);

      return {
        profile: profile.status === 'fulfilled' ? profile.value : null,
        equipment: equipment.status === 'fulfilled' ? equipment.value : null,
        specs: specs.status === 'fulfilled' ? specs.value : null,
        media: media.status === 'fulfilled' ? media.value : null
      };
    } catch (error) {
      console.error(`Error fetching full character data for ${characterName}:`, error);
      throw error;
    }
  }

  // Calculate average item level from equipment
  calculateAverageItemLevel(equipment) {
    if (!equipment || !equipment.equipped_items) {
      return 0;
    }

    const items = equipment.equipped_items;
    const totalItemLevel = items.reduce((sum, item) => sum + (item.level?.value || 0), 0);
    return Math.round(totalItemLevel / items.length);
  }

  // Get active specialization
  getActiveSpec(specs) {
    if (!specs || !specs.specializations || specs.specializations.length === 0) {
      return null;
    }

    // Try to find the active spec (different properties might be used)
    let activeSpec = specs.specializations.find(spec =>
      spec.active_specialization || spec.is_active || spec.active
    );

    // If no active spec found, use the first one (most likely the active one)
    if (!activeSpec) {
      activeSpec = specs.specializations[0];
    }

    // Also check if there's an active_specialization at the root level
    if (!activeSpec && specs.active_specialization) {
      activeSpec = { specialization: specs.active_specialization };
    }

    return activeSpec;
  }

  // Clear character cache
  clearCharacterCache(realmSlug, characterName) {
    const keys = [
      'character-profile',
      'character-equipment',
      'character-specs',
      'character-media'
    ];

    keys.forEach(type => {
      const cacheKey = cacheService.generateKey(type, realmSlug, characterName);
      cacheService.clear(cacheKey);
      this.characterCache.delete(cacheKey);
    });
  }
}

export default new CharacterService();
