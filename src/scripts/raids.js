// Raids Page
import PageInitializer from './utils/page-initializer.js';
import RaidManager from './components/raid-manager.js';

console.log('⚡ Raids Page initialized');

// Raid zone backgrounds (using Blizzard render CDN)
const raidBackgrounds = [
  { path: 'https://render.worldofwarcraft.com/us/zones/the-voidspire-large.jpg', location: 'The Voidspire' },
  { path: 'https://render.worldofwarcraft.com/us/zones/march-on-queldanas-large.jpg', location: "March on Quel'Danas" },
  { path: 'https://render.worldofwarcraft.com/us/zones/the-dreamrift-large.jpg', location: 'The Dreamrift' }
];

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: true,
    backgrounds: raidBackgrounds,
    backgroundInterval: 10000,
    onInit: async ({ authService }) => {
      const raidManager = new RaidManager('raids-container', authService);
      await raidManager.init();
    }
  });
});
