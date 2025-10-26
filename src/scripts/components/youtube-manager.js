import FormModal from './form-modal.js';
import ItemManager from './item-manager.js';
import PageHeader from './page-header.js';
import videoModal from './video-modal.js';

/**
 * YouTube Manager - Manages YouTube channels with localStorage persistence
 */
class YouTubeManager extends ItemManager {
  constructor(containerId, authService) {
    super({
      containerId,
      authService,
      storagePrefix: 'guild_youtube_channels',
      apiEndpoint: '/api/user/youtube',
      baseApiUrl: 'https://guild-production.up.railway.app'
    });

    // YouTube-specific properties
    this.apiUrl = 'https://guild-production.up.railway.app/api/fetch-youtube';

    // Initialize FormModal
    this.formModal = new FormModal({
      id: 'channel-form-modal',
      title: 'Add YouTube Channel',
      editTitle: 'Edit YouTube Channel',
      fields: [
        {
          name: 'url',
          type: 'url',
          label: 'YouTube Channel URL *',
          placeholder: 'e.g. https://www.youtube.com/@Hazelnutty',
          required: true
        },
        {
          name: 'tags',
          type: 'text',
          label: 'Search Tags (optional)',
          placeholder: 'e.g. warcraft, guides, tips (comma-separated)',
          helperText: 'Leave empty to fetch all latest videos, or add tags to filter specific content'
        }
      ],
      onSubmit: (data, isEdit, editData) => this.handleFormSubmit(data, isEdit, editData)
    });
  }

  /**
   * Initialize the YouTube manager
   */
  async init() {
    // Call parent init to load items
    await super.init();

    // Initialize video modal
    videoModal.init();

    // Clean up old videos (older than 30 days)
    this.cleanupOldVideos();

    // Render the UI
    this.render();
  }

  /**
   * Clean up videos older than 30 days
   */
  cleanupOldVideos() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let cleaned = false;

    this.items.forEach(channel => {
      if (channel.videos) {
        const originalLength = channel.videos.length;
        channel.videos = channel.videos.filter(video => {
          return new Date(video.addedAt).getTime() > thirtyDaysAgo;
        });
        if (channel.videos.length !== originalLength) {
          cleaned = true;
        }
      }
    });

