// Main application JavaScript
import GuildRoster from './components/guild-roster.js';
import GuildSearch from './components/guild-search.js';
import PageInitializer from './utils/page-initializer.js';
import characterModal from './components/character-modal.js';
import config from './config.js';

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
          <h2 class="home-section-title">Search EU/US Guild Rosters & View Your own Characters</h2>
          <p class="home-demo-desc">Browse any guild's roster, including your entire character list. View item levels, specs, and detailed character modals with gear inspection and raid/mythic progression.</p>
          <div class="home-demo-carousel">
            <div class="home-demo-track">

              <div class="member-card demo-card-char" style="pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">263</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/243/171270131-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #F58CBA">Bäsics</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Templar</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/7/72/IconSmall_BloodElf_Female.png" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/paladin_retribution.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">258</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/115/171270003-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #FFF569">Fëlstriker</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Deathstalker</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/7/72/IconSmall_BloodElf_Female.png" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/ability_rogue_deadlybrew.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">269</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/58/170575674-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #A330C9">Felbladë</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Fel-Scarred</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/7/72/IconSmall_BloodElf_Female.png" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/ability_demonhunter_spectank.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="pointer-events: none;">
                <div class="member-level">90<span class="member-ilvl">245</span></div>
                <div class="character-avatar-placeholder" style="height: 120px;"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/242/171303154-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                <div class="member-header"><div class="member-name" style="color: #ABD473">Corpsehöund</div><div class="member-hero-talent" style="font-size:9px; color: rgba(255,255,255,0.4)">Pack Leader</div></div>
                <div class="member-details">
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://static.wikia.nocookie.net/wowpedia/images/8/83/IconSmall_Undead_Female.gif" class="demo-icon" /></div></div>
                  <div class="member-detail-row"><div class="member-icon"><img src="https://wow.zamimg.com/images/wow/icons/large/ability_hunter_bestialdiscipline.jpg" class="demo-icon" /></div></div>
                </div>
              </div>

              <div class="member-card demo-card-char" style="pointer-events: none;">
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

        <div class="home-demo-section">
          <h2 class="home-section-title">Raid Signups</h2>
          <p class="home-demo-desc">Discord-powered raid creation with role-based signups, reserves, and real-time notifications back to your server.</p>
          <div class="home-demo-carousel">
            <div class="home-demo-track">
              <div class="raid-card status-open demo-card" style="min-width: 300px; max-width: 300px;">
                <div class="raid-card-banner" style="background-image: url('https://render.worldofwarcraft.com/us/zones/the-voidspire-small.jpg')">
                  <div class="raid-card-banner-overlay"></div>
                  <div class="raid-card-banner-content">
                    <div class="raid-card-title"><h3>The Voidspire</h3><span class="raid-difficulty-badge difficulty-heroic">heroic</span></div>
                    <div class="raid-card-date"><span class="raid-date">Wed, 2 Apr</span><span class="raid-time">20:00</span><span class="raid-countdown">6d 12h</span></div>
                  </div>
                  <p class="raid-card-description">Wednesday reclear - all welcome</p>
                  <div class="raid-card-progress"><div class="raid-progress-bar"><div class="raid-progress-fill" style="width: 65%"></div></div><span class="raid-progress-text">13/20</span></div>
                </div>
                <div class="raid-card-body">
                  <div class="raid-card-roles">
                    <div class="raid-role"><span class="raid-role-icon tank"><i class="las la-shield-alt"></i></span><span class="raid-role-count">2/2</span></div>
                    <div class="raid-role"><span class="raid-role-icon healer"><i class="las la-plus-circle"></i></span><span class="raid-role-count">3/4</span></div>
                    <div class="raid-role"><span class="raid-role-icon dps"><i class="las la-crosshairs"></i></span><span class="raid-role-count">8/14</span></div>
                  </div>
                  <div class="raid-roster-scroll">
                    <div class="raid-signups-list">
                      <div class="raid-signup-group"><span class="raid-signup-role-label tank">Tanks</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #C79C6E">Shieldwall</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #C41F3B">Darkguard</span></div></div>
                      <div class="raid-signup-group"><span class="raid-signup-role-label healer">Healers</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #F58CBA">Lightbringer</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FF7D0A">Treeform</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #0070DE">Tidecaller</span></div></div>
                      <div class="raid-signup-group"><span class="raid-signup-role-label dps">DPS</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #40C7EB">Frostbolt</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FFF569">Shadowstep</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #A330C9">Chaosblde</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #00FF96">Windwalkin</span></div></div>
                    </div>
                  </div>
                  <div class="raid-card-actions"><button class="btn-raid-signup" disabled>Sign Up</button></div>
                </div>
              </div>

              <div class="raid-card status-full demo-card" style="min-width: 300px; max-width: 300px;">
                <div class="raid-card-banner" style="background-image: url('https://render.worldofwarcraft.com/us/zones/march-on-queldanas-small.jpg')">
                  <div class="raid-card-banner-overlay"></div>
                  <div class="raid-card-banner-content">
                    <div class="raid-card-title"><h3>March on Quel'Danas</h3><span class="raid-difficulty-badge difficulty-mythic">mythic</span></div>
                    <div class="raid-card-date"><span class="raid-date">Thu, 3 Apr</span><span class="raid-time">21:00</span><span class="raid-countdown">Tomorrow</span></div>
                  </div>
                  <p class="raid-card-description">Mythic prog - CE push</p>
                  <div class="raid-card-progress"><div class="raid-progress-bar"><div class="raid-progress-fill" style="width: 100%"></div></div><span class="raid-progress-text">10/10 +2 reserves</span></div>
                </div>
                <div class="raid-card-body">
                  <div class="raid-card-roles">
                    <div class="raid-role"><span class="raid-role-icon tank"><i class="las la-shield-alt"></i></span><span class="raid-role-count">1/1</span></div>
                    <div class="raid-role"><span class="raid-role-icon healer"><i class="las la-plus-circle"></i></span><span class="raid-role-count">2/2</span></div>
                    <div class="raid-role"><span class="raid-role-icon dps"><i class="las la-crosshairs"></i></span><span class="raid-role-count">7/7</span></div>
                  </div>
                  <div class="raid-roster-scroll">
                    <div class="raid-signups-list">
                      <div class="raid-signup-group"><span class="raid-signup-role-label tank">Tanks</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #C41F3B">Boneshield</span></div></div>
                      <div class="raid-signup-group"><span class="raid-signup-role-label healer">Healers</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FFFFFF">Mending</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #0070DE">Riptide</span></div></div>
                      <div class="raid-signup-group"><span class="raid-signup-role-label dps">DPS</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #40C7EB">Pyroblast</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #C79C6E">Furyblade</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #ABD473">Deadeye</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #8787ED">Doomcall</span></div></div>
                    </div>
                    <div class="raid-reserves-section"><span class="raid-reserves-label">Reserves (2)</span><div class="raid-signups-list"><div class="raid-signup-group"><span class="raid-signup-role-label dps">DPS</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FF7D0A">Moonfire</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #40C7EB">Icelance</span></div></div></div></div>
                  </div>
                  <div class="raid-card-actions"><button class="btn-raid-signup" disabled>Sign Up as Reserve</button></div>
                </div>
              </div>

              <div class="raid-card status-open demo-card" style="min-width: 300px; max-width: 300px;">
                <div class="raid-card-banner" style="background-image: url('https://render.worldofwarcraft.com/us/zones/the-dreamrift-small.jpg')">
                  <div class="raid-card-banner-overlay"></div>
                  <div class="raid-card-banner-content">
                    <div class="raid-card-title"><h3>The Dreamrift</h3><span class="raid-difficulty-badge difficulty-normal">normal</span></div>
                    <div class="raid-card-date"><span class="raid-date">Sat, 5 Apr</span><span class="raid-time">18:00</span><span class="raid-countdown">9d 4h</span></div>
                  </div>
                  <p class="raid-card-description">World boss - all welcome</p>
                  <div class="raid-card-progress"><div class="raid-progress-bar"><div class="raid-progress-fill" style="width: 13%"></div></div><span class="raid-progress-text">4/30</span></div>
                </div>
                <div class="raid-card-body">
                  <div class="raid-card-roles">
                    <div class="raid-role"><span class="raid-role-icon tank"><i class="las la-shield-alt"></i></span><span class="raid-role-count">1/3</span></div>
                    <div class="raid-role"><span class="raid-role-icon healer"><i class="las la-plus-circle"></i></span><span class="raid-role-count">1/5</span></div>
                    <div class="raid-role"><span class="raid-role-icon dps"><i class="las la-crosshairs"></i></span><span class="raid-role-count">2/22</span></div>
                  </div>
                  <div class="raid-roster-scroll">
                    <div class="raid-signups-list">
                      <div class="raid-signup-group"><span class="raid-signup-role-label tank">Tanks</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #C79C6E">Ironhide</span></div></div>
                      <div class="raid-signup-group"><span class="raid-signup-role-label healer">Healers</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FF7D0A">Rejuvenate</span></div></div>
                      <div class="raid-signup-group"><span class="raid-signup-role-label dps">DPS</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #0070DE">Thunderbolt</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #ABD473">Snipeshot</span></div></div>
                    </div>
                  </div>
                  <div class="raid-card-actions"><span class="raid-signed-up">Signed up as Thunderbolt</span><button class="btn-raid-withdraw" disabled>Withdraw</button></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 class="home-section-title">Other Features</h2>
        <div class="home-features home-features-row">
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
