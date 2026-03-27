// Raids Page
import PageInitializer from './utils/page-initializer.js';
import RaidManager from './components/raid-manager.js';
import authService from './services/auth.js';

console.log('⚡ Raids Page initialized');

// Raid zone backgrounds (using Blizzard render CDN)
const raidBackgrounds = [
  { path: 'https://render.worldofwarcraft.com/us/zones/the-voidspire-large.jpg', location: 'The Voidspire' },
  { path: 'https://render.worldofwarcraft.com/us/zones/march-on-queldanas-large.jpg', location: "March on Quel'Danas" },
  { path: 'https://render.worldofwarcraft.com/us/zones/the-dreamrift-large.jpg', location: 'The Dreamrift' }
];

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    backgrounds: raidBackgrounds,
    backgroundInterval: 10000,
    onInit: async () => {
      // Reload page on auth state change (login/logout)
      window.addEventListener('auth-state-changed', () => {
        window.location.reload();
      });

      if (authService.isAuthenticated()) {
        const raidManager = new RaidManager('raids-container', authService);
        await raidManager.init();
      } else {
        const container = document.getElementById('raids-container');

        // Check localStorage for Discord server context
        const urlParams = new URLSearchParams(window.location.search);
        const serverParam = urlParams.get('server');
        const nameParam = urlParams.get('name');

        if (serverParam) {
          localStorage.setItem('gld_raid_server', serverParam);
          if (nameParam) localStorage.setItem('gld_raid_server_name', nameParam);
        }

        const savedServer = serverParam || localStorage.getItem('gld_raid_server');
        const savedName = nameParam || localStorage.getItem('gld_raid_server_name');

        if (savedServer) {
          // Has Discord context — prompt to log in + show features
          container.innerHTML = `
            <div class="raids-landing">
              <div class="raids-landing-hero">
                <div class="raids-landing-badge">gld__ raids</div>
                <h1>Welcome${savedName ? `, ${savedName}` : ''}</h1>
                <p class="raids-landing-subtitle">We can see you've arrived from ${savedName ? `the <strong>${savedName}</strong> Discord server` : 'a Discord server'}. Log in with your Battle.net account to view and sign up for your guild's raids.</p>
              </div>

              <div class="raids-landing-cta">
                <button class="btn-login-raids" id="btn-login-raids">
                  <i class="las la-user"></i>
                  Login with Battle.net
                </button>
              </div>

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
                  Add gld__ Raid Bot to your Discord
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
                <p class="raids-landing-subtitle">A streamlined raid signup system powered by Discord. Your GM creates raids with a simple command, your guild signs up through the app.</p>
              </div>

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
                  Add gld__ Raid Bot to your Discord
                </a>
              </div>
            </div>
          `;
        }
      }
    }
  });
});
