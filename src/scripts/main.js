// Main application JavaScript
import GuildRoster from './components/guild-roster.js';
import GuildSearch from './components/guild-search.js';
import BackgroundRotator from './components/background-rotator.js';
import TopBar from './components/top-bar.js';
import config from './config.js';
import { slugToFriendly } from './utils/helpers.js';

console.log('⚡ Guild Site initialized');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize top bar (login)
  const topBar = new TopBar();
  await topBar.init();

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

  // Initialize guild search
  const guildSearch = new GuildSearch('guild-search-container');
  await guildSearch.render();

  // Create guild roster instance (initially hidden)
  const guildRoster = new GuildRoster('guild-roster-container');

  // Show info panel initially (before any search)
  function showInfoPanel() {
    const rosterContainer = document.getElementById('guild-roster-container');
    rosterContainer.innerHTML = `
      <div class="guild-search-info">
        <div class="info-icon">
          <i class="las la-search"></i>
          <h2>Find Your Guild</h2>
        </div>
        
        <p>Search for any World of Warcraft guild in EU or US to view their roster, member details, and more.</p>
      </div>
    `;
  }

  // Set up search callback
  guildSearch.setOnSearchCallback(async ({ guildName, realm, region }) => {
    console.log(`🔍 Searching for guild: ${guildName} on ${realm} (${region})`);

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
    const regionLower = region.toLowerCase();
    config.guild.name = guildName.toLowerCase().replace(/\s+/g, '-');
    config.guild.realm = realm.toLowerCase().replace(/\s+/g, '-');
    config.guild.realmSlug = realm.toLowerCase().replace(/\s+/g, '-');
    config.guild.nameSlug = guildName.toLowerCase().replace(/\s+/g, '-');
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

    console.log('✅ Updated config:', {
      guild: config.guild,
      region: config.battlenet.region,
      namespace: config.api.namespace,
      locale: config.api.locale
    });

    // Clear roster state
    guildRoster.roster = null;
    guildRoster.itemLevels.clear();
    guildRoster.genders.clear();
    guildRoster.invalidCharacters.clear();
    guildRoster.characterSpecs.clear();

    // Load the guild roster
    try {
      await guildRoster.load();
    } catch (error) {
      console.error('Failed to load guild roster:', error);
    }
  });

  // Check if there's a guild query in URL (for direct links)
  const urlParams = new URLSearchParams(window.location.search);
  const guildParam = urlParams.get('guild');
  const realmParam = urlParams.get('realm');
  const regionParam = urlParams.get('region');

  if (guildParam && realmParam && regionParam) {
    // Load guild from URL parameters
    const regionLower = regionParam.toLowerCase();
    config.guild.name = guildParam.toLowerCase();
    config.guild.realm = realmParam.toLowerCase();
    config.guild.realmSlug = realmParam.toLowerCase();
    config.guild.nameSlug = guildParam.toLowerCase();
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
    console.log('🔍 Checking for last search:', lastSearch);
    if (lastSearch) {
      try {
        const searchParams = JSON.parse(lastSearch);
        console.log('📦 Restoring last guild search:', searchParams);

        // Trigger the search callback with stored parameters
        guildSearch.setOnSearchCallback(guildSearch.onSearch);

        // Load the guild directly
        const regionLower = searchParams.region.toLowerCase();
        config.guild.name = searchParams.guildName.toLowerCase().replace(/\s+/g, '-');
        config.guild.realm = searchParams.realm.toLowerCase().replace(/\s+/g, '-');
        config.guild.realmSlug = searchParams.realm.toLowerCase().replace(/\s+/g, '-');
        config.guild.nameSlug = searchParams.guildName.toLowerCase().replace(/\s+/g, '-');
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

        // Clear cache
        const guildService = (await import('./services/guild-service.js')).default;
        guildService.clearCache();

        // Clear roster state
        guildRoster.roster = null;
        guildRoster.itemLevels.clear();
        guildRoster.genders.clear();
        guildRoster.invalidCharacters.clear();

        await guildRoster.load();
      } catch (error) {
        console.error('Failed to restore last guild search:', error);
        showInfoPanel();
      }
    } else {
      // No previous search, show info panel
      console.log('📋 No previous search found, showing info panel');
      showInfoPanel();
    }
  }
});
