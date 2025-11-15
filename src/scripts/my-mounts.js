// My Mounts page - displays user's mount collection grouped by expansion
import PageInitializer from './utils/page-initializer.js';
import AuthService from './services/auth.js';
import AccountService from './services/account-service.js';
import WoWAPI from './api/wow-api.js';
import { getAllMountData, getMountImageUrl } from './data/generated-mount-data.js';
import { getMountSpellId } from './data/mount-spell-ids.js';

// Expansion names (from API expansion IDs)
const EXPANSIONS = {
  0: 'Classic',
  1: 'The Burning Crusade',
  2: 'Wrath of the Lich King',
  3: 'Cataclysm',
  4: 'Mists of Pandaria',
  5: 'Warlords of Draenor',
  6: 'Legion',
  7: 'Battle for Azeroth',
  8: 'Shadowlands',
  9: 'Dragonflight',
  10: 'The War Within'
};

console.log('⚡ My Mounts initialized');

class MountsPage {
  constructor() {
    this.container = document.getElementById('mounts-content');
    this.countElement = document.getElementById('mount-count');
    this.ownedMounts = []; // Full mount data from API
    this.ownedMountIds = new Set(); // Track owned mount IDs
    this.totalMounts = 0;
    this.loadedImages = 0;
    this.totalImages = 0;
    this.groupedMounts = {}; // Cache grouped mounts
    this.activeTab = null; // Track active expansion tab
  }

  async init() {
    // Check if user is authenticated
    if (!AuthService.isAuthenticated()) {
      this.renderUnauthenticated();
      return;
    }

    try {
      // Get user's main character for API call (mounts are account-wide)
      const character = await AccountService.getMainCharacter();

      if (!character) {
        this.renderNoCharacter();
        return;
      }

      // Fetch mounts collection
      await this.loadMounts(character);

      // Render mounts
      this.render();
    } catch (error) {
      console.error('Error loading mounts:', error);
      this.renderError(error);
    }
  }

  async loadMounts(character) {
    const accessToken = AuthService.getAccessToken();
    const realmSlug = character.realm.slug;
    const characterName = character.name;

    try {
      const data = await WoWAPI.getCharacterMountsCollection(realmSlug, characterName, accessToken);
      this.ownedMounts = data.mounts || [];
      this.totalMounts = this.ownedMounts.length;

      // Update header count
      if (this.countElement) {
        this.countElement.textContent = `(${this.totalMounts})`;
      }

      // Create a Set of owned mount IDs for quick lookup
      this.ownedMountIds = new Set(this.ownedMounts.map(mount => mount.mount.id));

      console.log(`✅ Loaded ${this.totalMounts} total mounts from API`);
      console.log(`📊 Database has ${Object.keys(await getAllMountData()).length} cataloged mounts`);
    } catch (error) {
      console.error('Failed to load mounts:', error);
      throw error;
    }
  }

  async groupMountsByExpansion() {
    const grouped = {};

    // Initialize all expansions with empty arrays
    Object.keys(EXPANSIONS).forEach(expId => {
      grouped[expId] = [];
    });

    // Get all mounts metadata from generated database
    const allMountsData = await getAllMountData();

    // Group owned mounts by expansion from database
    let mountsWithData = 0;
    let mountsWithoutData = 0;

    this.ownedMounts.forEach(apiMount => {
      const mountId = apiMount.mount.id;

      // Get mount metadata from our database
      const mountData = allMountsData[mountId];

      // Only include mounts we have metadata for
      if (mountData) {
        mountsWithData++;
        const expansionId = mountData.expansion; // Use database's heuristic expansion

        if (!grouped[expansionId]) {
          grouped[expansionId] = [];
        }

        grouped[expansionId].push({
          data: mountData,
          owned: true,
          isUseable: apiMount.is_useable
        });
      } else {
        mountsWithoutData++;
      }
    });

    console.log(`📊 Mounts grouped: ${mountsWithData} with data, ${mountsWithoutData} without data`);
    console.log(`📊 Grouped mounts:`, Object.keys(grouped).map(exp => `Exp ${exp}: ${grouped[exp].length}`).join(', '));

    return grouped;
  }

