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
}

export default PageInitializer;
