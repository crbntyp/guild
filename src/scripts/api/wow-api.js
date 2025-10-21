import battlenetClient from './battlenet-client.js';
import config from '../config.js';

class WoWAPI {
  // Get guild roster
  async getGuildRoster() {
    const endpoint = `/data/wow/guild/${config.guild.realmSlug}/${config.guild.nameSlug}/roster`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching guild roster:', error);
      throw error;
    }
  }

  // Get guild info
  async getGuildInfo() {
    const endpoint = `/data/wow/guild/${config.guild.realmSlug}/${config.guild.nameSlug}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching guild info:', error);
      throw error;
    }
  }

  // Get character profile summary
  async getCharacterProfile(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters that don't exist
      if (error.status !== 404) {
        console.error(`Error fetching character profile for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Get character equipment
  async getCharacterEquipment(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/equipment`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching character equipment for ${characterName}:`, error);
      throw error;
    }
  }

  // Get character specializations
  async getCharacterSpecializations(realmSlug, characterName) {
    // Encode character name to handle special characters
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/specializations`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters that don't exist
      if (error.status !== 404) {
        console.error(`Error fetching character specializations for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Get character media (avatar, bust, render)
  async getCharacterMedia(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/character-media`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters that don't exist
      if (error.status !== 404) {
        console.error(`Error fetching character media for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Get playable classes (static data)
  async getPlayableClasses() {
    const endpoint = '/data/wow/playable-class/index';

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching playable classes:', error);
      throw error;
    }
  }

  // Get playable races (static data)
  async getPlayableRaces() {
    const endpoint = '/data/wow/playable-race/index';

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching playable races:', error);
      throw error;
    }
  }

  // Get realm info
  async getRealmInfo(realmSlug) {
    const endpoint = `/data/wow/realm/${realmSlug}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching realm info for ${realmSlug}:`, error);
      throw error;
    }
  }

  // Get item media (icon)
  async getItemMedia(itemId) {
    const endpoint = `/data/wow/media/item/${itemId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching item media for item ${itemId}:`, error);
      throw error;
    }
  }

  // Get playable class media
  async getPlayableClassMedia(classId) {
    const endpoint = `/data/wow/media/playable-class/${classId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching class media for class ${classId}:`, error);
      throw error;
    }
  }

  // Get playable race data (includes icon reference)
  async getPlayableRace(raceId) {
    const endpoint = `/data/wow/playable-race/${raceId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching race data for race ${raceId}:`, error);
      throw error;
    }
  }

  // Get playable specialization data (includes media reference)
  async getPlayableSpecialization(specId) {
    const endpoint = `/data/wow/playable-specialization/${specId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching spec data for spec ${specId}:`, error);
      throw error;
    }
  }
}

export default new WoWAPI();
