// My YouTube Page
import PageInitializer from './utils/page-initializer.js';
import YouTubeManager from './components/youtube-manager.js';

console.log('⚡ My YouTube Page initialized');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: true,
    onInit: async ({ authService }) => {
      // Initialize YouTube Manager with authService for user-specific storage
      const youtubeManager = new YouTubeManager('my-youtube-container', authService);
      youtubeManager.init();
    }
  });
});
