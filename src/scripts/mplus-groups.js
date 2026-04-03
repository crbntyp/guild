import PageInitializer from './utils/page-initializer.js';
import MplusManager from './components/mplus-manager.js';
import authService from './services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      window.addEventListener('auth-state-changed', () => {
        window.location.reload();
      });

      // Save Discord server context from URL params
      const urlParams = new URLSearchParams(window.location.search);
      const serverParam = urlParams.get('server');
      const nameParam = urlParams.get('name');
      if (serverParam) {
        localStorage.setItem('gld_groups_server', serverParam);
        if (nameParam) localStorage.setItem('gld_groups_server_name', nameParam);
      }

      // Save link params before auth redirect (they get lost in OAuth flow)
      const linkDiscord = urlParams.get('link_discord');
      const linkToken = urlParams.get('link_token');
      if (linkDiscord && linkToken) {
        sessionStorage.setItem('gld_link_discord', linkDiscord);
        sessionStorage.setItem('gld_link_token', linkToken);
        sessionStorage.setItem('gld_claim_return', window.location.pathname);
      }

      if (authService.isAuthenticated()) {
        const manager = new MplusManager('mplus-groups-container', authService);
        await manager.init();
      } else {
        const container = document.getElementById('mplus-groups-container');

        const savedServer = serverParam || localStorage.getItem('gld_groups_server');
        const savedName = nameParam || localStorage.getItem('gld_groups_server_name');

        if (savedServer) {
          // Has Discord context — prompt to log in
          container.innerHTML = `
            <div class="raids-landing">
              <div class="raids-landing-hero">
                <div class="raids-landing-badge">gld__ groups</div>
                <h1>Welcome${savedName ? ` from ${savedName}` : ''}!</h1>
                <p class="raids-landing-subtitle">Log in with your Battle.net account to sign up for group sessions and get assigned to a team.</p>
              </div>

              <div class="raids-landing-cta">
                <button class="btn-login-raids" id="btn-login-groups">
                  <i class="las la-user"></i>
                  Login with Battle.net
                </button>
              </div>

              <div class="raids-landing-section-title">How it works</div>
              <div class="raids-landing-features">
                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-calendar-check"></i>
                  </div>
                  <h3>Sign Up</h3>
                  <p>Pick your character and role for an upcoming session. Keys, timewalking, dungeons — whatever's on.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-magic"></i>
                  </div>
                  <h3>Auto-Assign</h3>
                  <p>The GM hits one button and balanced 5-man groups are built from the signup pool based on ilvl and rating.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-users"></i>
                  </div>
                  <h3>Your Team</h3>
                  <p>Every group gets a randomly generated team name. Drag and drop to fine-tune, then save and go.</p>
                </div>
              </div>

              <div class="raids-landing-cta">
                <span class="btn-add-bot disabled">
                  <i class="lab la-discord"></i>
                  Discord Bot — Coming Soon
                </span>
              </div>
            </div>
          `;
          document.getElementById('btn-login-groups')?.addEventListener('click', () => authService.login());
        } else {
          // No Discord context — general landing
          container.innerHTML = `
            <div class="raids-landing">
              <div class="raids-landing-hero">
                <div class="raids-landing-badge">gld__ groups</div>
                <h1>Group Builder</h1>
                <p class="raids-landing-subtitle">A smart group builder for M+ keys, timewalking, dungeons, and more. Sign up, get assigned to a balanced 5-man team, and go.</p>
              </div>

              <div class="raids-landing-section-title">How it works</div>
              <div class="raids-landing-features">
                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="lab la-discord"></i>
                  </div>
                  <h3>Discord Powered</h3>
                  <p>Sessions are created from Discord with the <code>/group</code> command. A signup link is posted to your channel.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-magic"></i>
                  </div>
                  <h3>Smart Groups</h3>
                  <p>Auto-assign builds balanced groups using ilvl and M+ rating. Snake draft ensures no group is stacked.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-dice"></i>
                  </div>
                  <h3>Team Names</h3>
                  <p>Every group gets a randomly generated name. Cosmic Badgers, Void Llamas, Neon Warlords — re-roll until you're happy.</p>
                </div>

                <div class="raids-landing-feature">
                  <div class="raids-landing-feature-icon">
                    <i class="las la-hand-pointer"></i>
                  </div>
                  <h3>Drag & Drop</h3>
                  <p>GM can manually adjust groups by dragging players between teams. Save when done.</p>
                </div>
              </div>

              <div class="raids-landing-cta">
                <p class="raids-landing-cta-text">Click a signup link from your Discord server to get started.</p>
                <p class="raids-landing-cta-sub">Your GM creates sessions via the <code>/group</code> command in Discord.</p>
                <span class="btn-add-bot disabled">
                  <i class="lab la-discord"></i>
                  Discord Bot — Coming Soon
                </span>
              </div>
            </div>
          `;
        }
      }
    }
  });
});
