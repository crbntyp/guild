import wowAPI from '../api/wow-api.js';
import cacheService from './cache-service.js';
import config from '../config.js';

class GuildService {
  constructor() {
    this.guildInfo = null;
    this.guildRoster = null;
    this.loading = false;
    this.error = null;
  }

  // Fetch guild info with caching
  async fetchGuildInfo(forceRefresh = false) {
    const cacheKey = cacheService.generateKey('guild-info', config.guild.realmSlug, config.guild.nameSlug);

    if (!forceRefresh && cacheService.has(cacheKey)) {
      this.guildInfo = cacheService.get(cacheKey);
      return this.guildInfo;
    }

    this.loading = true;
    this.error = null;

    try {
      const data = await wowAPI.getGuildInfo();
      this.guildInfo = data;
      cacheService.set(cacheKey, data, config.cache.guildRosterTTL);
      return data;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  // Fetch guild roster with caching
  async fetchGuildRoster(forceRefresh = false) {
    const cacheKey = cacheService.generateKey('guild-roster', config.guild.realmSlug, config.guild.nameSlug);

    if (!forceRefresh && cacheService.has(cacheKey)) {
      this.guildRoster = cacheService.get(cacheKey);
      return this.guildRoster;
    }

    this.loading = true;
    this.error = null;

    try {
      const data = await wowAPI.getGuildRoster();
      this.guildRoster = data;
      cacheService.set(cacheKey, data, config.cache.guildRosterTTL);
      return data;
    } catch (error) {
      this.error = error.message;
      throw error;
    } finally {
      this.loading = false;
    }
  }

  // Get roster members sorted and filtered
  getRosterMembers(options = {}) {
    if (!this.guildRoster || !this.guildRoster.members) {
      return [];
    }

    let members = [...this.guildRoster.members];

    // Filter by class
    if (options.classId) {
      members = members.filter(m => m.character.playable_class.id === options.classId);
    }

    // Filter by rank
    if (options.rank !== undefined) {
      members = members.filter(m => m.rank === options.rank);
    }

    // Filter by level
    if (options.minLevel) {
      members = members.filter(m => m.character.level >= options.minLevel);
    }

    // Sort
    if (options.sortBy) {
      members.sort((a, b) => {
        switch (options.sortBy) {
          case 'name':
            return a.character.name.localeCompare(b.character.name);
          case 'level':
            return b.character.level - a.character.level;
          case 'rank':
            return a.rank - b.rank;
          case 'class':
            return a.character.playable_class.id - b.character.playable_class.id;
          default:
            return 0;
        }
      });
    }

    return members;
  }

  // Get roster statistics
  getRosterStats() {
    if (!this.guildRoster || !this.guildRoster.members) {
      return null;
    }

    const members = this.guildRoster.members;
    const stats = {
      total: members.length,
      maxLevel: 0,
      averageLevel: 0,
      classCounts: {},
      rankCounts: {}
    };

    let totalLevel = 0;

    members.forEach(member => {
      const level = member.character.level;
      const classId = member.character.playable_class.id;
      const rank = member.rank;

      // Max level
      if (level > stats.maxLevel) {
        stats.maxLevel = level;
      }

      // Total level for average
      totalLevel += level;

      // Class counts
      stats.classCounts[classId] = (stats.classCounts[classId] || 0) + 1;

      // Rank counts
      stats.rankCounts[rank] = (stats.rankCounts[rank] || 0) + 1;
    });

    stats.averageLevel = Math.round(totalLevel / members.length);

    return stats;
  }

  // Clear all guild data cache
  clearCache() {
    const infoKey = cacheService.generateKey('guild-info', config.guild.realmSlug, config.guild.nameSlug);
    const rosterKey = cacheService.generateKey('guild-roster', config.guild.realmSlug, config.guild.nameSlug);

    cacheService.clear(infoKey);
    cacheService.clear(rosterKey);

    this.guildInfo = null;
    this.guildRoster = null;
  }
}

export default new GuildService();
