import PageInitializer from './utils/page-initializer.js';
import PageHeader from './components/page-header.js';
import authService from './services/auth.js';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      const container = document.getElementById('link-container');
      const urlParams = new URLSearchParams(window.location.search);
      const linkDiscord = urlParams.get('link_discord');
      const linkToken = urlParams.get('link_token');

      // Save link params before potential auth redirect
      if (linkDiscord && linkToken) {
        sessionStorage.setItem('gld_link_discord', linkDiscord);
        sessionStorage.setItem('gld_link_token', linkToken);
        sessionStorage.setItem('gld_claim_return', window.location.pathname);
      }

      // Process linking if logged in and have params
      if (authService.isAuthenticated()) {
        const savedDiscord = linkDiscord || sessionStorage.getItem('gld_link_discord');
        const savedToken = linkToken || sessionStorage.getItem('gld_link_token');

        if (savedDiscord && savedToken) {
          try {
            const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
              ? 'https://crbntyp.com/gld/api' : '/gld/api';
            const token = authService.getAccessToken();
            const res = await fetch(`${baseUrl}/discord-link.php`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
              body: JSON.stringify({ discord_id: savedDiscord, token: savedToken })
            });

            sessionStorage.removeItem('gld_link_discord');
            sessionStorage.removeItem('gld_link_token');
            window.history.replaceState({}, document.title, window.location.pathname);

            if (res.ok) {
              renderSuccess(container);
              return;
            }
          } catch (e) {}
        }

        renderLinked(container);
      } else {
        renderLanding(container, !!(linkDiscord && linkToken));
      }
    }
  });
});

function renderSuccess(container) {
  container.innerHTML = `
    <div class="link-page">
      ${PageHeader.render({
        className: 'link',
        badge: 'gld__ link',
        title: 'Accounts Linked!',
        description: 'Your Discord and Battle.net accounts are now paired. You are all set.'
      })}
      <div class="link-visual">
        <div class="link-icon-card link-success">
          <i class="lab la-discord"></i>
          <div class="link-connector"><i class="las la-check-circle"></i></div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Blizzard_Entertainment_Logo_2015.svg" class="link-bnet-logo" alt="Battle.net" />
        </div>
        <p class="link-status-text">Linked successfully</p>
      </div>
      <div class="link-cta">
        <a href="raids.html" class="link-btn">View Raids</a>
        <a href="groups.html" class="link-btn">View Groups</a>
      </div>
    </div>
  `;
}

function renderLinked(container) {
  container.innerHTML = `
    <div class="link-page">
      ${PageHeader.render({
        className: 'link',
        badge: 'gld__ link',
        title: 'Link Your Accounts',
        description: 'Pair your Discord and Battle.net accounts to unlock the full experience.'
      })}
      <div class="link-visual">
        <div class="link-icon-card">
          <i class="lab la-discord"></i>
          <div class="link-connector"><i class="las la-link"></i></div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Blizzard_Entertainment_Logo_2015.svg" class="link-bnet-logo" alt="Battle.net" />
        </div>
      </div>
      <div class="link-info">
        <div class="link-step">
          <span class="link-step-num">1</span>
          <div>
            <h4>Type <code>/link</code> in your Discord server</h4>
            <p>The bot will DM you a unique one-time link</p>
          </div>
        </div>
        <div class="link-step">
          <span class="link-step-num">2</span>
          <div>
            <h4>Click the link and log in with Battle.net</h4>
            <p>Same login you use for the app, takes 10 seconds</p>
          </div>
        </div>
        <div class="link-step">
          <span class="link-step-num">3</span>
          <div>
            <h4>Done, forever</h4>
            <p>Your accounts are paired. Create raids, build groups, manage events across Discord and the web</p>
          </div>
        </div>
      </div>
      <div class="link-features">
        <div class="link-feature">
          <i class="las la-shield-alt"></i>
          <h4>Secure</h4>
          <p>We only store your Discord ID and Battle.net ID side by side. No passwords, no personal data.</p>
        </div>
        <div class="link-feature">
          <i class="las la-sync"></i>
          <h4>Two-Way</h4>
          <p>Create from Discord or the web app. Everything syncs. Notifications go to the right server.</p>
        </div>
        <div class="link-feature">
          <i class="las la-user-check"></i>
          <h4>Ownership</h4>
          <p>Only you can manage the raids and groups you create. Linking proves you're the same person.</p>
        </div>
      </div>
    </div>
  `;
}

function renderLanding(container, hasLinkParams) {
  container.innerHTML = `
    <div class="link-page">
      ${PageHeader.render({
        className: 'link',
        badge: 'gld__ link',
        title: 'Link Your Accounts',
        description: 'Pair your Discord and Battle.net accounts to unlock the full experience.'
      })}
      <div class="link-visual">
        <div class="link-icon-card">
          <i class="lab la-discord"></i>
          <div class="link-connector"><i class="las la-link"></i></div>
          <img src="https://upload.wikimedia.org/wikipedia/commons/2/23/Blizzard_Entertainment_Logo_2015.svg" class="link-bnet-logo" alt="Battle.net" />
        </div>
      </div>
      ${hasLinkParams ? `
        <div class="link-cta">
          <p class="link-cta-text">Log in with Battle.net to complete the link</p>
          <button class="btn-login-auth" id="btn-login-link">
            <i class="las la-user"></i>
            Login with Battle.net
          </button>
        </div>
      ` : `
        <div class="link-info">
          <div class="link-step">
            <span class="link-step-num">1</span>
            <div>
              <h4>Type <code>/link</code> in your Discord server</h4>
              <p>The bot will DM you a unique one-time link</p>
            </div>
          </div>
          <div class="link-step">
            <span class="link-step-num">2</span>
            <div>
              <h4>Click the link and log in with Battle.net</h4>
              <p>Same login you use for the app, takes 10 seconds</p>
            </div>
          </div>
          <div class="link-step">
            <span class="link-step-num">3</span>
            <div>
              <h4>Done, forever</h4>
              <p>Your accounts are paired. Create raids, build groups, manage events across Discord and the web</p>
            </div>
          </div>
        </div>
      `}
    </div>
  `;

  document.getElementById('btn-login-link')?.addEventListener('click', () => authService.login());
}
