/**
 * ImagePreviewModal Component
 * Full-screen lightbox modal for viewing character renders
 * Singleton pattern - one modal instance shared across the app
 */

class ImagePreviewModal {
  constructor() {
    this.modal = null;
    this.isOpen = false;
    this.boundHandleKeydown = this.handleKeydown.bind(this);
  }

  /**
   * Initialize the modal - creates DOM element if not exists
   */
  init() {
    if (this.modal) return;

    this.modal = document.createElement('div');
    this.modal.className = 'image-preview-modal';
    this.modal.innerHTML = `
      <div class="image-preview-backdrop"></div>
      <div class="image-preview-content">
        <button class="image-preview-close" aria-label="Close preview">
          <i class="las la-times"></i>
        </button>
        <img class="image-preview-img" src="" alt="Character render" />
      </div>
    `;

    document.body.appendChild(this.modal);

    // Close handlers
    this.modal.querySelector('.image-preview-backdrop').addEventListener('click', () => this.close());
    this.modal.querySelector('.image-preview-close').addEventListener('click', () => this.close());
  }

  /**
   * Open the modal with an image URL
   * @param {string} imageUrl - URL of the image to display
   * @param {string} altText - Alt text for the image
   */
  open(imageUrl, altText = 'Character render') {
    if (!this.modal) this.init();
    if (!imageUrl) return;

    const img = this.modal.querySelector('.image-preview-img');
    img.src = imageUrl;
    img.alt = altText;

    // Show modal
    this.modal.classList.add('active');
    this.isOpen = true;

    // Prevent body scroll
    document.body.style.overflow = 'hidden';

    // Listen for escape key
    document.addEventListener('keydown', this.boundHandleKeydown);
  }

  /**
   * Close the modal
   */
  close() {
    if (!this.modal || !this.isOpen) return;

    this.modal.classList.remove('active');
    this.isOpen = false;

    // Restore body scroll
    document.body.style.overflow = '';

    // Remove escape key listener
    document.removeEventListener('keydown', this.boundHandleKeydown);

    // Clear image after animation
    setTimeout(() => {
      const img = this.modal.querySelector('.image-preview-img');
      img.src = '';
    }, 300);
  }

  /**
   * Handle keydown events
   * @param {KeyboardEvent} event
   */
  handleKeydown(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}

// Create singleton instance
const imagePreviewModal = new ImagePreviewModal();

export default imagePreviewModal;
