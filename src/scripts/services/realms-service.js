import battlenetClient from '../api/battlenet-client.js';
import config from '../config.js';

/**
 * Realms Service - Fetch and cache realm lists for EU and US
 */
class RealmsService {
  constructor() {
    this.realms = {
      eu: [],
      us: []
    };
    this.loaded = false;
  }

  /**
   * Fetch realms for both EU and US regions
   */
  async fetchRealms() {
    if (this.loaded) {
      return this.realms;
    }

    try {
      console.log('🌍 Fetching realm lists...');

      // Fetch EU realms
      const euRealms = await this.fetchRealmsByRegion('eu');
      this.realms.eu = euRealms;

      // Fetch US realms
      const usRealms = await this.fetchRealmsByRegion('us');
      this.realms.us = usRealms;

      this.loaded = true;
      console.log(`✅ Loaded ${euRealms.length} EU realms and ${usRealms.length} US realms`);

      return this.realms;
    } catch (error) {
      console.error('❌ Error fetching realms:', error);
      throw error;
    }
  }

  /**
   * Fetch realms for a specific region
   */
  async fetchRealmsByRegion(region) {
    const originalRegion = config.battlenet.region;
    const originalNamespace = config.api.namespace;

    try {
      // Temporarily set the region
      config.battlenet.region = region;
      config.api.namespace = {
        static: `static-${region}`,
        dynamic: `dynamic-${region}`,
        profile: `profile-${region}`
      };

      const endpoint = '/data/wow/realm/index';
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });

      // Extract and sort realms
      const realms = (data.realms || [])
        .map(realm => ({
          id: realm.id,
          name: realm.name,
          slug: realm.slug
        }))
        .sort((a, b) => a.name.localeCompare(b.name));

      return realms;
    } finally {
      // Restore original region and namespace
      config.battlenet.region = originalRegion;
      config.api.namespace = originalNamespace;
    }
  }

  /**
   * Get realms for a specific region
   */
  getRealms(region) {
    return this.realms[region] || [];
  }

  /**
   * Get all realms
   */
  getAllRealms() {
    return this.realms;
  }
}

export default new RealmsService();
