import config from '../config.js';

class CacheService {
  constructor() {
    this.cache = new Map();
    this.timestamps = new Map();
  }

  // Generate cache key
  generateKey(type, ...params) {
    return `${type}:${params.join(':')}`;
  }

  // Set cache with TTL
  set(key, data, ttl = config.cache.ttl) {
    this.cache.set(key, data);
    this.timestamps.set(key, Date.now() + ttl);

    // Also store in localStorage for persistence
    try {
      localStorage.setItem(`cache_${key}`, JSON.stringify({
        data,
        expiry: Date.now() + ttl
      }));
    } catch (e) {
      console.warn('Failed to cache to localStorage:', e);
    }
  }

  // Get from cache
  get(key) {
    // Check memory cache first
    if (this.cache.has(key)) {
      const timestamp = this.timestamps.get(key);
      if (timestamp > Date.now()) {
        return this.cache.get(key);
      } else {
        // Expired
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }

    // Check localStorage
    try {
      const stored = localStorage.getItem(`cache_${key}`);
      if (stored) {
        const { data, expiry } = JSON.parse(stored);
        if (expiry > Date.now()) {
          // Restore to memory cache
          this.cache.set(key, data);
          this.timestamps.set(key, expiry);
          return data;
        } else {
          localStorage.removeItem(`cache_${key}`);
        }
      }
    } catch (e) {
      console.warn('Failed to retrieve from localStorage cache:', e);
    }

    return null;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }

  // Clear specific cache entry
  clear(key) {
    this.cache.delete(key);
    this.timestamps.delete(key);
    localStorage.removeItem(`cache_${key}`);
  }

  // Clear all cache
  clearAll() {
    this.cache.clear();
    this.timestamps.clear();

    // Clear all cache items from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Clear expired entries
  clearExpired() {
    const now = Date.now();

    // Clear from memory
    for (const [key, timestamp] of this.timestamps.entries()) {
      if (timestamp <= now) {
        this.cache.delete(key);
        this.timestamps.delete(key);
      }
    }

    // Clear from localStorage
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith('cache_')) {
        try {
          const stored = localStorage.getItem(key);
          const { expiry } = JSON.parse(stored);
          if (expiry <= now) {
            localStorage.removeItem(key);
          }
        } catch (e) {
          // Invalid cache entry, remove it
          localStorage.removeItem(key);
        }
      }
    });
  }
}

export default new CacheService();
