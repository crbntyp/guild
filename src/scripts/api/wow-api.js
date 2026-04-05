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

  // Get guild achievements
  async getGuildAchievements() {
    const endpoint = `/data/wow/guild/${config.guild.realmSlug}/${config.guild.nameSlug}/achievements`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching guild achievements:', error);
      throw error;
    }
  }

  // Get guild activity feed (player achievements, encounter kills, etc.)
  async getGuildActivity() {
    const endpoint = `/data/wow/guild/${config.guild.realmSlug}/${config.guild.nameSlug}/activity`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      console.error('Error fetching guild activity:', error);
      throw error;
    }
  }

  // Normalize a Blizzard media asset to a URL string.
  // Handles every shape I've seen: plain string, {value: string},
  // {value: {href: string}}, {href: string}, or the asset itself being a URL string.
  _extractAssetUrl(asset) {
    if (!asset) return null;
    if (typeof asset === 'string') return asset;
    // asset.value can be a string or { href: string }
    const v = asset.value;
    if (typeof v === 'string') return v;
    if (v && typeof v === 'object' && typeof v.href === 'string') return v.href;
    // top-level href fallback
    if (typeof asset.href === 'string') return asset.href;
    // any other string-typed field we can find
    for (const key of ['url', 'src', 'path']) {
      if (typeof asset[key] === 'string') return asset[key];
    }
    console.warn('[_extractAssetUrl] could not extract url from asset:', asset);
    return null;
  }

  // Get achievement media (icon)
  async getAchievementMedia(achievementId) {
    try {
      const data = await battlenetClient.request(`/data/wow/media/achievement/${achievementId}`, {
        params: { namespace: config.api.namespace.static }
      });
      const icon = data?.assets?.find(a => a.key === 'icon');
      return this._extractAssetUrl(icon);
    } catch (error) {
      return null;
    }
  }

  // Get journal encounter details (includes boss creature displays)
  async getJournalEncounter(encounterId) {
    try {
      const data = await battlenetClient.request(`/data/wow/journal-encounter/${encounterId}`, {
        params: { namespace: config.api.namespace.static }
      });
      return data;
    } catch (error) {
      return null;
    }
  }

  // List every expansion in the journal (Classic → current)
  async getJournalExpansionIndex() {
    try {
      return await battlenetClient.request('/data/wow/journal-expansion/index', {
        params: { namespace: config.api.namespace.static }
      });
    } catch (error) {
      console.error('Error fetching journal expansion index:', error);
      return null;
    }
  }

  // Full expansion details — includes raids[] and dungeons[]
  async getJournalExpansion(expansionId) {
    try {
      return await battlenetClient.request(`/data/wow/journal-expansion/${expansionId}`, {
        params: { namespace: config.api.namespace.static }
      });
    } catch (error) {
      console.error(`Error fetching journal expansion ${expansionId}:`, error);
      return null;
    }
  }

  // Instance details — includes encounters[] for that raid/dungeon
  async getJournalInstance(instanceId) {
    try {
      return await battlenetClient.request(`/data/wow/journal-instance/${instanceId}`, {
        params: { namespace: config.api.namespace.static }
      });
    } catch (error) {
      console.error(`Error fetching journal instance ${instanceId}:`, error);
      return null;
    }
  }

  // Get creature display media (boss portrait)
  async getCreatureDisplayMedia(displayId) {
    try {
      const data = await battlenetClient.request(`/data/wow/media/creature-display/${displayId}`, {
        params: { namespace: config.api.namespace.static }
      });
      console.log(`[creature-display ${displayId}] assets:`, data?.assets?.map(a => ({ key: a.key, value: a.value })));
      const asset = data?.assets?.find(a => a.key === 'zoom-in' || a.key === 'icon')
        || data?.assets?.[0];
      return this._extractAssetUrl(asset);
    } catch (error) {
      return null;
    }
  }

  // Get profession media — returns { icon, banner } with all available assets
  async getProfessionMedia(professionId) {
    try {
      const data = await battlenetClient.request(`/data/wow/media/profession/${professionId}`, {
        params: { namespace: config.api.namespace.static }
      });
      console.log(`[profession ${professionId}] assets:`, data?.assets?.map(a => ({ key: a.key, value: a.value })));
      const assets = {};
      for (const a of (data?.assets || [])) {
        assets[a.key] = this._extractAssetUrl(a);
      }
      return {
        icon: assets.icon || null,
        banner: assets.banner || assets.header || assets['banner-image'] || null,
        all: assets
      };
    } catch (error) {
      return null;
    }
  }

  // Get journal instance media (raid/dungeon banner image)
  async getJournalInstanceMedia(instanceId) {
    try {
      const data = await battlenetClient.request(`/data/wow/media/journal-instance/${instanceId}`, {
        params: { namespace: config.api.namespace.static }
      });
      console.log(`[journal-instance ${instanceId}] assets:`, data?.assets?.map(a => ({ key: a.key, value: a.value })));
      const asset = data?.assets?.find(a => a.key === 'tile') || data?.assets?.[0];
      return this._extractAssetUrl(asset);
    } catch (error) {
      return null;
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

  // Get character achievements (for AOTC / Cutting Edge detection)
  async getCharacterAchievements(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/achievements`;
    try {
      const data = await battlenetClient.request(endpoint, {
        params: { namespace: config.api.namespace.profile }
      });
      return data;
    } catch (error) {
      if (error.status !== 404) {
        console.error(`Error fetching achievements for ${characterName}:`, error);
      }
      return null;
    }
  }

  // Get character professions (primaries + secondaries with tiers)
  async getCharacterProfessions(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/professions`;
    try {
      const data = await battlenetClient.request(endpoint, {
        params: { namespace: config.api.namespace.profile }
      });
      return data;
    } catch (error) {
      if (error.status !== 404) {
        console.error(`Error fetching professions for ${characterName}:`, error);
      }
      return null;
    }
  }

  // Get character raid encounters specifically (progression per raid/difficulty)
  async getCharacterRaidEncounters(realmSlug, characterName) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/encounters/raids`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      if (error.status !== 404) {
        console.error(`Error fetching raid encounters for ${characterName}:`, error);
      }
      return null;
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

  // Get character mythic keystone season details (best runs for a specific season)
  async getCharacterMythicKeystoneSeasonDetails(realmSlug, characterName, seasonId) {
    const encodedName = encodeURIComponent(characterName.toLowerCase());
    const endpoint = `/profile/wow/character/${realmSlug}/${encodedName}/mythic-keystone-profile/season/${seasonId}`;

    try {
      const data = await battlenetClient.request(endpoint, {
        params: {
          namespace: config.api.namespace.profile
        }
      });
      return data;
    } catch (error) {
      // Don't log 404s - they're expected for characters without M+ data for that season
      if (error.status !== 404) {
        console.error(`Error fetching mythic keystone season ${seasonId} for ${characterName}:`, error);
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
