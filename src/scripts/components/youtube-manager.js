/**
 * YouTube Manager - Manages YouTube channels with localStorage persistence
 */
class YouTubeManager {
  constructor(containerId) {
    this.containerId = containerId;
    this.container = null;
    this.channels = [];
    this.storageKey = 'guild_youtube_channels';
    this.editingChannelId = null;
    // Use environment-based API URL for YouTube data fetching
    this.apiUrl = window.location.hostname === 'localhost'
      ? 'http://localhost:3001/api/fetch-youtube'
      : 'https://guild-production.up.railway.app/api/fetch-youtube';
  }

  /**
   * Initialize the YouTube manager
   */
  init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`YouTubeManager: Container #${this.containerId} not found`);
      return;
    }

    // Load channels from localStorage
    this.loadChannels();

    // Clean up old videos (older than 30 days)
    this.cleanupOldVideos();

    // Render the UI
    this.render();
  }

  /**
   * Load channels from localStorage
   */
  loadChannels() {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.channels = JSON.parse(stored);
        console.log('✅ Loaded', this.channels.length, 'channels from localStorage');
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      this.channels = [];
    }
  }

  /**
   * Save channels to localStorage
   */
  saveChannels() {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.channels));
      console.log('💾 Saved', this.channels.length, 'channels to localStorage');
    } catch (error) {
      console.error('Error saving channels:', error);
    }
  }

  /**
   * Clean up videos older than 30 days
   */
  cleanupOldVideos() {
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    let cleaned = false;

    this.channels.forEach(channel => {
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
      this.saveChannels();
      console.log('🧹 Cleaned up old videos');
    }
  }

  /**
   * Add a new channel
   */
  async addChannel(channelData) {
    const channel = {
      id: Date.now(),
      name: channelData.name,
      url: channelData.url,
      tags: channelData.tags,
      videos: [],
      createdAt: new Date().toISOString()
    };

    this.channels.unshift(channel);
    this.saveChannels();

    // Fetch videos for this channel
    await this.fetchChannelVideos(channel.id);

    this.renderChannels();
  }

  /**
   * Fetch videos for a channel
   */
  async fetchChannelVideos(channelId) {
    const channel = this.channels.find(c => c.id === channelId);
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

      this.saveChannels();
      this.renderChannels();
    } catch (error) {
      console.error('Error fetching videos:', error);
    }
  }

  /**
   * Update an existing channel
   */
  async updateChannel(id, channelData) {
    const index = this.channels.findIndex(channel => channel.id === id);
    if (index !== -1) {
      const oldTags = this.channels[index].tags;

      this.channels[index] = {
        ...this.channels[index],
        name: channelData.name,
        url: channelData.url,
        tags: channelData.tags
      };

      this.saveChannels();

      // Render immediately to show updated channel info
      this.renderChannels();

      // Re-fetch videos in background if tags changed
      if (oldTags !== channelData.tags) {
        await this.fetchChannelVideos(id);
      }
    }
  }

  /**
   * Edit a channel
   */
  editChannel(id) {
    const channel = this.channels.find(channel => channel.id === id);
    if (channel) {
      this.editingChannelId = id;
      this.openModal(channel);
    }
  }

  /**
   * Delete a channel
   */
  deleteChannel(id) {
    this.channels = this.channels.filter(channel => channel.id !== id);
    this.saveChannels();
    this.renderChannels();
  }

  /**
   * Render the main UI
   */
  render() {
    this.container.innerHTML = `
      <div class="youtube-header">
        <div class="youtube-header-info">
          <h1>My YouTube</h1>
          <span class="info-description">Curate and organize your favorite Warcraft YouTube videos, guides, and content creators all in one place.</span>
          <button class="btn-add-channel" id="btn-add-channel">
            <i class="las la-plus"></i>
            <span>Add Channel</span>
          </button>
        </div>
      </div>

      <div class="youtube-channels" id="youtube-channels"></div>

      <!-- Channel Form Modal -->
      <div class="channel-form-modal" id="channel-form-modal">
        <div class="channel-form-content">
          <h2>Add YouTube Channel</h2>
          <form id="channel-form">
            <div class="form-group">
              <label for="channel-url">YouTube Channel URL *</label>
              <input type="url" id="channel-url" placeholder="e.g. https://www.youtube.com/@Hazelnutty" required>
            </div>

            <div class="form-group">
              <label for="channel-tags">Search Tags (optional)</label>
              <input type="text" id="channel-tags" placeholder="e.g. warcraft, guides, tips (comma-separated)">
              <small>Leave empty to fetch all latest videos, or add tags to filter specific content</small>
            </div>

            <div class="form-actions">
              <button type="button" class="btn-cancel" id="btn-cancel">Cancel</button>
              <button type="submit" class="btn-save">Save</button>
            </div>
          </form>
        </div>
      </div>
    `;

    // Attach event listeners
    document.getElementById('btn-add-channel').addEventListener('click', () => this.openModal());
    document.getElementById('btn-cancel').addEventListener('click', () => this.closeModal());
    document.getElementById('channel-form').addEventListener('submit', (e) => this.handleSubmit(e));

    // Render the channels
    this.renderChannels();
  }

  /**
   * Render the channels
   */
  renderChannels() {
    const channelsContainer = document.getElementById('youtube-channels');
    if (!channelsContainer) return;

    if (this.channels.length === 0) {
      channelsContainer.innerHTML = `
        <div class="empty-state">
          <i class="lab la-youtube"></i>
          <p>No channels yet. Click "Add Channel" to get started!</p>
        </div>
      `;
      return;
    }

    channelsContainer.innerHTML = this.channels.map(channel => `
      <div class="channel-row" data-id="${channel.id}">
        <div class="channel-actions">
          <button class="channel-edit" data-id="${channel.id}" title="Edit channel">
            <i class="las la-pen"></i>
          </button>
          <button class="channel-delete" data-id="${channel.id}" title="Delete channel">
            <i class="las la-trash"></i>
          </button>
        </div>
        <div class="channel-content">
          <div class="channel-info-col">
            <h3 class="channel-name">${this.escapeHtml(channel.name)}</h3>
            <div class="channel-tags">
              ${channel.tags ? channel.tags.split(',').map(tag => `<span class="tag">${this.escapeHtml(tag.trim())}</span>`).join('') : '<span class="tag">All Videos</span>'}
            </div>
          </div>
          <div class="channel-videos">
            ${channel.videos && channel.videos.length > 0 ? channel.videos.map(video => `
              <a href="${video.url}" target="_blank" rel="noopener" class="video-card">
                <div class="video-thumbnail">
                  <img src="${video.thumbnail}" alt="${this.escapeHtml(video.title)}">
                </div>
                <div class="video-info">
                  <div class="video-title">${this.escapeHtml(video.title)}</div>
                  <div class="video-date">${this.formatDate(video.publishedAt)}</div>
                </div>
              </a>
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
  }

  /**
   * Open modal
   */
  openModal(channel = null) {
    const modal = document.getElementById('channel-form-modal');
    const modalTitle = modal.querySelector('h2');

    if (channel) {
      // Editing mode
      modalTitle.textContent = 'Edit YouTube Channel';
      document.getElementById('channel-url').value = channel.url || '';
      document.getElementById('channel-tags').value = channel.tags || '';
    } else {
      // Add mode
      modalTitle.textContent = 'Add YouTube Channel';
    }

    modal.classList.add('active');
    document.getElementById('channel-url').focus();
  }

  /**
   * Close modal
   */
  closeModal() {
    const modal = document.getElementById('channel-form-modal');
    modal.classList.remove('active');
    document.getElementById('channel-form').reset();
    this.editingChannelId = null;
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
   * Handle form submit
   */
  async handleSubmit(e) {
    e.preventDefault();

    const urlInput = document.getElementById('channel-url');
    const tagsInput = document.getElementById('channel-tags');

    const url = urlInput.value.trim();
    const tags = tagsInput.value.trim();

    if (!url) {
      alert('Please enter a channel URL');
      return;
    }

    // Extract channel name from URL
    const name = this.extractChannelName(url);

    const channelData = {
      name,
      url,
      tags: tags || '' // Allow empty tags
    };

    if (this.editingChannelId) {
      // Update existing channel
      await this.updateChannel(this.editingChannelId, channelData);
    } else {
      // Add new channel
      await this.addChannel(channelData);
    }

    this.closeModal();
  }

  /**
   * Format date
   */
  formatDate(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Escape HTML
   */
  escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }
}

export default YouTubeManager;
