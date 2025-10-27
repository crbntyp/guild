/**
 * Guild Search Component - Search for guilds by name, realm, and region
 */
class GuildSearch {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.onSelectGuild = null;
  }

  async render() {
    if (!this.container) {
      console.error('Guild search container not found');
      return;
    }

    this.container.innerHTML = `
      <form class="guild-search-bar" id="guild-search-form">
        <input
          type="text"
          id="guild-name-input"
          placeholder="Guild name..."
          class="search-input"
          required
        />
        <input
          type="text"
          id="realm-slug-input"
          placeholder="Realm (e.g tarren-mill)..."
          class="search-input"
          required
        />
        <div class="region-radio-group">
          <label class="region-radio-label">
            <input
              type="radio"
              name="region"
              value="eu"
              id="region-eu"
              checked
            />
            <span class="region-radio-text">EU</span>
          </label>
          <label class="region-radio-label">
            <input
              type="radio"
              name="region"
              value="us"
              id="region-us"
            />
            <span class="region-radio-text">US</span>
          </label>
        </div>
        <button type="submit" class="btn-search">
          <i class="las la-search"></i>
          Search
        </button>
      </form>
    `;

    this.attachEventListeners();
  }

  attachEventListeners() {
    const form = document.getElementById('guild-search-form');

    if (form) {
      form.addEventListener('submit', async (e) => {
        e.preventDefault();
        const guildName = document.getElementById('guild-name-input').value.trim();
        const realm = document.getElementById('realm-slug-input').value.trim();
        const region = document.querySelector('input[name="region"]:checked').value;

        if (!guildName || !realm) {
          return;
        }

        if (this.onSelectGuild) {
          this.onSelectGuild({ guildName, realm, region });
        }
      });
    }
  }

  setOnSelectCallback(callback) {
    this.onSelectGuild = callback;
  }

  // Keep the old method name for backwards compatibility
  setOnSearchCallback(callback) {
    this.onSelectGuild = callback;
  }
}

export default GuildSearch;
