// Gallery page - displays background images with location names
import BackgroundRotator from './components/background-rotator.js';
import TopBar from './components/top-bar.js';
import Footer from './components/footer.js';
import backgrounds from './data/backgrounds.js';
import { getRaceName } from './utils/wow-constants.js';

console.log('⚡ Gallery initialized');

// Custom BackgroundRotator that updates location display
class GalleryBackgroundRotator extends BackgroundRotator {
  constructor(images, interval, fadeTime) {
    super(images, interval, fadeTime);
  }

  rotate() {
    // Call parent rotate
    super.rotate();

    // Update location display
    this.updateLocationDisplay();
  }

  init() {
    // Call parent init
    super.init();

    // Set initial location
    this.updateLocationDisplay();
  }

  updateLocationDisplay() {
    const locationDisplay = document.getElementById('location-display');
    if (locationDisplay) {
      const currentBackground = this.images[this.currentIndex];
      const location = typeof currentBackground === 'string' ? 'Unknown' : currentBackground.location;
      const raceId = currentBackground.raceId;
      let raceName = raceId ? getRaceName(raceId) : '';

      // Override race name for specific hero class locations
      if (location === 'Acherus') {
        raceName = 'Death Knight';
      } else if (location === 'Mardum') {
        raceName = 'Demon Hunter';
      }

      locationDisplay.innerHTML = `
        <div class="location-name">
          ${location}, ${raceName ? raceName : ''}
          <button class="download-btn" id="download-bg-btn" title="Download this background">
            <i class="las la-download"></i>
          </button>
        </div>
      `;

      // Attach download handler
      const downloadBtn = document.getElementById('download-bg-btn');
      if (downloadBtn) {
        downloadBtn.addEventListener('click', () => this.downloadCurrentBackground());
      }
    }
  }

  downloadCurrentBackground() {
    const currentBackground = this.images[this.currentIndex];
    const imagePath = typeof currentBackground === 'string' ? currentBackground : currentBackground.path;
    const location = typeof currentBackground === 'string' ? 'background' : currentBackground.location;

    // Create a temporary link and trigger download
    const link = document.createElement('a');
    link.href = imagePath;
    link.download = `${location.toLowerCase().replace(/[^a-z0-9]/g, '-')}-wallpaper.jpg`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize top bar
  const topBar = new TopBar();
  await topBar.init();

  // Initialize footer
  const footer = new Footer();
  footer.init();

  // Initialize gallery background rotator
  const bgRotator = new GalleryBackgroundRotator(backgrounds, 8000, 2000);
  bgRotator.init();

});
