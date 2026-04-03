// Raids Page
import PageInitializer from './utils/page-initializer.js';
import RaidManager from './components/raid-manager.js';
import authService from './services/auth.js';

console.log('⚡ Raids Page initialized');

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      // Reload page on auth state change (login/logout)
      window.addEventListener('auth-state-changed', () => {
        window.location.reload();
      });

      // Save Discord server context from URL params (before auth check)
      const urlParams = new URLSearchParams(window.location.search);
      const serverParam = urlParams.get('server');
      const nameParam = urlParams.get('name');
      if (serverParam) {
        localStorage.setItem('gld_raid_server', serverParam);
        if (nameParam) localStorage.setItem('gld_raid_server_name', nameParam);
      }

      if (authService.isAuthenticated()) {
        const raidManager = new RaidManager('raids-container', authService);
        await raidManager.init();
      } else {
        const container = document.getElementById('raids-container');

        const savedServer = serverParam || localStorage.getItem('gld_raid_server');
        const savedName = nameParam || localStorage.getItem('gld_raid_server_name');

        if (savedServer) {
          // Has Discord context — prompt to log in + show features
          container.innerHTML = `
            <div class="raids-landing">
              <div class="raids-landing-hero">
                <div class="raids-landing-badge">gld__ raids</div>
                <h1>Arriving from${savedName ? `, ${savedName}` : ''} eh?</h1>
                <p class="raids-landing-subtitle">We can see you've arrived from ${savedName ? `the <strong>${savedName}</strong> Discord server` : 'a Discord server'}. Log in with your Battle.net account to view and sign up for your guild's raids.</p>
              </div>

              <div class="raids-landing-cta">
                <button class="btn-login-raids" id="btn-login-raids">
                  <i class="las la-user"></i>
                  Login with Battle.net
                </button>
              </div>

              <div class="raids-landing-section-title">Get the bot for your Discord server</div>
              <div class="raids-landing-features">
                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="lab la-discord"></i>
                  </div>
                  <h3>Discord Powered</h3>
                  <p>Raids are created directly from Discord using the <code>/raid</code> command. Pick the raid, set the time, and it's live.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-users"></i>
                  </div>
                  <h3>Smart Roster</h3>
                  <p>Role-based signups with tank, healer, and DPS caps. When spots fill up, extra signups automatically become reserves.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-exchange-alt"></i>
                  </div>
                  <h3>Auto Reserve</h3>
                  <p>If someone drops out, the first reserve in the same role gets promoted automatically. No manual reshuffling.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-bell"></i>
                  </div>
                  <h3>Discord Notifications</h3>
                  <p>Every signup, withdrawal, and full roster triggers a message back to your Discord channel in real time.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-lock"></i>
                  </div>
                  <h3>Role Permissions</h3>
                  <p>Server owners control who can create raids with <code>/settings</code>. Set a minimum Discord role and only members at that rank or above can create.</p>
                </div>
              </div>

              <div class="raids-landing-how">
                <h2>How It Works</h2>
                <div class="raids-landing-steps">
                  <div class="raids-landing-step">
                    <span class="step-number">1</span>
                    <div>
                      <h4>GM creates a raid in Discord</h4>
                      <p><code>/raid title:The Voidspire difficulty:heroic date:2026-04-10 20:00</code></p>
                    </div>
                  </div>
                  <div class="raids-landing-step">
                    <span class="step-number">2</span>
                    <div>
                      <h4>Raid posted with signup link</h4>
                      <p>An embed with the raid details and a signup link is posted to your channel.</p>
                    </div>
                  </div>
                  <div class="raids-landing-step">
                    <span class="step-number">3</span>
                    <div>
                      <h4>Players sign up with their character</h4>
                      <p>Log in with Battle.net, pick your character, choose your role, and confirm.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="raids-landing-cta">
                <a href="https://discord.com/oauth2/authorize?client_id=1486760650138193990&permissions=18432&scope=bot+applications.commands" target="_blank" class="btn-add-bot">
                  <i class="lab la-discord"></i>
                  Add Bot to your Discord
                </a>
              </div>
            </div>
          `;
          document.getElementById('btn-login-raids').addEventListener('click', () => {
            authService.login();
          });
        } else {
          // No Discord context — show full marketing landing
          container.innerHTML = `
            <div class="raids-landing">
              <div class="raids-landing-hero">
                <div class="raids-landing-badge">gld__ raids</div>
                <h1>Organise Your Raid Night</h1>
                <p class="raids-landing-subtitle">A streamlined raid signup system powered by Discord. Discord raid creation with Battle.net character and role raid signup!</p>
              </div>

              <div class="raids-demo-carousel">
                <div class="raids-demo-track">
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
                          <div class="raid-signup-group"><span class="raid-signup-role-label dps">DPS</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #40C7EB">Frostbolt</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FFF569">Shadowstep</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_druid.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FF7D0A">Starfall</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #A330C9">Chaosblde</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #00FF96">Windwalkin</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #ABD473">Aimshot</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #8787ED">Felfire</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_paladin.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #F58CBA">Retbull</span></div></div>
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
                          <div class="raid-signup-group"><span class="raid-signup-role-label dps">DPS</span><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_mage.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #40C7EB">Pyroblast</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #C79C6E">Furyblade</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_hunter.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #ABD473">Deadeye</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_warlock.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #8787ED">Doomcall</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_rogue.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #FFF569">Ambush</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_demonhunter.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #A330C9">Voidrush</span></div><div class="raid-signup-member"><img src="https://wow.zamimg.com/images/wow/icons/large/classicon_monk.jpg" class="raid-signup-icon" /><span class="raid-signup-name" style="color: #00FF96">Tigerstrike</span></div></div>
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

              <div class="raids-landing-section-title">Get the bot for your Discord server</div>
              <div class="raids-landing-features">
                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="lab la-discord"></i>
                  </div>
                  <h3>Discord Powered</h3>
                  <p>Raids are created directly from Discord using the <code>/raid</code> command. Pick the raid, set the time, and it's live.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-users"></i>
                  </div>
                  <h3>Smart Roster</h3>
                  <p>Role-based signups with tank, healer, and DPS caps. When spots fill up, extra signups automatically become reserves.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-exchange-alt"></i>
                  </div>
                  <h3>Auto Reserve</h3>
                  <p>If someone drops out, the first reserve in the same role gets promoted automatically. No manual reshuffling.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-bell"></i>
                  </div>
                  <h3>Discord Notifications</h3>
                  <p>Every signup, withdrawal, and full roster triggers a message back to your Discord channel in real time.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-lock"></i>
                  </div>
                  <h3>Role Permissions</h3>
                  <p>Server owners control who can create raids with <code>/settings</code>. Set a minimum Discord role and only members at that rank or above can create.</p>
                </div>
              </div>

              <div class="raids-landing-how">
                <h2>How It Works</h2>
                <div class="raids-landing-steps">
                  <div class="raids-landing-step">
                    <span class="step-number">1</span>
                    <div>
                      <h4>GM creates a raid in Discord</h4>
                      <p><code>/raid title:The Voidspire difficulty:heroic date:2026-04-10 20:00</code></p>
                    </div>
                  </div>
                  <div class="raids-landing-step">
                    <span class="step-number">2</span>
                    <div>
                      <h4>Raid posted with signup link</h4>
                      <p>An embed with the raid details and a signup link is posted to your channel.</p>
                    </div>
                  </div>
                  <div class="raids-landing-step">
                    <span class="step-number">3</span>
                    <div>
                      <h4>Players sign up with their character</h4>
                      <p>Log in with Battle.net, pick your character, choose your role, and confirm.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div class="raids-landing-cta">
                <p class="raids-landing-cta-text">Click a raid signup link from your Discord server to get started.</p>
                <p class="raids-landing-cta-sub">Your GM creates raids via the <code>/raid</code> command in Discord, which posts a signup link to your channel.</p>
                <a href="https://discord.com/oauth2/authorize?client_id=1486760650138193990&permissions=18432&scope=bot+applications.commands" target="_blank" class="btn-add-bot">
                  <i class="lab la-discord"></i>
                  Add Bot to your Discord
                </a>
              </div>
            </div>
          `;
        }
      }
    }
  });
});
