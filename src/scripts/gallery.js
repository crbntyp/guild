// Gallery page - displays background images with location names
import BackgroundRotator from './components/background-rotator.js';
import PageInitializer from './utils/page-initializer.js';
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
        raceName = 'Death Knight starting area';
      } else if (location === 'Mardum') {
        raceName = 'Demon Hunter starting area';
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
  await PageInitializer.init({
    backgroundRotatorClass: GalleryBackgroundRotator
  });
});
