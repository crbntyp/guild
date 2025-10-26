/**
 * YouTube Manager - Manages YouTube channels with localStorage persistence
 */
class YouTubeManager {
  constructor(containerId, authService) {
    this.containerId = containerId;
    this.container = null;
    this.channels = [];
    this.authService = authService;
    this.storageKey = this.getStorageKey();
    this.editingChannelId = null;
    // Always use production Railway backend for sync
    this.apiUrl = 'https://guild-production.up.railway.app/api/fetch-youtube';
  }

  /**
   * Get user-specific storage key based on Battle.net account
   */
  getStorageKey() {
    const user = this.authService?.getUser();
    const battletag = user?.battletag;

    if (battletag) {
      return `guild_youtube_channels_${battletag.replace('#', '_')}`;
    }

    // Fallback to generic key if not logged in
    return 'guild_youtube_channels';
  }

  /**
   * Initialize the YouTube manager
   */
  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`YouTubeManager: Container #${this.containerId} not found`);
      return;
    }

    // Update storage key in case user logged in after construction
    this.storageKey = this.getStorageKey();

    // Load channels from backend (with localStorage fallback)
    await this.loadChannels();

    // Clean up old videos (older than 30 days)
    this.cleanupOldVideos();

    // Render the UI
    this.render();
  }

  /**
   * Load channels from backend (with localStorage fallback)
   */
  async loadChannels() {
    try {
      // Try backend first if user is authenticated
      if (this.authService?.isAuthenticated()) {
        const backendData = await this.loadFromBackend();

        // Only use backend data if it's not null AND (has data OR localStorage is empty)
        if (backendData !== null) {
          const stored = localStorage.getItem(this.storageKey);
          const localData = stored ? JSON.parse(stored) : [];

          // If backend has data, use it
          if (backendData.length > 0) {
            this.channels = backendData;
            localStorage.setItem(this.storageKey, JSON.stringify(this.channels));
            console.log('✅ Loaded', this.channels.length, 'channels from backend');
            return;
          }

          // If backend is empty but localStorage has data, keep localStorage and sync to backend
          if (backendData.length === 0 && localData.length > 0) {
            this.channels = localData;
            console.log('⚠️ Backend empty, using', this.channels.length, 'channels from localStorage');
            // Sync localStorage to backend
            this.saveToBackend();
            return;
          }

          // Both empty, use backend empty array
          this.channels = backendData;
          console.log('✅ Loaded', this.channels.length, 'channels from backend (empty)');
          return;
        }
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.channels = JSON.parse(stored);
        console.log('✅ Loaded', this.channels.length, 'channels from localStorage');
      }
    } catch (error) {
      console.error('❌ Error loading channels:', error);
      this.channels = [];
    }
  }

  /**
   * Load channels from backend
   */
  async loadFromBackend() {
    try {
      const token = this.authService?.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${this.apiUrl.replace('/api/fetch-youtube', '/api/user/youtube')}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        console.warn('Failed to load YouTube channels from backend:', response.status);
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading from backend:', error);
      return null;
    }
  }

  /**
   * Save channels to both localStorage and backend
   */
  async saveChannels() {
    try {
      // Save to localStorage (instant)
      localStorage.setItem(this.storageKey, JSON.stringify(this.channels));
      console.log('💾 Saved', this.channels.length, 'channels to localStorage');

      // Save to backend (async) if authenticated
      if (this.authService?.isAuthenticated()) {
        this.saveToBackend().catch(err => {
          console.error('Failed to sync YouTube channels to backend:', err);
        });
      }
    } catch (error) {
      console.error('Error saving channels:', error);
    }
  }

  /**
   * Save channels to backend
   */
  async saveToBackend() {
    try {
      const token = this.authService?.getAccessToken();
      if (!token) return;

      const response = await fetch(`${this.apiUrl.replace('/api/fetch-youtube', '/api/user/youtube')}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.channels)
      });

      if (response.ok) {
        console.log('☁️ Synced YouTube channels to backend');
      } else {
        console.warn('Failed to sync YouTube channels to backend:', response.status);
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
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
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  }

  /**
   * Clean text - remove HTML tags but preserve HTML entities like &#39;
   */
  escapeHtml(text) {
    if (!text) return '';
    // Just strip HTML tags, let browser decode entities naturally
    return String(text).replace(/<[^>]*>/g, '');
  }
}

export default YouTubeManager;
