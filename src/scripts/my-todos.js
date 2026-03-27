// My Todos Page
import PageInitializer from './utils/page-initializer.js';
import TodoManager from './components/todo-manager.js';
import authService from './services/auth.js';

console.log('⚡ My Todos Page initialized');

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      window.addEventListener('auth-state-changed', () => window.location.reload());

      if (authService.isAuthenticated()) {
        const todoManager = new TodoManager('todos-container', authService);
        todoManager.init();
      } else {
        document.getElementById('todos-container').innerHTML = `
          <div class="auth-required-view">
            <h2>Authentication Required</h2>
            <p>Log in with your Battle.net account to view this page.</p>
            <button class="btn-login-auth" id="btn-login-todos">
              <i class="las la-user"></i>
              Login with Battle.net
            </button>
          </div>
        `;
        document.getElementById('btn-login-todos')?.addEventListener('click', () => authService.login());
      }
    }
  });
});
