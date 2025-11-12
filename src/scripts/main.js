// Main application JavaScript
import GuildRoster from './components/guild-roster.js';
import GuildSearch from './components/guild-search.js';
import PageInitializer from './utils/page-initializer.js';
import characterModal from './components/character-modal.js';
import config from './config.js';
import { slugToFriendly } from './utils/helpers.js';
import { updateRegionConfig, updateGuildConfig, clearRosterState } from './utils/config-utils.js';
import wowApi from './api/wow-api.js';

console.log('⚡ Guild Site initialized');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    onInit: async () => {
      // Initialize character modal
      characterModal.init();

      // Fetch and log WoW Token price
      let tokenPrice = null;
      try {
        const tokenData = await wowApi.getWoWTokenPrice();

        // Convert copper to gold (10,000 copper = 1 gold)
        const goldPrice = (tokenData.price / 10000).toLocaleString('en-US', {
          minimumFractionDigits: 0,
          maximumFractionDigits: 0
        });

        // Convert timestamp to readable date
        const lastUpdated = new Date(tokenData.last_updated_timestamp);
        const formattedDate = lastUpdated.toLocaleString('en-US', {
          dateStyle: 'medium',
          timeStyle: 'short'
        });

        // Format for display: "day month"
        const displayDate = lastUpdated.toLocaleDateString('en-US', {
          day: 'numeric',
          month: 'short'
        });

        tokenPrice = { gold: goldPrice, date: displayDate };

        console.log('💰 WoW Token Price:');
        console.log(`   Gold Value: ${goldPrice}g`);
        console.log(`   Last Updated: ${formattedDate}`);
        console.log('   Raw Data:', tokenData);
      } catch (error) {
        console.error('Failed to fetch WoW Token price:', error);
      }

      // Initialize guild search
      const guildSearch = new GuildSearch('guild-search-container');
      await guildSearch.render();

  // Create guild roster instance (initially hidden)
  const guildRoster = new GuildRoster('guild-roster-container');

  // Show info panel initially (before any search)
  function showInfoPanel() {
    const rosterContainer = document.getElementById('guild-roster-container');

    const tokenPriceHTML = tokenPrice
      ? `<p class="token-price">Token cost as of ${tokenPrice.date} = ${tokenPrice.gold}g</p>`
      : '';

    rosterContainer.innerHTML = `
      <div class="guild-search-info">
        <div class="info-logo">
          <img src="img/app-guild.png" alt="App Logo" />
        </div>
        <div class="info-header">
          <h2>Guild</h2>
        </div>

        <p>An app to serve your day to day, build todos for your adventures, add your favourite youtube channels for talents, expansions and whatever else! <br /><br />Get started and login with your BNet account <i class="las la-heart"></i></p>
        ${tokenPriceHTML}
      </div>
    `;
  }

  // Set up search callback
  guildSearch.setOnSearchCallback(async ({ guildName, realm, region }) => {

    // Store search parameters in sessionStorage for persistence
    sessionStorage.setItem('lastGuildSearch', JSON.stringify({
      guildName,
      realm,
      region
    }));

    // Clear the guild service cache before updating config
    const guildService = (await import('./services/guild-service.js')).default;
    guildService.clearCache();

    // Clear enriched roster cache for the OLD guild (before config update)
    const oldEnrichedCacheKey = `enriched-roster:${config.guild.realmSlug}:${config.guild.nameSlug}`;
    localStorage.removeItem(oldEnrichedCacheKey);

    // Update config with search parameters
    updateGuildConfig(guildName, realm);
    updateRegionConfig(region);

    // Clear roster state
    clearRosterState(guildRoster);

    // Load the guild roster
    try {
      await guildRoster.load();
    } catch (error) {
      console.error('Failed to load guild roster:', error);
    }
  });

  // Set up clear results callback
  guildSearch.setOnClearCallback(() => {
    // Clear session storage
    sessionStorage.removeItem('lastGuildSearch');

    // Clear roster state
    clearRosterState(guildRoster);

    // Show info panel
    showInfoPanel();
  });

  // Check if there's a guild query in URL (for direct links)
  const urlParams = new URLSearchParams(window.location.search);
  const guildParam = urlParams.get('guild');
  const realmParam = urlParams.get('realm');
  const regionParam = urlParams.get('region');

  if (guildParam && realmParam && regionParam) {
    // Load guild from URL parameters
    updateGuildConfig(guildParam, realmParam);
    updateRegionConfig(regionParam);

    // Clear cache
    const guildService = (await import('./services/guild-service.js')).default;
    guildService.clearCache();

    try {
      await guildRoster.load();
    } catch (error) {
      console.error('Failed to load guild roster:', error);
    }
  } else {
    // Check for last search in sessionStorage (for back navigation)
    const lastSearch = sessionStorage.getItem('lastGuildSearch');

    if (lastSearch) {
      try {
        const searchParams = JSON.parse(lastSearch);

        // Load the guild directly
        updateGuildConfig(searchParams.guildName, searchParams.realm);
        updateRegionConfig(searchParams.region);

        // Clear cache
        const guildService = (await import('./services/guild-service.js')).default;
        guildService.clearCache();

        // Clear roster state
        clearRosterState(guildRoster);

        await guildRoster.load();
      } catch (error) {
        console.error('Failed to restore last guild search:', error);
        showInfoPanel();
      }
    } else {
      // No previous search, show info panel

      showInfoPanel();
    }
  }
    }
  });
});