    if (cleaned) {
      this.saveItems();
    }
  }

  /**
   * Add a new channel (override parent to include channel-specific fields)
   */
  async addChannel(channelData) {
    const channel = await this.addItem({
      name: channelData.name,
      url: channelData.url,
      tags: channelData.tags,
      videos: []
    });

    // Fetch videos for this channel
    await this.fetchChannelVideos(channel.id);

    this.renderChannels();
  }

  /**
   * Fetch videos for a channel
   */
  async fetchChannelVideos(channelId) {
    const channel = this.getItemById(channelId);
    if (!channel) return;

    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          channelUrl: channel.url,
          tags: channel.tags
        })
      });

      if (!response.ok) {
        throw new Error('Failed to fetch videos');
      }

      const videos = await response.json();

      // Add videos to channel with timestamp
      channel.videos = videos.map(video => ({
        ...video,
        addedAt: new Date().toISOString()
      }));

      await this.saveItems();
      this.renderChannels();
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }

  /**
   * Update an existing channel (override parent to include channel-specific fields)
   */
  async updateChannel(id, channelData) {
    const oldChannel = this.getItemById(id);
    if (!oldChannel) return;

    const oldTags = oldChannel.tags;

    await this.updateItem(id, {
      name: channelData.name,
      url: channelData.url,
      tags: channelData.tags
    });

    // Render immediately to show updated channel info
    this.renderChannels();

    // Re-fetch videos in background if tags changed
    if (oldTags !== channelData.tags) {
      await this.fetchChannelVideos(id);
    }
  }

  /**
   * Edit a channel
   */
  editChannel(id) {
    const channel = this.getItemById(id);
    if (channel) {
      this.editingItemId = id;
      this.openModal(channel);
    }
  }

  /**
   * Delete a channel (override parent to trigger re-render)
   */
  async deleteChannel(id) {
    await this.deleteItem(id);
    this.renderChannels();
  }

  /**
   * Render the main UI
   */
  render() {
    this.container.innerHTML = `
      ${PageHeader.render({
        className: 'youtube',
        title: 'My YouTube',
        description: 'Curate and organize your favorite Warcraft YouTube videos, guides, and content creators all in one place.',
        actionButton: {
          id: 'btn-add-channel',
          icon: 'la-plus',
          text: 'Add Channel'
        }
      })}

      <div class="youtube-channels" id="youtube-channels"></div>

      ${this.formModal.render()}
    `;

    // Attach FormModal listeners
    this.formModal.attachListeners();

    // Attach event listeners
    document.getElementById('btn-add-channel').addEventListener('click', () => this.openModal());

    // Render the channels
    this.renderChannels();
  }

  /**
   * Render the channels
   */
  renderChannels() {
    const channelsContainer = document.getElementById('youtube-channels');
    if (!channelsContainer) return;

    if (this.items.length === 0) {
      channelsContainer.innerHTML = `
        <div class="empty-state">
          <i class="lab la-youtube"></i>
          <p>No channels yet. Click "Add Channel" to get started!</p>
        </div>
      `;
      return;
    }

    channelsContainer.innerHTML = this.items.map(channel => `
      <div class="channel-row" data-id="${channel.id}">
        <div class="channel-content">
          <div class="channel-info-col">
            <h3 class="channel-name">${this.escapeHtml(channel.name)}</h3>
            <div class="channel-tags">
              ${channel.tags ? channel.tags.split(',').map(tag => `<span class="tag">${this.escapeHtml(tag.trim())}</span>`).join('') : '<span class="tag">All Videos</span>'}
            </div>
            <div class="channel-actions">
              <button class="channel-edit" data-id="${channel.id}" title="Edit channel">
                <i class="las la-pen"></i>
              </button>
              <button class="channel-refresh" data-id="${channel.id}" title="Refresh videos">
                <i class="las la-sync"></i>
              </button>
              <button class="channel-delete" data-id="${channel.id}" title="Delete channel">
                <i class="las la-trash"></i>
              </button>
            </div>
          </div>
          <div class="channel-videos">
            ${channel.videos && channel.videos.length > 0 ? channel.videos.map(video => `
              <div class="video-card" data-video-url="${video.url}" data-video-title="${this.escapeHtml(video.title)}">
                <div class="video-thumbnail">
                  <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}">
                </div>
                <div class="video-info">
                  <div class="video-title">${this.escapeHtml(video.title)}</div>
                  <div class="video-date">${this.formatDate(video.publishedAt)}</div>
                </div>
              </div>
            `).join('') : '<div class="no-videos">No videos found for this channel</div>'}
          </div>
        </div>
      </div>
    `).join('');

    // Attach edit handlers
    channelsContainer.querySelectorAll('.channel-edit').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        this.editChannel(id);
      });
    });

    // Attach refresh handlers
    channelsContainer.querySelectorAll('.channel-refresh').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        // Add spinning animation
        const icon = btn.querySelector('i');
        icon.classList.add('spinning');
        await this.fetchChannelVideos(id);
        icon.classList.remove('spinning');
      });
    });

    // Attach delete handlers
    channelsContainer.querySelectorAll('.channel-delete').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const id = parseInt(btn.dataset.id);
        if (confirm('Are you sure you want to delete this channel?')) {
          this.deleteChannel(id);
        }
      });
    });

    // Attach video card click handlers
    channelsContainer.querySelectorAll('.video-card').forEach(card => {
      card.addEventListener('click', () => {
        const videoUrl = card.dataset.videoUrl;
        const videoTitle = card.dataset.videoTitle;
        videoModal.open(videoUrl, videoTitle);
      });
    });
  }

  /**
   * Open modal
   */
  openModal(channel = null) {
    if (channel) {
      // Store editing ID and open with data
      this.editingItemId = channel.id;
      this.formModal.open(channel);
    } else {
      // Add mode
      this.editingItemId = null;
      this.formModal.open();
    }
  }

  /**
   * Close modal (handled by FormModal, but keep for backwards compatibility)
   */
  closeModal() {
    this.formModal.close();
    this.editingItemId = null;
  }

  /**
   * Extract channel name from URL
   */
  extractChannelName(url) {
    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;

      // Handle different YouTube URL formats
      if (pathname.includes('/@')) {
        return pathname.split('/@')[1].split('/')[0];
      } else if (pathname.includes('/c/')) {
        return pathname.split('/c/')[1].split('/')[0];
      } else if (pathname.includes('/channel/')) {
        return pathname.split('/channel/')[1].split('/')[0];
      } else if (pathname.includes('/user/')) {
        return pathname.split('/user/')[1].split('/')[0];
      }

      return 'Unknown Channel';
    } catch (error) {
      return 'Unknown Channel';
    }
  }

  /**
   * Handle form submit from FormModal
   */
  async handleFormSubmit(formData, isEdit, editData) {
    const url = formData.url;
    const tags = formData.tags;

    // Extract channel name from URL
    const name = this.extractChannelName(url);

    const channelData = {
      name,
      url,
      tags: tags || '' // Allow empty tags
    };

    if (this.editingItemId) {
      // Update existing channel
      await this.updateChannel(this.editingItemId, channelData);
      this.editingItemId = null;
    } else {
      // Add new channel
      await this.addChannel(channelData);
    }
  }
}

export default YouTubeManager;
