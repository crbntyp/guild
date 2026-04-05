import authService from '../services/auth.js';
import { checkBotAccess } from '../utils/bot-access.js';

/**
 * Top Bar Component - Handles Battle.net login UI
 */
class TopBar {
  constructor(containerId = 'top-bar-root') {
    this.containerId = containerId;
    this.rightContainer = null;
    this.leftContainer = null;
    this.isMobileMenuOpen = false;
    this.hasServerAccess = false;
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

    // Check if user has an approved Discord server alignment
    if (authService.isAuthenticated()) {
      const access = await checkBotAccess();
      this.hasServerAccess = !!access.allowed;
    }

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
    const hasServerAccess = this.hasServerAccess;

    // Get current page filename
    const currentPage = window.location.pathname.split('/').pop() || 'index.html';

    // Helper function to add active class
    const getActiveClass = (page) => {
      return currentPage === page ? ' active' : '';
    };

    // Check if any companion dropdown page is active for dropdown active state
    const isAccountPageActive = ['my-characters.html', 'my-todos.html', 'my-youtube.html', 'my-mounts.html', 'my-crafters.html', 'events.html', 'features.html'].includes(currentPage);

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
          <span>Home</span>
        </a>
        <a href="raids.html" class="nav-link${getActiveClass('raids.html')}">
          <span>Raids</span>
        </a>
        <a href="groups.html" class="nav-link${getActiveClass('groups.html')}">
          <span>Groups</span>
        </a>
        ${isAuthenticated && hasServerAccess ? `
          <a href="my-vault.html" class="nav-link${getActiveClass('my-vault.html')}">
            <span>Vault</span>
          </a>
          <a href="my-transmog.html" class="nav-link${getActiveClass('my-transmog.html')}">
            <span>Transmog</span>
          </a>
        ` : ''}
        <a href="mythic-plus.html" class="nav-link${getActiveClass('mythic-plus.html')}">
          <span>M+</span>
        </a>
        ${isAuthenticated ? `
          <div class="nav-dropdown">
            <button class="nav-link nav-dropdown-toggle${isAccountPageActive ? ' active' : ''}" aria-label="Companion menu">
              <span>Companion</span>
              <i class="las la-angle-down dropdown-arrow"></i>
            </button>
            <div class="nav-dropdown-menu">
              ${hasServerAccess ? `
                <a href="my-characters.html" class="nav-dropdown-link${getActiveClass('my-characters.html')}"><i class="las la-user"></i> Characters</a>
                <a href="my-crafters.html" class="nav-dropdown-link${getActiveClass('my-crafters.html')}"><i class="las la-hammer"></i> Crafters</a>
                <a href="my-mounts.html" class="nav-dropdown-link${getActiveClass('my-mounts.html')}"><i class="las la-horse"></i> Mounts</a>
                <a href="my-todos.html" class="nav-dropdown-link${getActiveClass('my-todos.html')}"><i class="las la-tasks"></i> Todos</a>
                <a href="my-youtube.html" class="nav-dropdown-link${getActiveClass('my-youtube.html')}"><i class="lab la-youtube"></i> Youtube Collection</a>
                <a href="events.html" class="nav-dropdown-link${getActiveClass('events.html')}"><i class="las la-calendar"></i> Ingame Events</a>
              ` : ''}
              <a href="features.html" class="nav-dropdown-link${getActiveClass('features.html')}"><i class="las la-info-circle"></i> Features</a>
            </div>
          </div>
        ` : ''}
        <a href="gallery.html" class="nav-link${getActiveClass('gallery.html')}">
          <span>Gallery</span>
        </a>
      </nav>
      <nav class="mobile-nav">
        <a href="index.html" class="mobile-nav-link${getActiveClass('index.html')}">
          <i class="las la-shield-alt"></i>
          <span>Home</span>
        </a>
        <a href="raids.html" class="mobile-nav-link${getActiveClass('raids.html')}">
          <i class="las la-dungeon"></i>
          <span>Raids</span>
        </a>
        <a href="groups.html" class="mobile-nav-link${getActiveClass('groups.html')}">
          <i class="las la-users"></i>
          <span>Groups</span>
        </a>
        ${isAuthenticated && hasServerAccess ? `
          <a href="my-vault.html" class="mobile-nav-link${getActiveClass('my-vault.html')}">
            <i class="las la-gift"></i>
            <span>Vault</span>
          </a>
          <a href="my-transmog.html" class="mobile-nav-link${getActiveClass('my-transmog.html')}">
            <i class="las la-tshirt"></i>
            <span>Transmog</span>
          </a>
        ` : ''}
        <a href="mythic-plus.html" class="mobile-nav-link${getActiveClass('mythic-plus.html')}">
          <i class="las la-trophy"></i>
          <span>M+</span>
        </a>
        ${isAuthenticated ? `
          <div class="mobile-nav-group">
            <div class="mobile-nav-group-header mobile-nav-link">
              <i class="las la-user-circle"></i>
              <span>Companion</span>
            </div>
            ${hasServerAccess ? `
              <a href="my-characters.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-characters.html')}">
                <i class="las la-user"></i>
                <span>Characters</span>
              </a>
              <a href="my-crafters.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-crafters.html')}">
                <i class="las la-hammer"></i>
                <span>Crafters</span>
              </a>
              <a href="my-mounts.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-mounts.html')}">
                <i class="las la-horse"></i>
                <span>Mounts</span>
              </a>
              <a href="my-todos.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-todos.html')}">
                <i class="las la-tasks"></i>
                <span>Todos</span>
              </a>
              <a href="my-youtube.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-youtube.html')}">
                <i class="lab la-youtube"></i>
                <span>Youtube Collection</span>
              </a>
              <a href="events.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('events.html')}">
                <i class="las la-calendar"></i>
                <span>Ingame Events</span>
              </a>
            ` : ''}
            <a href="features.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('features.html')}">
              <i class="las la-info-circle"></i>
              <span>Features</span>
            </a>
          </div>
        ` : ''}
        <a href="gallery.html" class="mobile-nav-link${getActiveClass('gallery.html')}">
          <i class="las la-images"></i>
          <span>Gallery</span>
        </a>
      </nav>
    `;

    // Setup dropdown functionality for desktop
    if (isAuthenticated) {
      this.setupDropdown();
    }
  }

  /**
   * Setup dropdown toggle functionality
   */
  setupDropdown() {
    const dropdown = document.querySelector('.nav-dropdown');
    const toggle = document.querySelector('.nav-dropdown-toggle');
    const menu = document.querySelector('.nav-dropdown-menu');

    if (!dropdown || !toggle || !menu) return;

    const openMenu = () => {
      menu.classList.add('active');
      toggle.classList.add('open');
    };

    const closeMenu = () => {
      menu.classList.remove('active');
      toggle.classList.remove('open');
    };

    toggle.addEventListener('click', (e) => {
      e.stopPropagation();
      if (menu.classList.contains('active')) {
        closeMenu();
      } else {
        openMenu();
      }
    });

    document.addEventListener('click', (e) => {
      if (!dropdown.contains(e.target)) {
        closeMenu();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMenu();
    });
  }

  /**
   * Render login button
   */
  renderLoginButton() {
    this.rightContainer.innerHTML = `
      <a href="link.html" class="btn-link-accounts" title="Link Discord & Battle.net"><i class="lab la-discord"></i></a>
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
        <div class="admin-tooltip" id="admin-tooltip"></div>
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
    this.loadAdminStats();
  }

