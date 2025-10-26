/**
 * Video Modal Component
 * Displays YouTube videos in a modal popup
 */

class VideoModal {
  constructor() {
    this.modal = null;
  }

  /**
   * Initialize the modal
   */
  init() {
    this.createModalHTML();
    this.attachEventListeners();
  }

  /**
   * Create modal HTML structure
   */
  createModalHTML() {
    const modalHTML = `
      <div class="video-modal" id="video-modal">
        <div class="video-modal-overlay"></div>
        <div class="video-modal-content">
          <button class="video-modal-close">
            <i class="las la-times"></i>
          </button>
          <div class="video-modal-body">
            <div class="video-container">
              <iframe
                id="video-iframe"
                width="100%"
                height="100%"
                frameborder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowfullscreen
              ></iframe>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add to body if not exists
    if (!document.getElementById('video-modal')) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('video-modal');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close on X button
    const closeBtn = this.modal.querySelector('.video-modal-close');
    closeBtn.addEventListener('click', () => this.close());

    // Close on overlay click
    const overlay = this.modal.querySelector('.video-modal-overlay');
    overlay.addEventListener('click', () => this.close());

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }

  /**
   * Extract YouTube video ID from URL
   */
  extractVideoId(url) {
    // Handle different YouTube URL formats
    const patterns = [
      /youtu\.be\/([^?]+)/,
      /youtube\.com\/watch\?v=([^&]+)/,
      /youtube\.com\/embed\/([^?]+)/,
      /youtube\.com\/v\/([^?]+)/
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Open modal with video URL
   */
  open(videoUrl, videoTitle = '') {
    const videoId = this.extractVideoId(videoUrl);

    if (!videoId) {
      console.error('Invalid YouTube URL:', videoUrl);
      return;
    }

    // Create embed URL
    const embedUrl = `https://www.youtube.com/embed/${videoId}?autoplay=1`;

    // Set iframe src
    const iframe = this.modal.querySelector('#video-iframe');
    iframe.src = embedUrl;

    // Show modal
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * Close modal
   */
  close() {
    // Stop video by clearing iframe src
    const iframe = this.modal.querySelector('#video-iframe');
    iframe.src = '';

    // Hide modal
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
  }
}

export default new VideoModal();
