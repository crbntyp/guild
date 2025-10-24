import authService from '../services/auth.js';

/**
 * Top Bar Component - Handles Battle.net login UI
 */
class TopBar {
  constructor() {
    this.rightContainer = document.querySelector('.top-bar-right');
    this.leftContainer = document.querySelector('.top-bar-left');
    this.init();
  }

  init() {
    if (!this.rightContainer) {
      return;
    }

    // Render navigation on left
    this.renderNavigation();

    // Render based on auth state on right
    if (authService.isAuthenticated()) {
      this.renderUserInfo();
    } else {
      this.renderLoginButton();
    }
  }

  /**
   * Render navigation links
   */
  renderNavigation() {
    if (!this.leftContainer) return;

    const isAuthenticated = authService.isAuthenticated();

    this.leftContainer.innerHTML = `
      <nav class="top-bar-nav">
        <a href="index.html" class="nav-link">Guild Finder</a>
        ${isAuthenticated ? '<a href="my-characters.html" class="nav-link">My Characters</a>' : ''}
      </nav>
    `;
  }

  /**
   * Render login button
   */
  renderLoginButton() {
    this.rightContainer.innerHTML = `
      <button class="btn-login" id="bnet-login-btn">
        <i class="las la-user"></i>
        <span>Login with Battle.net</span>
      </button>
    `;

    // Attach event listener
    const loginBtn = document.getElementById('bnet-login-btn');
    if (loginBtn) {
      loginBtn.addEventListener('click', () => {
        authService.login();
      });
    }
  }

  /**
   * Render user info after login
   */
  async renderUserInfo() {
    const user = authService.getUser();
    if (!user) {
      this.renderLoginButton();
      return;
    }

    this.rightContainer.innerHTML = `
      <div class="user-info">
        <div class="user-avatar-container">
          <i class="las la-circle-notch la-spin"></i>
        </div>
        <a href="my-characters.html" class="user-battletag">${user.battletag || 'User'}</a>
        <button class="btn-logout" id="bnet-logout-btn">
          Logout
        </button>
      </div>
    `;

    // Attach logout event listener
    const logoutBtn = document.getElementById('bnet-logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', () => {
        authService.logout();
      });
    }

    // Load user's main character avatar
    this.loadUserAvatar();
  }

  /**
   * Load and display user's main character avatar
   */
  async loadUserAvatar() {
    try {
      const accountService = (await import('../services/account-service.js')).default;
      const mainChar = await accountService.getMainCharacter();

      const avatarContainer = this.rightContainer.querySelector('.user-avatar-container');
      if (!avatarContainer) return;

      if (mainChar) {
        const avatarUrl = `https://render.worldofwarcraft.com/eu/character/${mainChar.realm.slug}/${mainChar.name.toLowerCase()}-avatar.jpg`;

        const img = new Image();
        img.onload = () => {
          avatarContainer.innerHTML = `<img src="${avatarUrl}" alt="${mainChar.name}" class="user-avatar" />`;
        };
        img.onerror = () => {
          avatarContainer.innerHTML = `<i class="las la-user"></i>`;
        };
        img.src = avatarUrl;
      } else {
        avatarContainer.innerHTML = `<i class="las la-user"></i>`;
      }
    } catch (error) {
      console.error('Error loading user avatar:', error);
      const avatarContainer = this.rightContainer.querySelector('.user-avatar-container');
      if (avatarContainer) {
        avatarContainer.innerHTML = `<i class="las la-user"></i>`;
      }
    }
  }
}

export default TopBar;
