/**
 * ItemManager - Base class for managing collections with localStorage and backend persistence
 * Provides common functionality for TodoManager, YouTubeManager, and future managers
 */
class ItemManager {
  constructor(config) {
    this.containerId = config.containerId;
    this.container = null;
    this.items = [];
    this.authService = config.authService;
    this.storagePrefix = config.storagePrefix; // e.g., 'guild_todos' or 'guild_youtube_channels'
    this.apiEndpoint = config.apiEndpoint; // e.g., '/api/user/todos' or '/api/user/youtube'
    this.baseApiUrl = config.baseApiUrl || 'https://guild-production.up.railway.app';
    this.storageKey = this.getStorageKey();
    this.editingItemId = null;
  }

  /**
   * Get user-specific storage key based on Battle.net account
   */
  getStorageKey() {
    const user = this.authService?.getUser();
    const battletag = user?.battletag;

    if (battletag) {
      return `${this.storagePrefix}_${battletag.replace('#', '_')}`;
    }

    // Fallback to generic key if not logged in
    return this.storagePrefix;
  }

  /**
   * Initialize the manager (should be called by child classes)
   */
  async init() {
    this.container = document.getElementById(this.containerId);
    if (!this.container) {
      console.error(`ItemManager: Container #${this.containerId} not found`);
      return;
    }

    // Update storage key in case user logged in after construction
    this.storageKey = this.getStorageKey();

    // Load items from backend (with localStorage fallback)
    await this.loadItems();

    // Child class should call render() after this
  }

  /**
   * Load items from backend (with localStorage fallback)
   */
  async loadItems() {
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
            this.items = backendData;
            localStorage.setItem(this.storageKey, JSON.stringify(this.items));
            return;
          }

          // If backend is empty but localStorage has data, keep localStorage and sync to backend
          if (backendData.length === 0 && localData.length > 0) {
            this.items = localData;
            // Sync localStorage to backend
            this.saveToBackend();
            return;
          }

          // Both empty, use backend empty array
          this.items = backendData;
          return;
        }
      }

      // Fallback to localStorage
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        this.items = JSON.parse(stored);
      }
    } catch (error) {
      console.error('❌ Error loading items:', error);
      this.items = [];
    }
  }

  /**
   * Load items from backend
   */
  async loadFromBackend() {
    try {
      const token = this.authService?.getAccessToken();
      if (!token) return null;

      const response = await fetch(`${this.baseApiUrl}${this.apiEndpoint}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Error loading from backend:', error);
      return null;
    }
  }

  /**
   * Save items to both localStorage and backend
   */
  async saveItems() {
    try {
      // Save to localStorage (instant)
      localStorage.setItem(this.storageKey, JSON.stringify(this.items));

      // Save to backend (async) if authenticated
      if (this.authService?.isAuthenticated()) {
        this.saveToBackend().catch(err => {
          console.error('❌ Failed to sync items to backend:', err);
        });
      }
    } catch (error) {
      console.error('❌ Error saving items:', error);
    }
  }

  /**
   * Save items to backend
   */
  async saveToBackend() {
    try {
      const token = this.authService?.getAccessToken();
      if (!token) return;

      const response = await fetch(`${this.baseApiUrl}${this.apiEndpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(this.items)
      });

      if (!response.ok) {
        console.error('Failed to save to backend');
      }
    } catch (error) {
      console.error('Error saving to backend:', error);
    }
  }

  /**
   * Add a new item (child classes should override to customize)
   */
  async addItem(itemData) {
    const item = {
      id: Date.now(),
      ...itemData,
      createdAt: new Date().toISOString()
    };

    this.items.unshift(item); // Add to beginning
    await this.saveItems();
    return item;
  }

  /**
   * Update an existing item (child classes should override to customize)
   */
  async updateItem(id, itemData) {
    const index = this.items.findIndex(item => item.id === id);
    if (index !== -1) {
      this.items[index] = {
        ...this.items[index],
        ...itemData
      };
      await this.saveItems();
      return this.items[index];
    }
    return null;
  }

  /**
   * Delete an item
   */
  async deleteItem(id) {
    this.items = this.items.filter(item => item.id !== id);
    await this.saveItems();
  }

  /**
   * Get item by ID
   */
  getItemById(id) {
    return this.items.find(item => item.id === id);
  }

  /**
   * Format date (supports multiple formats)
   * @param {string} dateString - ISO date string
   * @param {string} format - 'relative' or 'short' (default: 'relative')
   */
  formatDate(dateString, format = 'relative') {
    const date = new Date(dateString);

    if (format === 'short') {
      // Format as "Jan 15, 2025"
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }

    // Relative format (default)
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
      // Format as "Jan 15, 2025"
      const options = { month: 'short', day: 'numeric', year: 'numeric' };
      return date.toLocaleDateString('en-US', options);
    }
  }

  /**
   * Clean text - remove HTML tags but preserve HTML entities like &#39;
   */
  escapeHtml(text) {
    if (!text) return '';
    // Just strip HTML tags, let browser decode entities naturally
    return String(text).replace(/<[^>]*>/g, '');
  }

  /**
   * Validate URL
   */
  isValidUrl(string) {
    try {
      new URL(string);
      return true;
    } catch (_) {
      return false;
    }
  }

  /**
   * Render method (child classes must implement)
   */
  render() {
    throw new Error('Child class must implement render() method');
  }
}

export default ItemManager;
