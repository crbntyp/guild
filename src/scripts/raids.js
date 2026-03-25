// Raids Page
import PageInitializer from './utils/page-initializer.js';
import RaidManager from './components/raid-manager.js';

console.log('⚡ Raids Page initialized');

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: true,
    onInit: async ({ authService }) => {
      const raidManager = new RaidManager('raids-container', authService);
      await raidManager.init();
    }
  });
});
