// My Todos Page
import PageInitializer from './utils/page-initializer.js';
import TodoManager from './components/todo-manager.js';

console.log('⚡ My Todos Page initialized');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: true,
    onInit: async ({ authService }) => {
      // Initialize todo manager with authService for user-specific storage
      const todoManager = new TodoManager('todos-container', authService);
      todoManager.init();
    }
  });
});
