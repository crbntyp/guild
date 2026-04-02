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

    // Check if any account page is active for dropdown active state
    const isAccountPageActive = ['my-characters.html', 'my-todos.html', 'my-youtube.html', 'my-mounts.html', 'my-crafters.html', 'my-vault.html', 'my-transmog.html'].includes(currentPage);

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
        ${isAuthenticated ? `
          <div class="nav-mega">
            <button class="nav-link nav-mega-toggle${isAccountPageActive || currentPage === 'my-account.html' ? ' active' : ''}" aria-label="Your Account menu">
              <i class="las la-user-circle"></i>
              <span>My Account</span>
              <i class="las la-angle-down dropdown-arrow"></i>
            </button>
            <div class="nav-mega-menu">
              <div class="void-cinders"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
              <div class="mega-featured">
                <a href="my-characters.html" class="mega-card${getActiveClass('my-characters.html')}">
                  <div class="mega-card-preview">
                    <div class="mega-card-scene">
                      <div class="member-card" style="pointer-events:none;width:120px">
                        <div class="member-level">90<span class="member-ilvl">263</span></div>
                        <div class="character-avatar-placeholder" style="height:80px"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/58/170575674-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                        <div class="member-header"><div class="member-name" style="color:#A330C9;font-size:10px">Felbladë</div></div>
                      </div>
                      <div class="member-card" style="pointer-events:none;width:120px">
                        <div class="member-level">90<span class="member-ilvl">258</span></div>
                        <div class="character-avatar-placeholder" style="height:80px"><img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/115/171270003-inset.jpg" style="width:100%;height:100%;object-fit:cover;object-position:top" /></div>
                        <div class="member-header"><div class="member-name" style="color:#FFF569;font-size:10px">Fëlstriker</div></div>
                      </div>
                    </div>
                    <div class="mega-card-overlay"></div>
                  </div>
                  <div class="mega-card-info">
                    <span class="mega-card-title">Characters</span>
                    <span class="mega-card-desc">All your characters, gear, and specs</span>
                  </div>
                </a>
                <a href="my-vault.html" class="mega-card${getActiveClass('my-vault.html')}">
                  <div class="mega-card-preview">
                    <div class="mega-card-scene mega-scene-sm">
                      <div style="display:flex;flex-direction:column;gap:4px;width:200px">
                        <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(0,0,0,0.3);border-radius:4px">
                          <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/243/171270131-avatar.jpg" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,0.1)" />
                          <span style="color:#F58CBA;font-size:9px;font-weight:600">Bäsics</span>
                          <span class="vault-badge vault-raids" style="font-size:7px;padding:1px 4px">Raids</span>
                          <span class="vault-badge vault-mplus" style="font-size:7px;padding:1px 4px">M+</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(0,0,0,0.3);border-radius:4px">
                          <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/41/171269673-avatar.jpg" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,0.1)" />
                          <span style="color:#8787ED;font-size:9px;font-weight:600">Blighthöund</span>
                          <span class="vault-badge vault-mplus" style="font-size:7px;padding:1px 4px">M+</span>
                          <span class="vault-badge vault-delves" style="font-size:7px;padding:1px 4px">Delves</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:6px;padding:4px 8px;background:rgba(0,0,0,0.3);border-radius:4px">
                          <img src="https://render.worldofwarcraft.com/eu/character/tarren-mill/58/170575674-avatar.jpg" style="width:20px;height:20px;border-radius:50%;border:1px solid rgba(255,255,255,0.1)" />
                          <span style="color:#A330C9;font-size:9px;font-weight:600">Felbladë</span>
                          <span class="vault-badge vault-raids" style="font-size:7px;padding:1px 4px">Raids</span>
                          <span class="vault-badge vault-delves" style="font-size:7px;padding:1px 4px">Delves</span>
                        </div>
                      </div>
                    </div>
                    <div class="mega-card-overlay"></div>
                  </div>
                  <div class="mega-card-info">
                    <span class="mega-card-title">Weekly Vault</span>
                    <span class="mega-card-desc">Your raid, M+, and delve rewards</span>
                  </div>
                </a>
                <a href="my-transmog.html" class="mega-card${getActiveClass('my-transmog.html')}">
                  <div class="mega-card-preview">
                    <div class="mega-card-scene mega-scene-sm">
                      <div style="width:160px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:6px">
                        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
                          <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_cloth_raidwarlockmidnight_d_01.jpg" style="width:16px;height:16px;border-radius:3px" />
                          <span style="font-size:8px;font-weight:700;color:#fff">Abyssal Immolator</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:4px;padding:2px 0"><img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_cloth_raidwarlockmidnight_d_01.jpg" style="width:14px;height:14px;border-radius:2px;flex-shrink:0;display:block" /><span style="font-size:7px;color:rgba(255,255,255,0.3);min-width:30px">HEAD</span><span style="font-size:8px;color:rgba(255,255,255,0.7)">Hood</span><i class="las la-check" style="color:#10b981;font-size:9px;margin-left:auto"></i></div>
                        <div style="display:flex;align-items:center;gap:4px;padding:2px 0"><img src="https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_cloth_raidwarlockmidnight_d_01.jpg" style="width:14px;height:14px;border-radius:2px;flex-shrink:0;display:block" /><span style="font-size:7px;color:rgba(255,255,255,0.3);min-width:30px">SHOULDER</span><span style="font-size:8px;color:rgba(255,255,255,0.7)">Mantle</span><i class="las la-check" style="color:#10b981;font-size:9px;margin-left:auto"></i></div>
                        <div style="display:flex;align-items:center;gap:4px;padding:2px 0;opacity:0.4"><img src="https://render.worldofwarcraft.com/eu/icons/56/inv_chest_cloth_raidwarlockmidnight_d_01.jpg" style="width:14px;height:14px;border-radius:2px;flex-shrink:0;display:block" /><span style="font-size:7px;color:rgba(255,255,255,0.3);min-width:30px">CHEST</span><span style="font-size:8px;color:rgba(255,255,255,0.5)">Robe</span></div>
                      </div>
                      <div style="width:160px;background:rgba(0,0,0,0.35);border:1px solid rgba(255,255,255,0.06);border-radius:6px;padding:6px">
                        <div style="display:flex;align-items:center;gap:4px;margin-bottom:4px">
                          <img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_plate_raidpaladinmidnight_d_01.jpg" style="width:16px;height:16px;border-radius:3px" />
                          <span style="font-size:8px;font-weight:700;color:#fff">Luminant Verdict</span>
                        </div>
                        <div style="display:flex;align-items:center;gap:4px;padding:2px 0"><img src="https://render.worldofwarcraft.com/eu/icons/56/inv_helm_plate_raidpaladinmidnight_d_01.jpg" style="width:14px;height:14px;border-radius:2px;flex-shrink:0;display:block" /><span style="font-size:7px;color:rgba(255,255,255,0.3);min-width:30px">HEAD</span><span style="font-size:8px;color:rgba(255,255,255,0.7)">Helm</span><i class="las la-check" style="color:#10b981;font-size:9px;margin-left:auto"></i></div>
                        <div style="display:flex;align-items:center;gap:4px;padding:2px 0"><img src="https://render.worldofwarcraft.com/eu/icons/56/inv_shoulder_plate_raidpaladinmidnight_d_01.jpg" style="width:14px;height:14px;border-radius:2px;flex-shrink:0;display:block" /><span style="font-size:7px;color:rgba(255,255,255,0.3);min-width:30px">SHOULDER</span><span style="font-size:8px;color:rgba(255,255,255,0.7)">Pauldrons</span><i class="las la-check" style="color:#10b981;font-size:9px;margin-left:auto"></i></div>
                        <div style="display:flex;align-items:center;gap:4px;padding:2px 0"><img src="https://render.worldofwarcraft.com/eu/icons/56/inv_chest_plate_raidpaladinmidnight_d_01.jpg" style="width:14px;height:14px;border-radius:2px;flex-shrink:0;display:block" /><span style="font-size:7px;color:rgba(255,255,255,0.3);min-width:30px">CHEST</span><span style="font-size:8px;color:rgba(255,255,255,0.7)">Breastplate</span><i class="las la-check" style="color:#10b981;font-size:9px;margin-left:auto"></i></div>
                      </div>
                    </div>
                    <div class="mega-card-overlay"></div>
                  </div>
                  <div class="mega-card-info">
                    <span class="mega-card-title">Your Transmogs</span>
                    <span class="mega-card-desc">Your progress and collections</span>
                  </div>
                </a>
                <a href="raids.html" class="mega-card${getActiveClass('raids.html')}">
                  <div class="mega-card-preview">
                    <div class="mega-card-scene mega-scene-sm">
                      <div class="raid-card status-open" style="pointer-events:none;width:160px;min-width:160px">
                        <div class="raid-card-banner" style="background-image:url('https://render.worldofwarcraft.com/us/zones/the-voidspire-small.jpg');height:50px">
                          <div class="raid-card-banner-overlay"></div>
                          <div class="raid-card-banner-content">
                            <div class="raid-card-title"><h3 style="font-size:9px;margin:0">The Voidspire</h3><span class="raid-difficulty-badge difficulty-heroic" style="font-size:6px;padding:1px 3px">heroic</span></div>
                          </div>
                        </div>
                        <div class="raid-card-body" style="padding:5px 6px">
                          <div class="raid-card-roles" style="gap:4px">
                            <div class="raid-role"><span class="raid-role-icon tank" style="width:14px;height:14px;display:flex;align-items:center;justify-content:center"><i class="las la-shield-alt" style="font-size:8px"></i></span><span class="raid-role-count" style="font-size:7px">2/2</span></div>
                            <div class="raid-role"><span class="raid-role-icon healer" style="width:14px;height:14px;display:flex;align-items:center;justify-content:center"><i class="las la-plus-circle" style="font-size:8px"></i></span><span class="raid-role-count" style="font-size:7px">3/4</span></div>
                            <div class="raid-role"><span class="raid-role-icon dps" style="width:14px;height:14px;display:flex;align-items:center;justify-content:center"><i class="las la-crosshairs" style="font-size:8px"></i></span><span class="raid-role-count" style="font-size:7px">8/14</span></div>
                          </div>
                        </div>
                      </div>
                      <div class="raid-card status-full" style="pointer-events:none;width:160px;min-width:160px">
                        <div class="raid-card-banner" style="background-image:url('https://render.worldofwarcraft.com/us/zones/march-on-queldanas-small.jpg');height:50px">
                          <div class="raid-card-banner-overlay"></div>
                          <div class="raid-card-banner-content">
                            <div class="raid-card-title"><h3 style="font-size:9px;margin:0">Quel'Danas</h3><span class="raid-difficulty-badge difficulty-mythic" style="font-size:6px;padding:1px 3px">mythic</span></div>
                          </div>
                        </div>
                        <div class="raid-card-body" style="padding:5px 6px">
                          <div class="raid-card-roles" style="gap:4px">
                            <div class="raid-role"><span class="raid-role-icon tank" style="width:14px;height:14px;display:flex;align-items:center;justify-content:center"><i class="las la-shield-alt" style="font-size:8px"></i></span><span class="raid-role-count" style="font-size:7px">1/1</span></div>
                            <div class="raid-role"><span class="raid-role-icon healer" style="width:14px;height:14px;display:flex;align-items:center;justify-content:center"><i class="las la-plus-circle" style="font-size:8px"></i></span><span class="raid-role-count" style="font-size:7px">2/2</span></div>
                            <div class="raid-role"><span class="raid-role-icon dps" style="width:14px;height:14px;display:flex;align-items:center;justify-content:center"><i class="las la-crosshairs" style="font-size:8px"></i></span><span class="raid-role-count" style="font-size:7px">7/7</span></div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div class="mega-card-overlay"></div>
                  </div>
                  <div class="mega-card-info">
                    <span class="mega-card-title">Discord Bot & Raid Signups</span>
                    <span class="mega-card-desc">Use your Bnet account to sign up...here</span>
                  </div>
                </a>
              </div>
              <div class="mega-links">
                <a href="my-crafters.html" class="mega-link${getActiveClass('my-crafters.html')}"><i class="las la-hammer"></i> Crafters</a>
                <a href="my-mounts.html" class="mega-link${getActiveClass('my-mounts.html')}"><i class="las la-horse"></i> Mounts</a>
                <a href="my-todos.html" class="mega-link${getActiveClass('my-todos.html')}"><i class="las la-tasks"></i> Todos</a>
                <a href="my-youtube.html" class="mega-link${getActiveClass('my-youtube.html')}"><i class="lab la-youtube"></i> YouTube</a>
                <span class="mega-link disabled"><i class="las la-medal"></i> Achievement Lols (TBA)</span>
                <a href="my-account.html" class="mega-link mega-link-account${getActiveClass('my-account.html')}"><i class="las la-user-circle"></i> My Account</a>
              </div>
            </div>
          </div>
        ` : ''}
        <a href="raids.html" class="nav-link${getActiveClass('raids.html')}">
          <i class="las la-dungeon"></i>
          <span>Raids</span>
        </a>
        <a href="mythic-plus.html" class="nav-link${getActiveClass('mythic-plus.html')}">
          <i class="las la-trophy"></i>
          <span>Mythic+</span>
        </a>
        <a href="events.html" class="nav-link${getActiveClass('events.html')}">
          <i class="las la-calendar"></i>
          <span>Events</span>
        </a>
        <a href="gallery.html" class="nav-link${getActiveClass('gallery.html')}">
          <i class="las la-images"></i>
          <span>Gallery</span>
        </a>
      </nav>
      <nav class="mobile-nav">
        <a href="index.html" class="mobile-nav-link${getActiveClass('index.html')}">
          <i class="las la-shield-alt"></i>
          <span>Home</span>
        </a>
        ${isAuthenticated ? `
          <div class="mobile-nav-group">
            <a href="my-account.html" class="mobile-nav-group-header mobile-nav-link${getActiveClass('my-account.html')}">
              <i class="las la-user-circle"></i>
              <span>My Account</span>
            </a>
            <a href="my-characters.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-characters.html')}">
              <i class="las la-user"></i>
              <span>My Characters</span>
            </a>
            <a href="my-todos.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-todos.html')}">
              <i class="las la-tasks"></i>
              <span>My Todos</span>
            </a>
            <a href="my-youtube.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-youtube.html')}">
              <i class="lab la-youtube"></i>
              <span>My YouTube</span>
            </a>
            <a href="my-mounts.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-mounts.html')}">
              <i class="las la-horse"></i>
              <span>My Mounts</span>
            </a>
            <a href="my-crafters.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-crafters.html')}">
              <i class="las la-hammer"></i>
              <span>Crafters</span>
            </a>
            <a href="my-vault.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-vault.html')}">
              <i class="las la-gift"></i>
              <span>Weekly Vault</span>
            </a>
            <a href="my-transmog.html" class="mobile-nav-link mobile-nav-link-indent${getActiveClass('my-transmog.html')}">
              <i class="las la-tshirt"></i>
              <span>Transmog Sets</span>
            </a>
          </div>
        ` : ''}
        <a href="raids.html" class="mobile-nav-link${getActiveClass('raids.html')}">
          <i class="las la-dungeon"></i>
          <span>Raids</span>
        </a>
        <a href="mythic-plus.html" class="mobile-nav-link${getActiveClass('mythic-plus.html')}">
          <i class="las la-trophy"></i>
          <span>Mythic+</span>
        </a>
        <a href="events.html" class="mobile-nav-link${getActiveClass('events.html')}">
          <i class="las la-calendar"></i>
          <span>Events</span>
        </a>
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
    const mega = document.querySelector('.nav-mega');
    const toggle = document.querySelector('.nav-mega-toggle');
    const menu = document.querySelector('.nav-mega-menu');

    if (!mega || !toggle || !menu) return;

    // Move menu and overlay to body to escape top-bar stacking context
    const overlay = document.createElement('div');
    overlay.className = 'nav-mega-overlay';
    document.body.appendChild(overlay);
    document.body.appendChild(menu);

    const openMenu = () => {
      overlay.classList.add('active');
      menu.classList.add('active');
      toggle.classList.add('open');
    };

    const closeMenu = () => {
      overlay.classList.remove('active');
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

    overlay.addEventListener('click', closeMenu);

    document.addEventListener('click', (e) => {
      if (!mega.contains(e.target) && !menu.contains(e.target)) {
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
          <div class="admin-tooltip" id="admin-tooltip"></div>
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

      const setAvatarContent = (container, html) => {
        const tooltip = container.querySelector('.admin-tooltip');
        container.innerHTML = html;
        if (tooltip) container.appendChild(tooltip);
      };

      if (mainChar) {
        // Use the character media API for reliable avatar URLs
        try {
          const wowApi = (await import('../api/wow-api.js')).default;
          const mediaData = await wowApi.getCharacterMedia(mainChar.realm.slug, mainChar.name);
          const avatarAsset = mediaData?.assets?.find(a => a.key === 'avatar');
          if (avatarAsset?.value) {
            setAvatarContent(avatarContainer, `<img src="${avatarAsset.value}" alt="${mainChar.name}" class="user-avatar" />`);
          } else {
            setAvatarContent(avatarContainer, `<i class="las la-user"></i>`);
          }
        } catch (e) {
          setAvatarContent(avatarContainer, `<i class="las la-user"></i>`);
        }
      } else {
        setAvatarContent(avatarContainer, `<i class="las la-user"></i>`);
      }
    } catch (error) {
      console.error('Error loading user avatar:', error);
      const avatarContainer = this.rightContainer.querySelector('.user-avatar-container');
      if (avatarContainer) {
        const tooltip = avatarContainer.querySelector('.admin-tooltip');
        avatarContainer.innerHTML = `<i class="las la-user"></i>`;
        if (tooltip) avatarContainer.appendChild(tooltip);
      }
    }
  }
}

export default TopBar;
