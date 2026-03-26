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
      if (authService.isAuthenticated()) {
        const raidManager = new RaidManager('raids-container', authService);
        await raidManager.init();
      } else {
        const container = document.getElementById('raids-container');
        container.innerHTML = `
          <div class="raids-login-prompt">
            <i class="las la-dungeon la-4x"></i>
            <h2>Raid Signups</h2>
            <p>Log in with your Battle.net account to view and sign up for upcoming raids.</p>
            <button class="btn-login-raids" id="btn-login-raids">
              <i class="las la-user"></i>
              Login with Battle.net
            </button>
          </div>
        `;
        document.getElementById('btn-login-raids').addEventListener('click', () => {
          authService.login();
        });
      }
    }
  });
});
