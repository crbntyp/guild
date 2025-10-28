/**
 * Background Image Rotator
 * Rotates through background images with fade transitions
 */
class BackgroundRotator {
  constructor(images, interval = 10000, fadeTime = 2000) {
    this.images = images;
    this.interval = interval;
    this.fadeTime = fadeTime;
    this.currentIndex = 0;
    this.layers = null;
    this.intervalId = null;
    this.progressBarElement = null;
    this.startTime = null;
    this.progressAnimationId = null;
  }

  init() {

    // Create two overlay layers for cross-fading
    this.createLayers();

    // Set initial background
    this.setBackground(0, 1);

    // Also set the second image on layer 2 for the first transition
    if (this.images.length > 1) {
      this.setBackground(1, 2);
    }

    // Start rotation
    this.start();

  }

  createLayers() {
    // Create background layer container
    const container = document.createElement('div');
    container.className = 'bg-rotator-container';

    // Create two layers for cross-fade effect
    const layer1 = document.createElement('div');
    layer1.className = 'bg-layer bg-layer-1';

    const layer2 = document.createElement('div');
    layer2.className = 'bg-layer bg-layer-2';

    container.appendChild(layer1);
    container.appendChild(layer2);

    // Insert at the beginning of body
    document.body.insertBefore(container, document.body.firstChild);

    this.layers = {
      layer1,
      layer2
    };
  }

  setBackground(imageIndex, targetLayer) {
    const layer = targetLayer === 1 ? this.layers.layer1 : this.layers.layer2;
    const imageData = this.images[imageIndex];
    // Support both string paths and objects with {path, location}
    const imagePath = typeof imageData === 'string' ? imageData : imageData.path;
    layer.style.backgroundImage = `url('${imagePath}')`;

  }

  rotate() {

    // Determine which layer is currently visible
    const layer1Opacity = parseFloat(getComputedStyle(this.layers.layer1).opacity);
    const currentLayer = layer1Opacity === 1 ? 1 : 2;
    const nextLayer = currentLayer === 1 ? 2 : 1;

    // Move to next image
    this.currentIndex = (this.currentIndex + 1) % this.images.length;

    // Set next image on hidden layer
    this.setBackground(this.currentIndex, nextLayer);

    // Fade out current layer, fade in next layer
    if (currentLayer === 1) {
      this.layers.layer1.style.opacity = '0';
      this.layers.layer2.style.opacity = '1';
    } else {
      this.layers.layer1.style.opacity = '1';
      this.layers.layer2.style.opacity = '0';
    }

    // Reset progress bar
    if (this.progressBarElement) {
      this.progressBarElement.style.width = '0%';
      this.startTime = Date.now();
      if (this.progressAnimationId) {
        cancelAnimationFrame(this.progressAnimationId);
      }
      this.updateProgress();
    }
  }

  goToNext() {
    this.rotate();
    this.resetTimer();
  }

  goToPrevious() {
    // Determine which layer is currently visible
    const layer1Opacity = parseFloat(getComputedStyle(this.layers.layer1).opacity);
    const currentLayer = layer1Opacity === 1 ? 1 : 2;
    const nextLayer = currentLayer === 1 ? 2 : 1;

    // Move to previous image
    this.currentIndex = (this.currentIndex - 1 + this.images.length) % this.images.length;

    // Set previous image on hidden layer
    this.setBackground(this.currentIndex, nextLayer);

    // Fade out current layer, fade in next layer
    if (currentLayer === 1) {
      this.layers.layer1.style.opacity = '0';
      this.layers.layer2.style.opacity = '1';
    } else {
      this.layers.layer1.style.opacity = '1';
      this.layers.layer2.style.opacity = '0';
    }

    // Reset progress bar
    if (this.progressBarElement) {
      this.progressBarElement.style.width = '0%';
      this.startTime = Date.now();
      if (this.progressAnimationId) {
        cancelAnimationFrame(this.progressAnimationId);
      }
      this.updateProgress();
    }

    this.resetTimer();
  }

  resetTimer() {
    // Stop current interval and start a new one
    this.stop();
    this.start();
  }

  setProgressBar(element) {
    this.progressBarElement = element;

    // If timer is already running, start the progress animation
    if (this.intervalId && this.startTime) {
      this.updateProgress();
    }
  }

  updateProgress() {
    if (!this.progressBarElement || !this.startTime) return;

    const elapsed = Date.now() - this.startTime;
    const progress = Math.min((elapsed / this.interval) * 100, 100);

    this.progressBarElement.style.width = `${progress}%`;

    if (progress < 100) {
      this.progressAnimationId = requestAnimationFrame(() => this.updateProgress());
    }
  }

  start() {
    if (this.intervalId) return;

    this.startTime = Date.now();

    this.intervalId = setInterval(() => {
      this.rotate();
    }, this.interval);

    // Start progress animation
    if (this.progressBarElement) {
      this.updateProgress();
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.progressAnimationId) {
      cancelAnimationFrame(this.progressAnimationId);
      this.progressAnimationId = null;
    }
  }

  destroy() {
    this.stop();
    const container = document.querySelector('.bg-rotator-container');
    if (container) {
      container.remove();
    }
  }
}

export default BackgroundRotator;