  async loadAdminStats() {
    try {
      const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'https://crbntyp.com/gld/api' : '/gld/api';
      const token = (await import('../services/auth.js')).default.getAccessToken();
      const res = await fetch(`${apiBase}/admin-stats.php`, { headers: { 'Authorization': `Bearer ${token}` } });
      if (!res.ok) return;
      const stats = await res.json();
      const tooltip = document.getElementById('admin-tooltip');
      if (tooltip) {
        const tags = (stats.battletags || []).map(t => `<div class="admin-stat">${t.battletag} <span style="color:rgba(255,255,255,0.2)">(${t.logins})</span></div>`).join('');
        tooltip.innerHTML = tags;
      }
    } catch (e) {}
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
        try {
          const wowApi = (await import('../api/wow-api.js')).default;
          const mediaData = await wowApi.getCharacterMedia(mainChar.realm.slug, mainChar.name);
          const avatarAsset = mediaData?.assets?.find(a => a.key === 'avatar');
          if (avatarAsset?.value) {
            avatarContainer.innerHTML = `<img src="${avatarAsset.value}" alt="${mainChar.name}" class="user-avatar" />`;
          } else {
            avatarContainer.innerHTML = `<i class="las la-user"></i>`;
          }
        } catch (e) {
          avatarContainer.innerHTML = `<i class="las la-user"></i>`;
        }
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
