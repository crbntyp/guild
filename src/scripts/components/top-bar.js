import authService from '../services/auth.js';

/**
 * Top Bar Component - Handles Battle.net login UI
 */
class TopBar {
  constructor(containerId = 'top-bar-root') {
    this.containerId = containerId;
    this.rightContainer = null;
    this.leftContainer = null;
    this.isMobileMenuOpen = false;
  }

  async init() {
    const container = document.getElementById(this.containerId);
    if (!container) {
      console.error(`TopBar: Container #${this.containerId} not found`);
      return;
    }

    // Render the full top-bar structure
    this.renderStructure(container);

    // Get references to the containers
    this.rightContainer = document.querySelector('.top-bar-right');
    this.leftContainer = document.querySelector('.top-bar-left');

    if (!this.rightContainer || !this.leftContainer) {
      console.error('TopBar: Could not find top-bar containers');
      return;
    }

    // Wait for initial auth check to complete
    await authService.waitForAuthCheck();

    // Render initial state
    this.render();

    // Listen for auth state changes
    window.addEventListener('auth-state-changed', () => {
      this.render();
    });
  }

  /**
   * Render the full top-bar HTML structure
   */
  renderStructure(container) {
    container.innerHTML = `
      <div class="top-bar">
        <div class="top-bar-content">
          <div class="top-bar-left"></div>
          <div class="top-bar-right">
            <button class="btn-login">
              <i class="las la-user"></i>
              <span>Login with Battle.net</span>
            </button>
          </div>
        </div>
      </div>
    `;
  }

  render() {
    // Render navigation on left
    this.renderNavigation();

    // Render based on auth state on right
    if (authService.isAuthenticated()) {
      this.renderUserInfo();
    } else {
      this.renderLoginButton();
    }

    // Setup mobile menu toggle
    this.setupMobileMenu();
  }

  setupMobileMenu() {
    const hamburger = document.querySelector('.hamburger-menu');
    const mobileNav = document.querySelector('.mobile-nav');

    if (hamburger && mobileNav) {
      // Remove existing listeners by cloning and replacing
      const newHamburger = hamburger.cloneNode(true);
      hamburger.parentNode.replaceChild(newHamburger, hamburger);

      newHamburger.addEventListener('click', () => {
        this.isMobileMenuOpen = !this.isMobileMenuOpen;
        newHamburger.classList.toggle('active');
        mobileNav.classList.toggle('active');
      });

      // Close menu when clicking a link
      const mobileLinks = mobileNav.querySelectorAll('.mobile-nav-link');
      mobileLinks.forEach(link => {
        link.addEventListener('click', () => {
          this.isMobileMenuOpen = false;
          newHamburger.classList.remove('active');
          mobileNav.classList.remove('active');
        });
      });
    }
  }

  /**
   * Render navigation links
   */
  renderNavigation() {
    if (!this.leftContainer) return;

    const isAuthenticated = authService.isAuthenticated();

    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Helper function to add active class
    const getActiveClass = (page) => {
      return currentPage === page ? ' active' : '';
    };

    this.leftContainer.innerHTML = `
      <a href="index.html" class="top-bar-logo">
        <i class="las la-shield-alt"></i>
      </a>
      <button class="hamburger-menu" aria-label="Toggle menu">
        <span></span>
        <span></span>
        <span></span>
      </button>
      <nav class="top-bar-nav">
        <a href="index.html" class="nav-link${getActiveClass('index.html')}">
          <i class="las la-search"></i>
          <span>Guild Finder</span>
        </a>
        ${isAuthenticated ? `<a href="my-characters.html" class="nav-link${getActiveClass('my-characters.html')}"><i class="las la-user"></i><span>My Characters</span></a>` : ''}
        ${isAuthenticated ? `<a href="my-todos.html" class="nav-link${getActiveClass('my-todos.html')}"><i class="las la-tasks"></i><span>My Todos</span></a>` : ''}
        ${isAuthenticated ? `<a href="my-youtube.html" class="nav-link${getActiveClass('my-youtube.html')}"><i class="lab la-youtube"></i><span>My YouTube</span></a>` : ''}
        <a href="gallery.html" class="nav-link${getActiveClass('gallery.html')}">
          <i class="las la-images"></i>
          <span>Gallery</span>
        </a>
      </nav>
      <nav class="mobile-nav">
        <a href="index.html" class="mobile-nav-link${getActiveClass('index.html')}">
          <i class="las la-search"></i>
          <span>Guild Finder</span>
        </a>
        ${isAuthenticated ? `<a href="my-characters.html" class="mobile-nav-link${getActiveClass('my-characters.html')}"><i class="las la-user"></i><span>My Characters</span></a>` : ''}
        ${isAuthenticated ? `<a href="my-todos.html" class="mobile-nav-link${getActiveClass('my-todos.html')}"><i class="las la-tasks"></i><span>My Todos</span></a>` : ''}
        ${isAuthenticated ? `<a href="my-youtube.html" class="mobile-nav-link${getActiveClass('my-youtube.html')}"><i class="lab la-youtube"></i><span>My YouTube</span></a>` : ''}
        <a href="gallery.html" class="mobile-nav-link${getActiveClass('gallery.html')}">
          <i class="las la-images"></i>
          <span>Gallery</span>
        </a>
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

    // Attach event listener with error handling
    const loginBtn = document.getElementById('bnet-login-btn');
    if (loginBtn) {

      loginBtn.addEventListener('click', (e) => {

        e.preventDefault();
        e.stopPropagation();
        authService.login();
      });
    } else {
      console.error('❌ Login button not found!');
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

      logoutBtn.addEventListener('click', (e) => {

        e.preventDefault();
        e.stopPropagation();
        authService.logout();
      });
    } else {
      console.error('❌ Logout button not found!');
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
