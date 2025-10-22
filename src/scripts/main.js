// Main application JavaScript
import GuildRoster from './components/guild-roster.js';
import BackgroundRotator from './components/background-rotator.js';
import config from './config.js';
import { slugToFriendly } from './utils/helpers.js';

console.log('⚡ Guild Site initialized');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize background rotator
  const backgroundImages = [
    'img/bgs/bg-mulgore.jpg',
    'img/bgs/bg-tglades.jpg',
    'img/bgs/bg-eversong.jpg',
    'img/bgs/bg-shadowglen.jpg',
    'img/bgs/bg-suramar.jpg',
    'img/bgs/bg-echoisles.jpg',
    'img/bgs/bg-freach.jpg',
    'img/bgs/bg-dmorogh.jpg',
    'img/bgs/bg-goldshire.jpg',
    'img/bgs/bg-azuremyst.jpg',
    'img/bgs/bg-gilneas.jpg',
    'img/bgs/bg-wisle.jpg',
    'img/bgs/bg-durotar.jpg',
    'img/bgs/bg-kezan.jpg'
  ];

  const bgRotator = new BackgroundRotator(backgroundImages, 8000, 2000);
  bgRotator.init();

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