  async render() {
    if (!this.container) return;

    this.groupedMounts = await this.groupMountsByExpansion();

    // Get expansion IDs (reverse order - newest first)
    const expansionIds = Object.keys(EXPANSIONS).reverse();
    const expansionsWithMounts = expansionIds.filter(expId =>
      this.groupedMounts[expId] && this.groupedMounts[expId].length > 0
    );

    // Set default active tab to first expansion with mounts
    if (!this.activeTab && expansionsWithMounts.length > 0) {
      this.activeTab = expansionsWithMounts[0];
    }

    // Set total images for active tab
    this.totalImages = this.groupedMounts[this.activeTab]?.length || 0;
    this.loadedImages = 0;

    let html = `
      <div class="expansion-tabs">
        <div class="tabs-header">
          <div class="tabs-scroll-container" id="tabs-scroll-container">
    `;

    // Render tab buttons
    expansionsWithMounts.forEach(expId => {
      const expansionName = EXPANSIONS[expId];
      const mounts = this.groupedMounts[expId] || [];
      const isActive = expId === this.activeTab;

      html += `
        <button
          class="tab-button ${isActive ? 'active' : ''}"
          data-expansion="${expId}"
        >
          <span class="tab-name">${expansionName}</span>
          <span class="tab-count">${mounts.length}</span>
        </button>
      `;
    });

    html += `
          </div>
          <div class="tabs-nav-buttons">
            <button class="tab-nav-btn tab-nav-left" id="tab-nav-left">
              <i class="las la-angle-left"></i>
            </button>
            <button class="tab-nav-btn tab-nav-right" id="tab-nav-right">
              <i class="las la-angle-right"></i>
            </button>
          </div>
        </div>
        <div class="tab-content" id="tab-content">
    `;

    // Render active tab's mounts
    html += await this.renderExpansionMounts(this.activeTab);

    html += `
        </div>
      </div>
    `;

    // Add progress indicator at the end (will be updated per tab)
    const activeTabMountCount = this.groupedMounts[this.activeTab]?.length || 0;
    html += `
      <div id="image-loading-progress" class="image-loading-progress">
        <div class="progress-text">
          Lazy loading images <span id="progress-count">0</span> / <span id="progress-total">${activeTabMountCount}</span>
        </div>
        <div class="progress-bar">
          <div id="progress-fill" class="progress-fill"></div>
        </div>
      </div>
    `;

    this.container.innerHTML = html;

    // Refresh Wowhead tooltips after content is added
    this.refreshWowheadTooltips();

    // Set up tab click handlers
    this.setupTabHandlers();

    // Set up tab navigation arrows
    this.setupTabNavigation();

    // Set up lazy loading and progress tracking for active tab
    this.setupLazyLoading();
  }

