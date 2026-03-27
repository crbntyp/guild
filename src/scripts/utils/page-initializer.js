/**
 * PageInitializer
 * Handles common page initialization logic (TopBar, Footer, BackgroundRotator)
 */

import TopBar from '../components/top-bar.js';
import Footer from '../components/footer.js';
import BackgroundRotator from '../components/background-rotator.js';
import FireEffect from '../components/fire-effect.js';
import authService from '../services/auth.js';
import backgrounds from '../data/backgrounds.js';
import wowApi from '../api/wow-api.js';

class PageInitializer {
  /**
   * Initialize a page with common components
   *
   * @param {Object} options - Configuration options
   * @param {boolean} options.requireAuth - Require authentication (redirect if not authenticated)
   * @param {string} options.redirectUrl - URL to redirect to if not authenticated (default: 'index.html')
   * @param {Array} options.backgrounds - Background images array (default: from backgrounds.js)
   * @param {number} options.backgroundInterval - Background rotation interval in ms (default: 8000)
   * @param {number} options.backgroundFadeTime - Background fade time in ms (default: 2000)
   * @param {Function} options.backgroundRotatorClass - Custom BackgroundRotator class (default: BackgroundRotator)
   * @param {Function} options.onInit - Callback function to run after common initialization
   * @returns {Promise<Object>} - Object containing initialized components
   */
  static async init(options = {}) {
    const {
      requireAuth = false,
      redirectUrl = 'index.html',
      backgrounds: bgImages = backgrounds,
      backgroundInterval = 8000,
      backgroundFadeTime = 2000,
      backgroundRotatorClass = BackgroundRotator,
      onInit = null
    } = options;

    // Initialize token ticker bar
    PageInitializer.initTickerBar();

    // Initialize top bar (login)
    const topBar = new TopBar();
    await topBar.init();

    // Initialize footer
    const footer = new Footer();
    footer.init();

    // Initialize background rotator
    const bgRotator = new backgroundRotatorClass(bgImages, backgroundInterval, backgroundFadeTime);
    bgRotator.init();

    // Initialize fire effect
    FireEffect.init();

    // Check authentication if required
    if (requireAuth && !authService.isAuthenticated()) {
      window.location.href = redirectUrl;
      return { topBar, footer, bgRotator, authService };
    }

    // Run page-specific initialization callback
    if (onInit) {
      await onInit({ topBar, footer, bgRotator, authService });
    }

    return { topBar, footer, bgRotator, authService };
  }

  static initTickerBar() {
    const ticker = document.createElement('div');
    ticker.className = 'ticker-widget';
    ticker.innerHTML = `
      <div id="ticker-realm" class="ticker-realm"></div>
      <div id="ticker-token" class="ticker-token"></div>
    `;
    document.body.appendChild(ticker);

    // Fetch token price
    wowApi.getWoWTokenPrice().then(tokenData => {
      const gold = (tokenData.price / 10000).toLocaleString('en-US', {
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      });
      document.getElementById('ticker-token').textContent = `WoW Token: ${gold}g`;
    }).catch(() => {});

    // Rotate realm statuses
    const realmIds = [1084, 3391, 1303, 1329, 1305, 3682]; // Tarren Mill, Silvermoon, Frostmane, Ravencrest, Kazzak, Ragnaros
    let realmData = [];
    let realmIndex = 0;

    // Fetch all realm statuses
    import('../api/battlenet-client.js').then(module => {
      const client = module.default;
      Promise.all(realmIds.map(id =>
        client.request(`/data/wow/connected-realm/${id}`, {
          params: { namespace: 'dynamic-eu' }
        }).then(d => {
          // Find the primary realm name (match against known names)
          const knownNames = ['Tarren Mill', 'Silvermoon', 'Frostmane', 'Ravencrest', 'Kazzak', 'Ragnaros'];
          const allNames = (d.realms || []).map(r => r.name);
          const name = allNames.find(n => knownNames.includes(n)) || allNames[0] || '?';
          return { name, status: d.status?.type || '?', population: d.population?.type || '?' };
        }).catch(() => null)
      )).then(results => {
        realmData = results.filter(r => r);
        if (realmData.length > 0) {
          PageInitializer.showNextRealm(realmData, 0);
        }
      });
    });
  }

  static showNextRealm(realmData, index) {
    const el = document.getElementById('ticker-realm');
    if (!el || realmData.length === 0) return;

    const realm = realmData[index % realmData.length];
    const statusDot = realm.status === 'UP' ? '●' : '○';
    const statusColor = realm.status === 'UP' ? '#10b981' : '#ef4444';

    el.style.opacity = '0';
    setTimeout(() => {
      el.innerHTML = `<span style="color: ${statusColor}">${statusDot}</span> ${realm.name}`;
      el.style.opacity = '1';
    }, 300);

    setTimeout(() => {
      PageInitializer.showNextRealm(realmData, index + 1);
    }, 5000);
  }
}

export default PageInitializer;
