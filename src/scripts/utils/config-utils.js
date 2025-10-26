/**
 * Config Utilities
 * Helper functions for managing application configuration
 */

import config from '../config.js';

/**
 * Update region-specific configuration
 * Sets region, namespace, and locale based on the provided region
 *
 * @param {string} region - Region code (eu, us, kr, tw)
 */
export function updateRegionConfig(region) {
  const regionLower = region.toLowerCase();

  // Update Battle.net region
  config.battlenet.region = regionLower;

  // Update namespace based on region
  config.api.namespace = {
    static: `static-${regionLower}`,
    dynamic: `dynamic-${regionLower}`,
    profile: `profile-${regionLower}`
  };

  // Update locale based on region
  const localeMap = {
    eu: 'en_GB',
    us: 'en_US',
    kr: 'ko_KR',
    tw: 'zh_TW'
  };
  config.api.locale = localeMap[regionLower] || 'en_US';
}

/**
 * Update guild-specific configuration
 * Sets guild name, realm, and slugs
 *
 * @param {string} guildName - Guild name
 * @param {string} realm - Realm name
 */
export function updateGuildConfig(guildName, realm) {
  config.guild.name = guildName.toLowerCase().replace(/\s+/g, '-');
  config.guild.realm = realm.toLowerCase().replace(/\s+/g, '-');
  config.guild.realmSlug = realm.toLowerCase().replace(/\s+/g, '-');
  config.guild.nameSlug = guildName.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Clear guild roster state
 * Resets all cached roster data
 *
 * @param {Object} guildRoster - GuildRoster instance
 */
export function clearRosterState(guildRoster) {
  guildRoster.roster = null;
  guildRoster.itemLevels.clear();
  guildRoster.genders.clear();
  guildRoster.invalidCharacters.clear();
  guildRoster.characterSpecs.clear();
}
