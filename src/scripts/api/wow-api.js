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
      // Don't log 404s or 403s - they're expected for characters that don't exist or have privacy settings
      if (error.status !== 404 && error.status !== 403) {
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

  // Get item data
  async getItem(itemId) {
    const endpoint = `/data/wow/item/${itemId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching item data for item ${itemId}:`, error);
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

  // Get spell data
  async getSpell(spellId) {
    const endpoint = `/data/wow/spell/${spellId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching spell data for spell ${spellId}:`, error);
      throw error;
    }
  }

  // Get spell media
  async getSpellMedia(spellId) {
    const endpoint = `/data/wow/media/spell/${spellId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching spell media for spell ${spellId}:`, error);
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

  // Get playable specialization media
  async getPlayableSpecializationMedia(specId) {
    const endpoint = `/data/wow/media/playable-specialization/${specId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching spec media for spec ${specId}:`, error);
      throw error;
    }
  }

  // Get character encounters (raid progression)
  async getCharacterEncounters(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/encounters`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters without raid data
      if (error.status !== 404) {
        console.error(`Error fetching character encounters for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Get character mythic keystone profile
  async getCharacterMythicKeystoneProfile(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/mythic-keystone-profile`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters without M+ data
      if (error.status !== 404) {
        console.error(`Error fetching mythic keystone profile for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Get journal instance (raid) media
  async getJournalInstanceMedia(instanceId) {
    const endpoint = `/data/wow/media/journal-instance/${instanceId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching journal instance media for instance ${instanceId}:`, error);
      throw error;
    }
  }

  // Get WoW Token price
  async getWoWTokenPrice() {
    const endpoint = '/data/wow/token/index';

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching WoW Token price:', error);
      throw error;
    }
  }

  // Get Mythic Keystone Leaderboards for a specific dungeon
  async getMythicKeystoneLeaderboard(dungeonId, period) {
    const endpoint = `/data/wow/connected-realm/${config.guild.connectedRealmId}/mythic-leaderboard/${dungeonId}/period/${period}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for dungeons not in current season rotation
      if (error.status !== 404) {
        console.error(`Error fetching mythic keystone leaderboard for dungeon ${dungeonId}:`, error);
      }
      throw error;
    }
  }

  // Get Mythic Keystone Season details
  async getMythicKeystoneSeasonDetails(seasonId) {
    const endpoint = `/data/wow/mythic-keystone/season/${seasonId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching mythic keystone season ${seasonId}:`, error);
      throw error;
    }
  }

  // Get Mythic Keystone Seasons Index
  async getMythicKeystoneSeasons() {
    const endpoint = '/data/wow/mythic-keystone/season/index';

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching mythic keystone seasons:', error);
      throw error;
    }
  }

  // Get Mythic Keystone Period details
  async getMythicKeystonePeriod(periodId) {
    const endpoint = `/data/wow/mythic-keystone/period/${periodId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching mythic keystone period ${periodId}:`, error);
      throw error;
    }
  }

  // Get Mythic Keystone Dungeons Index
  async getMythicKeystoneDungeons() {
    const endpoint = '/data/wow/mythic-keystone/dungeon/index';

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching mythic keystone dungeons:', error);
      throw error;
    }
  }

  // Get Mythic Keystone Dungeon details
  async getMythicKeystoneDungeon(dungeonId) {
    const endpoint = `/data/wow/mythic-keystone/dungeon/${dungeonId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.dynamic
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching mythic keystone dungeon ${dungeonId}:`, error);
      throw error;
    }
  }

  // Get Journal Instances Index
  async getJournalInstances() {
    const endpoint = '/data/wow/journal-instance/index';

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching journal instances:', error);
      throw error;
    }
  }

  // Get Journal Instance details
  async getJournalInstance(instanceId) {
    const endpoint = `/data/wow/journal-instance/${instanceId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching journal instance ${instanceId}:`, error);
      throw error;
    }
  }

  // Get character collections - mounts
  async getCharacterMountsCollection(realmSlug, characterName, accessToken) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/collections/mounts`;

    try {
      const url = `${config.getApiUrl()}${endpoint}`;
      const params = new URLSearchParams({
        namespace: config.api.namespace.profile,
        locale: config.api.locale
      });

      const response = await fetch(`${url}?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });

      if (!response.ok) {
        if (response.status === 404 || response.status === 403) {
          console.warn(`Character mounts not found or private for ${characterName}`);
        } else {
          console.error(`Error fetching character mounts for ${characterName}:`, response.status);
        }
        const error = new Error(`API request failed: ${response.status} ${response.statusText}`);
        error.status = response.status;
        throw error;
      }

      return await response.json();
    } catch (error) {
      if (error.status !== 404 && error.status !== 403) {
        console.error(`Error fetching character mounts for ${characterName}:`, error);
      }
      throw error;
    }
  }

  // Get mount data by ID
  async getMountData(mountId) {
    const endpoint = `/data/wow/mount/${mountId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.static
        }
      });
      return data;
    } catch (error) {
      console.error(`Error fetching mount ${mountId}:`, error);
      return null;
    }
  }
}

export default new WoWAPI();
