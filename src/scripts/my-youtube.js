// My YouTube Page
import PageInitializer from './utils/page-initializer.js';
import YouTubeManager from './components/youtube-manager.js';
import authService from './services/auth.js';

console.log('⚡ My YouTube Page initialized');

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      window.addEventListener('auth-state-changed', () => window.location.reload());

      if (authService.isAuthenticated()) {
        const youtubeManager = new YouTubeManager('my-youtube-container', authService);
        youtubeManager.init();
      } else {
        document.getElementById('my-youtube-container').innerHTML = `
          <div class="auth-required-view">
            <i class="lab la-youtube la-3x"></i>
            <h2>My YouTube</h2>
            <p>Log in with your Battle.net account to curate your favourite WoW YouTube channels.</p>
            <button class="btn-login-auth" id="btn-login-youtube">
              <i class="las la-user"></i>
              Login with Battle.net
            </button>
          </div>
        `;
        document.getElementById('btn-login-youtube')?.addEventListener('click', () => authService.login());
      }
    }
  });
});
