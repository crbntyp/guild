// Main application JavaScript
import GuildRoster from './components/guild-roster.js';
import GuildSearch from './components/guild-search.js';
import PageInitializer from './utils/page-initializer.js';
import characterModal from './components/character-modal.js';
import config from './config.js';
import { slugToFriendly } from './utils/helpers.js';
import { updateRegionConfig, updateGuildConfig, clearRosterState } from './utils/config-utils.js';

console.log('⚡ Guild Site initialized');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    onInit: async () => {
      // Initialize character modal
      characterModal.init();

      // Initialize guild search
      const guildSearch = new GuildSearch('guild-search-container');
      await guildSearch.render();

  // Create guild roster instance (initially hidden)
  const guildRoster = new GuildRoster('guild-roster-container');

  // Show landing page initially (before any search)
  function showInfoPanel() {
    const rosterContainer = document.getElementById('guild-roster-container');

    rosterContainer.innerHTML = `
      <div class="home-landing">
        <div class="home-hero">
          <div class="home-badge">gld__</div>
          <h1>Your World of Warcraft Companion</h1>
          <p class="home-subtitle">Guild roster viewer, raid signups, Mythic+ leaderboards, mount collections, event tracking, and more — all powered by the Battle.net API.</p>
          <p class="home-search-hint"><i class="las la-arrow-up"></i> Search any guild above to get started</p>
        </div>

        <div class="home-features">
          <div class="home-feature">
            <div class="home-feature-icon"><i class="las la-users"></i></div>
            <h3>Guild Roster</h3>
            <p>Browse any guild's roster with class colours, item levels, specs, and detailed character modals.</p>
          </div>
          <div class="home-feature">
            <div class="home-feature-icon"><i class="las la-dungeon"></i></div>
            <h3>Raid Signups</h3>
            <p>Discord-powered raid creation with role-based signups, reserves, and real-time notifications.</p>
          </div>
          <div class="home-feature">
            <div class="home-feature-icon"><i class="las la-trophy"></i></div>
            <h3>Mythic+</h3>
            <p>Live leaderboards, meta composition analysis, and spec distribution across the top runs.</p>
          </div>
          <div class="home-feature">
            <div class="home-feature-icon"><i class="las la-horse"></i></div>
            <h3>Mount Collection</h3>
            <p>Browse your mounts by expansion with Wowhead tooltips. Track what you own and what's farmable.</p>
          </div>
          <div class="home-feature">
            <div class="home-feature-icon"><i class="las la-calendar"></i></div>
            <h3>Events</h3>
            <p>Live WoW event calendar with countdowns, auto-refreshed daily from Wowhead data.</p>
          </div>
          <div class="home-feature">
            <div class="home-feature-icon"><i class="lab la-youtube"></i></div>
            <h3>YouTube</h3>
            <p>Curate your favourite WoW creators with tag-based filtering and in-app video playback.</p>
          </div>
        </div>
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
