import PageInitializer from './utils/page-initializer.js';
import authService from './services/auth.js';
import accountService from './services/account-service.js';
import PageHeader from './components/page-header.js';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      const container = document.getElementById('account-container');

      if (!authService.isAuthenticated()) {
        container.innerHTML = `
          <div class="auth-required-view">
            <h2>Authentication Required</h2>
            <p>Log in with your Battle.net account to access your account features.</p>
            <button class="btn-login-auth" id="btn-login-account">
              <i class="las la-user"></i>
              Login with Battle.net
            </button>
          </div>
        `;
        document.getElementById('btn-login-account')?.addEventListener('click', () => authService.login());
        return;
      }

      const user = authService.getUser();
      const battletag = user?.battletag || 'Adventurer';

      container.innerHTML = `
        ${PageHeader.render({
          className: 'account',
          badge: 'gld__ account',
          title: battletag,
          description: 'Your account hub — everything in one place.'
        })}
        <div id="account-content">
          <div class="account-grid">
            <a href="my-characters.html" class="account-card">
              <div class="account-card-icon"><i class="las la-user"></i></div>
              <div class="account-card-info">
                <h3>My Characters</h3>
                <p>View all your characters across every realm. Gear, specs, item levels, and detailed inspections.</p>
              </div>
              <div class="account-card-stat" id="stat-characters"><i class="las la-circle-notch la-spin"></i></div>
            </a>
            <a href="my-crafters.html" class="account-card">
              <div class="account-card-icon"><i class="las la-hammer"></i></div>
              <div class="account-card-info">
                <h3>Crafters</h3>
                <p>Profession overview across all your alts. Skill levels, expansion tiers, and who crafts what.</p>
              </div>
            </a>
            <a href="my-vault.html" class="account-card">
              <div class="account-card-icon"><i class="las la-gift"></i></div>
              <div class="account-card-info">
                <h3>Weekly Vault</h3>
                <p>Track vault reward progress from raids, M+ keys, and delves across all your characters.</p>
              </div>
              <div class="account-card-stat" id="stat-vault"><i class="las la-circle-notch la-spin"></i></div>
            </a>
            <a href="my-transmog.html" class="account-card">
              <div class="account-card-icon"><i class="las la-tshirt"></i></div>
              <div class="account-card-info">
                <h3>Transmog Sets</h3>
                <p>Track raid sets, armor sets, and browse every piece of loot from raids and dungeons across all expansions.</p>
              </div>
            </a>
            <a href="my-mounts.html" class="account-card">
              <div class="account-card-icon"><i class="las la-horse"></i></div>
              <div class="account-card-info">
                <h3>Mount Collection</h3>
                <p>Browse your mounts by expansion with Wowhead links. See what you own and what's farmable.</p>
              </div>
            </a>
            <a href="my-todos.html" class="account-card">
              <div class="account-card-icon"><i class="las la-tasks"></i></div>
              <div class="account-card-info">
                <h3>Todos</h3>
                <p>Your personal WoW task board. Paste URLs to auto-fill, organise reminders, track progress.</p>
              </div>
            </a>
            <a href="my-youtube.html" class="account-card">
              <div class="account-card-icon"><i class="lab la-youtube"></i></div>
              <div class="account-card-info">
                <h3>YouTube</h3>
                <p>Curate your favourite WoW content creators with tag-based filtering and in-app playback.</p>
              </div>
            </a>
            <div class="account-card account-card-disabled">
              <div class="account-card-icon"><i class="las la-medal"></i></div>
              <div class="account-card-info">
                <h3>Achievement Lols <span style="font-size:10px;color:rgba(255,255,255,0.25);font-weight:400">— Coming Soon</span></h3>
                <p>Track ridiculous achievement progress across your account. Critter Kill Squad, loremaster, and other grinds — with live progress bars and how far you've still got to go.</p>
              </div>
            </div>
          </div>
        </div>
      `;

      // Character count
      accountService.getAccountCharacters().then(chars => {
        const el = document.getElementById('stat-characters');
        if (el) el.textContent = `${chars.length} characters`;
      }).catch(() => {
        const el = document.getElementById('stat-characters');
        if (el) el.textContent = '';
      });

      // Vault reward count from DB
      const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'https://crbntyp.com/gld/api' : '/gld/api';
      const token = authService.getAccessToken();
      fetch(`${apiBase}/vault.php`, { headers: { 'Authorization': `Bearer ${token}` } })
        .then(r => r.json())
        .then(data => {
          const el = document.getElementById('stat-vault');
          if (el && data.reward_count !== null && data.reward_count !== undefined) {
            el.textContent = data.reward_count > 0 ? `${data.reward_count} with rewards` : 'No rewards';
          } else if (el) {
            el.textContent = '';
          }
        })
        .catch(() => {
          const el = document.getElementById('stat-vault');
          if (el) el.textContent = '';
        });
    }
  });
});
