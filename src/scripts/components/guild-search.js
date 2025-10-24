/**
 * Guild Search Component - Search for guilds by name, realm, and region
 */
class GuildSearch {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.onSearch = null;
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
          placeholder="Guild name"
          class="search-input"
          required
        />
        <input
          type="text"
          id="realm-input"
          placeholder="Realm (e.g., tarren-mill)"
          class="search-input"
          required
        />
        <div class="region-radio-group">
          <label class="region-radio-label">
            <input type="radio" name="region" value="eu" checked />
            <span class="region-radio-text">EU</span>
          </label>
          <label class="region-radio-label">
            <input type="radio" name="region" value="us" />
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
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const guildName = document.getElementById('guild-name-input').value.trim();
        const realmInput = document.getElementById('realm-input');
        const realm = realmInput ? realmInput.value.trim() : '';
        const regionChecked = document.querySelector('input[name="region"]:checked');
        const region = regionChecked ? regionChecked.value : 'eu';

        if (!realm) {
          alert('Please enter a realm');
          return;
        }

        if (this.onSearch) {
          this.onSearch({ guildName, realm, region });
        }
      });
    }
  }

  setOnSearchCallback(callback) {
    this.onSearch = callback;
  }
}

export default GuildSearch;
