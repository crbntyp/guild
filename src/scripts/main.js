// Main application JavaScript
import GuildRoster from './components/guild-roster.js';
import config from './config.js';
import { slugToFriendly } from './utils/helpers.js';

console.log('⚡ Guild Site initialized');

// Initialize guild roster when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Set dynamic realm name in header
  const subtitleElement = document.querySelector('.subtitle');
  if (subtitleElement) {
    const realmName = slugToFriendly(config.guild.realm);
    const region = config.battlenet.region.toUpperCase();
    subtitleElement.textContent = `${realmName} (${region}) Guild Roster`;
  }

  // Create guild roster instance
  const guildRoster = new GuildRoster('guild-roster-container');

  // Load the roster
  try {
    await guildRoster.load();
  } catch (error) {
    console.error('Failed to load guild roster:', error);
  }
});
