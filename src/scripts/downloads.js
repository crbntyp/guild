// Downloads Page
import BackgroundRotator from './components/background-rotator.js';
import TopBar from './components/top-bar.js';
import Footer from './components/footer.js';
import backgrounds from './data/backgrounds.js';

console.log('⚡ Downloads Page initialized');

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize top bar
  const topBar = new TopBar();
  await topBar.init();

  // Initialize footer
  const footer = new Footer();
  footer.init();

  // Initialize background rotator
  const bgRotator = new BackgroundRotator(backgrounds, 8000, 2000);
  bgRotator.init();

  console.log('✅ Downloads loaded');
});
