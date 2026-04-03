// Main application JavaScript
import GuildRoster from './components/guild-roster.js';
import GuildSearch from './components/guild-search.js';
import PageInitializer from './utils/page-initializer.js';
import characterModal from './components/character-modal.js';
import config from './config.js';
import authService from './services/auth.js';

import { updateRegionConfig, updateGuildConfig, clearRosterState } from './utils/config-utils.js';

console.log('⚡ Guild Site initialized');

async function loadCritterTracker() {
  if (!authService.isAuthenticated()) return;

  const tracker = document.getElementById('critter-tracker');
  if (!tracker) return;

  try {
    const accountService = (await import('./services/account-service.js')).default;
    const battlenetClient = (await import('./api/battlenet-client.js')).default;
    const characters = await accountService.getAccountCharacters();

    // Fetch critter kills (stat ID 108) from all characters in parallel
    const CRITTER_STAT_ID = 108;
    const TARGET = 50000;

    const statPromises = characters.map(async (char) => {
      try {
        const realm = char.realm?.slug;
        const name = encodeURIComponent(char.name.toLowerCase());
        if (!realm || !name) return 0;
        const data = await battlenetClient.request(
          `/profile/wow/character/${realm}/${name}/achievements/statistics`,
          { params: { namespace: config.api.namespace.profile } }
        );
        for (const cat of (data.categories || [])) {
          for (const sub of (cat.sub_categories || [])) {
            for (const stat of (sub.statistics || [])) {
              if (stat.id === CRITTER_STAT_ID) return stat.quantity || 0;
            }
          }
        }
        return 0;
      } catch (e) {
        return 0;
      }
    });

    const counts = await Promise.all(statPromises);
    const total = Math.round(counts.reduce((sum, c) => sum + c, 0));
    const percent = Math.min((total / TARGET) * 100, 100);
    const remaining = Math.max(TARGET - total, 0);

    tracker.innerHTML = `
      <div class="critter-bar-wrapper">
        <div class="critter-bar-label">
          <span class="critter-bar-title">Critter Kill Squad</span>
          <span class="critter-bar-count">${total.toLocaleString()} / ${TARGET.toLocaleString()}</span>
        </div>
        <div class="critter-bar">
          <div class="critter-bar-fill" style="width: ${percent}%"></div>
        </div>
        <div class="critter-bar-remaining">${remaining > 0 ? `${remaining.toLocaleString()} to go` : 'Complete!'}</div>
      </div>
    `;
  } catch (e) {
    console.error('Critter tracker error:', e);
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    onInit: async () => {
      // Initialize character modal
      characterModal.init();

      // Initialize guild search
      const guildSearch = new GuildSearch('guild-search-container');
      await guildSearch.render();

      // Load critter progress bar (non-blocking, after auth)
      loadCritterTracker();


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
          <h2 class="home-section-title">Raid Signups & Group Builder</h2>
          <p class="home-demo-desc">Discord's built-in events let you RSVP. That's it. No roles, no roster caps, no reserve system, no character data. gld__ gives you proper raid signups with tank/healer/DPS roles, automatic reserves when slots fill, and a group builder that auto-assigns balanced 5-man teams from your signup pool using ilvl and M+ rating. All powered by your Battle.net characters — not just a Discord username.</p>
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
              <div class="demo-card" style="min-width: 600px; max-width: 600px; height: 380px; pointer-events: none; background: rgba(0,0,0,0.2); border: 1px solid rgba(163,53,238,0.2); border-radius: 5px; padding: 16px; overflow: hidden">
                <div style="display:flex;align-items:center;gap:8px;margin-bottom:12px;padding-bottom:10px;border-bottom:1px solid rgba(255,255,255,0.06)">
                  <span style="font-size:14px;font-weight:700;color:#fff">Group Builder</span>
                  <div style="display:flex;gap:6px;margin-left:auto">
                    <span style="font-size:10px;padding:4px 10px;background:rgba(163,53,238,0.12);border:1px solid rgba(163,53,238,0.25);border-radius:4px;color:#fff;font-weight:600">Auto-Assign</span>
                    <span style="font-size:10px;padding:4px 10px;background:rgba(163,53,238,0.12);border:1px solid rgba(163,53,238,0.25);border-radius:4px;color:#fff;font-weight:600">Save</span>
                  </div>
                </div>
                <div style="display:flex;gap:12px">
                  <div style="width:140px;flex-shrink:0;border-right:1px solid rgba(255,255,255,0.06);padding-right:12px">
                    <div style="font-size:11px;color:rgba(255,255,255,0.4);margin-bottom:8px">Pool (6)</div>
                    <div style="font-size:9px;color:#0070DE;font-weight:700;margin-bottom:4px">TANKS (1)</div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_deathknight.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#C41F3B">Nocturn</span></div>
                    <div style="font-size:9px;color:#ff5050;font-weight:700;margin:8px 0 4px">DPS (5)</div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#00FF96">Ashveil</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#F58CBA">Cinderstrike</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px;border-left:2px dashed rgba(245,158,11,0.4)"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#0070DE">Stormhoof</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#C79C6E">Thornblade</span></div>
                    <div style="display:flex;align-items:center;gap:5px;padding:4px 6px;margin-bottom:3px;background:rgba(255,255,255,0.03);border-radius:4px"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" style="width:18px;height:18px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#40C7EB">Pyroblast</span></div>
                  </div>
                  <div style="flex:1;display:flex;flex-wrap:wrap;gap:8px;align-content:flex-start">
                    <div style="width:calc(50% - 4px);background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px">
                      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:#a335ee">Cosmic Badgers</span><span style="font-size:9px;color:rgba(255,255,255,0.2);margin-left:auto">5/5</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#A330C9">Felbladë</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_priest.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FFFFFF">Solstice</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#40C7EB">Scorch</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#A330C9">Havok</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FFF569">Bladesong</span></div>
                    </div>
                    <div style="width:calc(50% - 4px);background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px">
                      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:#a335ee">Void Llamas</span><span style="font-size:9px;color:rgba(255,255,255,0.2);margin-left:auto">5/5</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FF7D0A">Slothinator</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#FF7D0A">Verdant</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#ABD473">Grimshot</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#8787ED">Voidcaller</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_shaman.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#0070DE">Tidecaller</span></div>
                    </div>
                    <div style="width:calc(50% - 4px);background:rgba(0,0,0,0.3);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:8px">
                      <div style="display:flex;align-items:center;gap:4px;margin-bottom:6px"><span style="font-size:12px;font-weight:700;color:#a335ee">Neon Warlords</span><span style="font-size:9px;color:rgba(255,255,255,0.2);margin-left:auto">4/5</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#33937F">Emberwing</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_evoker.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#33937F">Lifespark</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#8787ED">Felfire</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:2px 0"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" style="width:16px;height:16px;border-radius:50%" /><span style="font-size:11px;font-weight:600;color:#F58CBA">Retbull</span></div>
                      <div style="display:flex;align-items:center;gap:5px;padding:3px 6px;border:1px dashed rgba(255,255,255,0.06);border-radius:4px;color:rgba(255,255,255,0.12)"><i class="las la-crosshairs" style="font-size:11px"></i><span style="font-size:9px">DPS</span></div>
                    </div>
                  </div>
                </div>
              </div>

              </div>
            </div>
          </div>
        </div>

        <div class="home-demo-section">
          <h2 class="home-section-title">Stop Alt-Tabbing, Start Playing</h2>
          <p class="home-demo-desc">Track professions and vault rewards across every character without logging in and out. One page, all your alts.</p>
        </div>

        <div class="home-dual-section">
          <div class="home-dual-card">
            <a href="my-crafters.html" class="home-dual-link">
              <span class="home-feature-chip">BNet Login</span>
              <h3 class="home-dual-title"><i class="las la-hammer"></i> Crafters</h3>
              <p class="home-dual-desc">All your characters' professions in one view — skill levels, expansion tiers, and who can craft what.</p>
              <div class="home-dual-preview">
                <div class="crafter-char-row demo-crafter">
                  <div class="crafter-char-info">
                    <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/243/171270131-avatar.jpg" class="crafter-char-avatar" />
                    <img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" class="crafter-class-icon" />
                    <span class="crafter-char-name" style="color: #F58CBA">Bäsics</span>
                  </div>
                  <div class="crafter-tiers-list">
                    <div class="crafter-tier-row maxed"><span class="crafter-tier-name">Midnight Mining</span><div class="crafter-skill-bar"><div class="crafter-skill-fill" style="width: 100%"></div></div><span class="crafter-skill-text">100/100</span></div>
                    <div class="crafter-tier-row"><span class="crafter-tier-name">Midnight Blacksmithing</span><div class="crafter-skill-bar"><div class="crafter-skill-fill" style="width: 80%"></div></div><span class="crafter-skill-text">80/100</span></div>
                  </div>
                </div>
                <div class="crafter-char-row demo-crafter">
                  <div class="crafter-char-info">
                    <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/115/171270003-avatar.jpg" class="crafter-char-avatar" />
                    <img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" class="crafter-class-icon" />
                    <span class="crafter-char-name" style="color: #FFF569">Fëlstriker</span>
                  </div>
                  <div class="crafter-tiers-list">
                    <div class="crafter-tier-row maxed"><span class="crafter-tier-name">Midnight Herbalism</span><div class="crafter-skill-bar"><div class="crafter-skill-fill" style="width: 100%"></div></div><span class="crafter-skill-text">100/100</span></div>
                    <div class="crafter-tier-row"><span class="crafter-tier-name">Midnight Alchemy</span><div class="crafter-skill-bar"><div class="crafter-skill-fill" style="width: 65%"></div></div><span class="crafter-skill-text">65/100</span></div>
                  </div>
                </div>
                <div class="crafter-char-row demo-crafter">
                  <div class="crafter-char-info">
                    <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/58/170575674-avatar.jpg" class="crafter-char-avatar" />
                    <img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="crafter-class-icon" />
                    <span class="crafter-char-name" style="color: #A330C9">Felbladë</span>
                  </div>
                  <div class="crafter-tiers-list">
                    <div class="crafter-tier-row maxed"><span class="crafter-tier-name">Midnight Enchanting</span><div class="crafter-skill-bar"><div class="crafter-skill-fill" style="width: 100%"></div></div><span class="crafter-skill-text">100/100</span></div>
                    <div class="crafter-tier-row"><span class="crafter-tier-name">Midnight Tailoring</span><div class="crafter-skill-bar"><div class="crafter-skill-fill" style="width: 75%"></div></div><span class="crafter-skill-text">75/100</span></div>
                  </div>
                </div>
              </div>
            </a>
          </div>
          <div class="home-dual-card">
            <a href="my-vault.html" class="home-dual-link">
              <span class="home-feature-chip">BNet Login</span>
              <h3 class="home-dual-title"><i class="las la-gift"></i> Weekly Vault</h3>
              <p class="home-dual-desc">See which characters have vault rewards ready from raids, M+ keys, and delves — no more logging each one.</p>
              <div class="home-dual-preview">
                <div class="home-vault-row">
                  <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/243/171270131-avatar.jpg" class="crafter-char-avatar" />
                  <span class="home-vault-name" style="color: #F58CBA">Bäsics</span>
                  <div class="home-preview-badges">
                    <span class="vault-badge vault-raids" style="font-size:9px;padding:2px 6px">Raids</span>
                    <span class="vault-badge vault-mplus" style="font-size:9px;padding:2px 6px">M+ Keys +12</span>
                    <span class="vault-badge vault-delves" style="font-size:9px;padding:2px 6px">Delves</span>
                  </div>
                </div>
                <div class="home-vault-row">
                  <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/41/171269673-avatar.jpg" class="crafter-char-avatar" />
                  <span class="home-vault-name" style="color: #8787ED">Blighthöund</span>
                  <div class="home-preview-badges">
                    <span class="vault-badge vault-inactive" style="font-size:9px;padding:2px 6px">Raids</span>
                    <span class="vault-badge vault-mplus" style="font-size:9px;padding:2px 6px">M+ Keys +8</span>
                    <span class="vault-badge vault-inactive" style="font-size:9px;padding:2px 6px">Delves</span>
                  </div>
                </div>
                <div class="home-vault-row">
                  <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/58/170575674-avatar.jpg" class="crafter-char-avatar" />
                  <span class="home-vault-name" style="color: #A330C9">Felbladë</span>
                  <div class="home-preview-badges">
                    <span class="vault-badge vault-raids" style="font-size:9px;padding:2px 6px">Raids</span>
                    <span class="vault-badge vault-inactive" style="font-size:9px;padding:2px 6px">M+ Keys</span>
                    <span class="vault-badge vault-delves" style="font-size:9px;padding:2px 6px">Delves</span>
                  </div>
                </div>
              </div>
            </a>
          </div>
        </div>

        <div class="home-demo-section">
          <h2 class="home-section-title">Transmog Collection Tracker</h2>
          <p class="home-demo-desc">Track raid tier sets across every class and difficulty. Plus armor sets, raid loot, and dungeon loot spanning all expansions — from Classic to Midnight.</p>
          <div class="home-demo-carousel home-transmog-showcase">
            <div class="home-demo-track">

              <div class="tmog-card demo-tmog-card">
                <div class="tmog-card-header">
                  <div class="tmog-card-meta-row">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-set-icon" />
                    <span class="tmog-class-pill" style="color: #8787ED; background: rgba(135,135,237,0.12); border-color: rgba(135,135,237,0.25)">Warlock</span>
                    <span class="tmog-expansion-tag">Midnight</span>
                  </div>
                  <h3 class="tmog-set-name">Reign of the Abyssal Immolator</h3>
                  <div class="tmog-diff-tabs">
                    <button class="tmog-diff-tab">LFR <span class="tmog-tab-progress">0/9</span></button>
                    <button class="tmog-diff-tab">Normal <span class="tmog-tab-progress">3/9</span></button>
                    <button class="tmog-diff-tab active">Heroic <span class="tmog-tab-progress">6/9</span></button>
                    <button class="tmog-diff-tab">Mythic <span class="tmog-tab-progress">0/9</span></button>
                  </div>
                  <div class="tmog-progress-bar"><div class="tmog-progress-fill" style="width: 67%"></div></div>
                </div>
                <div class="tmog-pieces active">
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Head</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Hood</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Shoulder</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Mantle</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece missing">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_chest_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Chest</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Robe</span>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_belt_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Waist</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Cord</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_pant_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Legs</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Leggings</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece missing">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_boot_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Feet</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Treads</span>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_chest_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Wrist</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Bindings</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_chest_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Hands</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Gloves</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece missing">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_cape_cloth_raidwarlockmidnight_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Back</span>
                    <span class="tmog-piece-name">Abyssal Immolator's Drape</span>
                  </div>
                </div>
              </div>

              <div class="tmog-card demo-tmog-card tmog-complete">
                <div class="tmog-card-header">
                  <div class="tmog-card-meta-row">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_helm.jpg" class="tmog-set-icon" />
                    <span class="tmog-class-pill" style="color: #F58CBA; background: rgba(245,140,186,0.12); border-color: rgba(245,140,186,0.25)">Paladin</span>
                    <span class="tmog-expansion-tag">The War Within</span>
                  </div>
                  <h3 class="tmog-set-name">Entombed Seraph's Radiance</h3>
                  <div class="tmog-diff-tabs">
                    <button class="tmog-diff-tab">LFR <span class="tmog-tab-progress">0/9</span></button>
                    <button class="tmog-diff-tab">Normal <span class="tmog-tab-progress">7/9</span></button>
                    <button class="tmog-diff-tab active tab-complete">Heroic <span class="tmog-tab-progress">9/9</span></button>
                    <button class="tmog-diff-tab">Mythic <span class="tmog-tab-progress">2/9</span></button>
                  </div>
                  <div class="tmog-progress-bar"><div class="tmog-progress-fill complete" style="width: 100%"></div></div>
                </div>
                <div class="tmog-pieces active">
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_helm.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Head</span>
                    <span class="tmog-piece-name">Entombed Seraph's Casque</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_shoulder.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Shoulder</span>
                    <span class="tmog-piece-name">Entombed Seraph's Spaulders</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_chest.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Chest</span>
                    <span class="tmog-piece-name">Entombed Seraph's Cuirass</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_belt.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Waist</span>
                    <span class="tmog-piece-name">Entombed Seraph's Girdle</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_pant.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Legs</span>
                    <span class="tmog-piece-name">Entombed Seraph's Greaves</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_boot.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Feet</span>
                    <span class="tmog-piece-name">Entombed Seraph's Sabatons</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_bracer.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Wrist</span>
                    <span class="tmog-piece-name">Entombed Seraph's Vambraces</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_glove.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Hands</span>
                    <span class="tmog-piece-name">Entombed Seraph's Gauntlets</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_plate_raidpaladinnerubian_d_01_cape.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Back</span>
                    <span class="tmog-piece-name">Entombed Seraph's Cloak</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                </div>
              </div>

              <div class="tmog-card demo-tmog-card">
                <div class="tmog-card-header">
                  <div class="tmog-card-meta-row">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-set-icon" />
                    <span class="tmog-class-pill" style="color: #A330C9; background: rgba(163,48,201,0.12); border-color: rgba(163,48,201,0.25)">Demon Hunter</span>
                    <span class="tmog-expansion-tag">Dragonflight</span>
                  </div>
                  <h3 class="tmog-set-name">Kinslayer's Burdens</h3>
                  <div class="tmog-diff-tabs">
                    <button class="tmog-diff-tab">LFR <span class="tmog-tab-progress">0/9</span></button>
                    <button class="tmog-diff-tab">Normal <span class="tmog-tab-progress">5/9</span></button>
                    <button class="tmog-diff-tab active">Heroic <span class="tmog-tab-progress">7/9</span></button>
                    <button class="tmog-diff-tab">Mythic <span class="tmog-tab-progress">1/9</span></button>
                  </div>
                  <div class="tmog-progress-bar"><div class="tmog-progress-fill" style="width: 78%"></div></div>
                </div>
                <div class="tmog-pieces active">
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Head</span>
                    <span class="tmog-piece-name">Kinslayer's Hood</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Shoulder</span>
                    <span class="tmog-piece-name">Kinslayer's Shoulderpads</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_chest_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Chest</span>
                    <span class="tmog-piece-name">Kinslayer's Vest</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece missing">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_belt_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Waist</span>
                    <span class="tmog-piece-name">Kinslayer's Belt</span>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_pant_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Legs</span>
                    <span class="tmog-piece-name">Kinslayer's Legguards</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_boot_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Feet</span>
                    <span class="tmog-piece-name">Kinslayer's Footpads</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_bracer_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Wrist</span>
                    <span class="tmog-piece-name">Kinslayer's Bindings</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                  <div class="tmog-piece missing">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_glove_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Hands</span>
                    <span class="tmog-piece-name">Kinslayer's Gloves</span>
                  </div>
                  <div class="tmog-piece owned">
                    <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_cape_leather_raiddemonhunterdragon_d_01.jpg" class="tmog-piece-icon" />
                    <span class="tmog-piece-slot">Back</span>
                    <span class="tmog-piece-name">Kinslayer's Cloak</span>
                    <i class="las la-check tmog-piece-check"></i>
                  </div>
                </div>
              </div>

            </div>
          </div>
          <div style="text-align: center; margin-top: 16px">
            <a href="my-transmog.html" class="home-feature-link"><span class="home-feature-chip">BNet Login</span> Browse your transmog collection <i class="las la-arrow-right"></i></a>
          </div>
        </div>

        <h2 class="home-section-title">Other Features</h2>
        <div class="home-features home-features-row">
          <a href="mythic-plus.html" class="home-feature">
            <div class="home-feature-icon"><i class="las la-trophy"></i></div>
            <h3>Mythic+ Leaderboards</h3>
            <p>Live leaderboards, meta composition analysis, and spec distribution across the top runs.</p>
          </a>
          <a href="my-mounts.html" class="home-feature">
            <span class="home-feature-chip">BNet Login</span>
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
            <span class="home-feature-chip">BNet Login</span>
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