  setupTabNavigation() {
    const scrollContainer = document.getElementById('tabs-scroll-container');
    const leftBtn = document.getElementById('tab-nav-left');
    const rightBtn = document.getElementById('tab-nav-right');

    if (!scrollContainer || !leftBtn || !rightBtn) return;

    const scrollAmount = 200;

    leftBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: -scrollAmount, behavior: 'smooth' });
    });

    rightBtn.addEventListener('click', () => {
      scrollContainer.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    });
  }

  async renderExpansionMounts(expId) {
    const mounts = this.groupedMounts[expId] || [];

    let html = `<div class="mounts-grid">`;

    for (const mount of mounts) {
      const imageUrl = getMountImageUrl(mount.data.image);
      const placeholderUrl = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';

      // Get the correct spell ID for Wowhead tooltips
      const spellId = await getMountSpellId(mount.data.id);

      html += `
        <div class="mount-item" data-mount-id="${mount.data.id}">
          <div class="mount-icon-container">
            <a href="https://www.wowhead.com/spell=${spellId}" target="_blank" data-wowhead="spell=${spellId}" class="mount-icon-link"></a>
          </div>
          <div class="mount-name-text">${mount.data.name}</div>
        </div>
      `;
    }

    html += `</div>`;

    return html;
  }

  setupTabHandlers() {
    const tabButtons = document.querySelectorAll('.tab-button');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const expId = button.getAttribute('data-expansion');
        this.switchTab(expId);
      });
    });
  }

  async switchTab(expId) {
    if (this.activeTab === expId) return;

    this.activeTab = expId;

    // Update active button
    document.querySelectorAll('.tab-button').forEach(btn => {
      btn.classList.toggle('active', btn.getAttribute('data-expansion') === expId);
    });

    // Update content
    const tabContent = document.getElementById('tab-content');
    if (tabContent) {
      tabContent.innerHTML = await this.renderExpansionMounts(expId);

      // Reset progress counter for new tab
      this.loadedImages = 0;
      const newTabMountCount = this.groupedMounts[expId]?.length || 0;
      this.totalImages = newTabMountCount;

      // Update progress indicator
      const progressTotal = document.getElementById('progress-total');
      const progressCount = document.getElementById('progress-count');
      const progressFill = document.getElementById('progress-fill');
      const progressContainer = document.getElementById('image-loading-progress');

      if (progressTotal) progressTotal.textContent = newTabMountCount;
      if (progressCount) progressCount.textContent = '0';
      if (progressFill) progressFill.style.width = '0%';
      if (progressContainer) {
        progressContainer.style.display = 'block';
        progressContainer.style.opacity = '1';
      }

      // Re-setup lazy loading for new images
      this.setupLazyLoading();

      // Refresh Wowhead tooltips for new tab content
      this.refreshWowheadTooltips();
    }
  }

  refreshWowheadTooltips() {
    // Refresh Wowhead tooltips after dynamic content loads
    if (typeof window.$WowheadPower !== 'undefined') {
      window.$WowheadPower.refreshLinks();

      // Immediately start watching for icon changes
      this.watchForIconChanges();

      // Also do a delayed upgrade as backup
      setTimeout(() => {
        this.upgradeMountIcons();
      }, 500);
    }
  }

  watchForIconChanges() {
    // Watch for when Wowhead adds background-image styles and immediately upgrade them
    const iconLinks = document.querySelectorAll('.mount-icon-link');

    iconLinks.forEach(link => {
      const observer = new MutationObserver(() => {
        const style = link.getAttribute('style');
        if (style && style.includes('background-image')) {
          // Immediately upgrade to jpg version
          let newStyle = style.replace(/\/tiny\//g, '/large/');
          newStyle = newStyle.replace(/\.gif/g, '.jpg');
          link.setAttribute('style', newStyle);
          link.style.backgroundSize = 'contain';
          link.style.width = '64px';
          link.style.height = '64px';

          // Show the icon now that it's upgraded
          link.classList.add('icon-ready');

          // Disconnect observer since we're done
          observer.disconnect();
        }
      });

      observer.observe(link, {
        attributes: true,
        attributeFilter: ['style']
      });

      // Stop observing after 2 seconds to prevent memory leaks
      setTimeout(() => {
        observer.disconnect();
        // Show icon anyway if observer hasn't triggered
        if (!link.classList.contains('icon-ready')) {
          link.classList.add('icon-ready');
        }
      }, 2000);
    });
  }

  upgradeMountIcons() {
    // Upgrade Wowhead's tiny icons to large icons
    const iconLinks = document.querySelectorAll('.mount-icon-link');

    // Edge case mounts that should always show fallback icon
    const forceNoIconMounts = [1798, 2304, 2305, 2308]; // Azure Worldchiller, Chaos-Forged mounts

    iconLinks.forEach(link => {
      // Get mount ID from parent container
      const mountItem = link.closest('.mount-item');
      const mountId = mountItem ? parseInt(mountItem.getAttribute('data-mount-id')) : null;

      // Force fallback for specific edge case mounts
      if (forceNoIconMounts.includes(mountId)) {
        link.classList.add('no-icon');
        return;
      }

      // Check if Wowhead has added a background-image
      const style = link.getAttribute('style');
      if (style && style.includes('background-image')) {
        // Replace "tiny" with "large" AND ".gif" with ".jpg" in the URL
        let newStyle = style.replace(/\/tiny\//g, '/large/');
        newStyle = newStyle.replace(/\.gif/g, '.jpg');
        link.setAttribute('style', newStyle);

        // Also set background-size to ensure large icons display properly
        link.style.backgroundSize = 'contain';
        link.style.width = '64px';
        link.style.height = '64px';
      } else {
        // No icon from Wowhead - add fallback with red X indicator
        link.classList.add('no-icon');
      }
    });
  }


  setupLazyLoading() {
    const images = document.querySelectorAll('.mount-image.lazy-load');
    const progressBar = document.getElementById('progress-fill');
    const progressCount = document.getElementById('progress-count');
    const progressContainer = document.getElementById('image-loading-progress');

    if (images.length === 0) {
      // No images to load, hide progress bar
      if (progressContainer) {
        progressContainer.style.display = 'none';
      }
      return;
    }

    this.loadedImages = 0;

    // Update progress
    const updateProgress = () => {
      this.loadedImages++;
      const percentage = (this.loadedImages / this.totalImages) * 100;

      if (progressBar) {
        progressBar.style.width = `${percentage}%`;
      }

      if (progressCount) {
        progressCount.textContent = this.loadedImages;
      }

      // Hide progress bar when all images are loaded
      if (this.loadedImages >= this.totalImages && progressContainer) {
        setTimeout(() => {
          progressContainer.style.opacity = '0';
          setTimeout(() => {
            progressContainer.style.display = 'none';
          }, 300);
        }, 500);
      }
    };

    // Use Intersection Observer for lazy loading
    const imageObserver = new IntersectionObserver((entries, observer) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target;
          const src = img.getAttribute('data-src');
          const fallback = img.getAttribute('data-fallback');

          if (src) {
            // Load the image
            const tempImg = new Image();
            tempImg.onload = () => {
              img.src = src;
              img.classList.remove('lazy-load');
              img.classList.add('loaded');
              updateProgress();
            };
            tempImg.onerror = () => {
              // Use fallback question mark only on error
              img.src = fallback;
              img.classList.remove('lazy-load');
              img.classList.add('error');
              updateProgress();
            };
            tempImg.src = src;
          }

          observer.unobserve(img);
        }
      });
    }, {
      rootMargin: '200px' // Start loading 200px before image enters viewport
    });

    // Observe all images
    images.forEach(img => imageObserver.observe(img));
  }

  renderUnauthenticated() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="empty-state">
        <i class="las la-user-lock"></i>
        <h2>Authentication Required</h2>
        <p>Please log in with your Battle.net account to view your mount collection.</p>
        <a href="index.html" class="btn-primary">Go to Home</a>
      </div>
    `;
  }

  renderNoCharacter() {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="empty-state">
        <i class="las la-user-slash"></i>
        <h2>No Characters Found</h2>
        <p>No World of Warcraft characters found on your account.</p>
        <a href="index.html" class="btn-primary">Go to Home</a>
      </div>
    `;
  }

  renderError(error) {
    if (!this.container) return;

    const errorMessage = error.status === 404 || error.status === 403
      ? 'Your mount collection is private or not available. Please check your Battle.net privacy settings.'
      : 'An error occurred while loading your mount collection.';

    this.container.innerHTML = `
      <div class="empty-state error-state">
        <i class="las la-exclamation-triangle"></i>
        <h2>Error Loading Mounts</h2>
        <p>${errorMessage}</p>
        <button class="btn-primary" onclick="window.location.reload()">Try Again</button>
      </div>
    `;
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init();

  // Wait for auth check
  await AuthService.waitForAuthCheck();

  // Initialize mounts page
  const mountsPage = new MountsPage();
  await mountsPage.init();

  // Listen for auth state changes
  window.addEventListener('auth-state-changed', async () => {
    const mountsPage = new MountsPage();
    await mountsPage.init();
  });
});
