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

        <div class="home-demo-section">
          <div class="home-demo-carousel">
            <div class="home-demo-track">

              <div class="member-card demo-card-char" style="min-width: 180px; max-width: 180px; pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">263</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/249/186044665-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #0070DE">Thundathighs</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Farseer</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/0/03/IconSmall_Dwarf_Female.gif" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/spell_nature_magicimmunity.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="min-width: 180px; max-width: 180px; pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">258</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/20/187909908-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #FF7D0A">Gaibe</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Druid of the Claw</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/4/41/IconSmall_Tauren_Male.gif" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/ability_druid_maul.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="min-width: 180px; max-width: 180px; pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">269</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/58/170575674-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #A330C9">Felbladë</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Fel-Scarred</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/7/72/IconSmall_BloodElf_Female.png" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/ability_demonhunter_spectank.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="min-width: 180px; max-width: 180px; pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">245</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/139/174922379-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #C79C6E">Avöid</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Colossus</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/e/e8/IconSmall_VoidElf_Male.gif" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/ability_warrior_savageblow.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="min-width: 180px; max-width: 180px; pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">251</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/41/171269673-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #8787ED">Blighthöund</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Diabolist</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/8/83/IconSmall_Undead_Female.gif" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/spell_shadow_metamorphosis.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

            </div>
          </div>
        </div>

        <div class="home-features">
          <a href="index.html" class="home-feature">
            <div class="home-feature-icon"><i class="las la-users"></i></div>
            <h3>Guild Roster</h3>
            <p>Browse any guild's roster with class colours, item levels, specs, and detailed character modals.</p>
          </a>
          <a href="my-characters.html" class="home-feature">
            <div class="home-feature-icon"><i class="las la-user"></i></div>
            <h3>My Characters</h3>
            <p>View all your characters across realms. Inspect gear, raid progression, Mythic+ stats, and full equipment with Wowhead tooltips.</p>
          </a>
          <a href="raids.html" class="home-feature">
            <div class="home-feature-icon"><i class="las la-dungeon"></i></div>
            <h3>Raid Signups</h3>
            <p>Discord-powered raid creation with role-based signups, reserves, and real-time notifications.</p>
          </a>
          <a href="mythic-plus.html" class="home-feature">
            <div class="home-feature-icon"><i class="las la-trophy"></i></div>
            <h3>Mythic+</h3>
            <p>Live leaderboards, meta composition analysis, and spec distribution across the top runs.</p>
          </a>
          <a href="my-mounts.html" class="home-feature">
            <div class="home-feature-icon"><i class="las la-horse"></i></div>
            <h3>Mount Collection</h3>
            <p>Browse your mounts by expansion with Wowhead tooltips. Track what you own and what's farmable.</p>
          </a>
          <a href="events.html" class="home-feature">
            <div class="home-feature-icon"><i class="las la-calendar"></i></div>
            <h3>Events</h3>
            <p>Live WoW event calendar with countdowns, auto-refreshed daily from Wowhead data.</p>
          </a>
          <a href="my-youtube.html" class="home-feature">
            <div class="home-feature-icon"><i class="lab la-youtube"></i></div>
            <h3>YouTube</h3>
            <p>Curate your favourite WoW creators with tag-based filtering and in-app video playback.</p>
          </a>
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
