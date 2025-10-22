import guildService from '../services/guild-service.js';
import characterService from '../services/character-service.js';
import wowAPI from '../api/wow-api.js';
import battlenetClient from '../api/battlenet-client.js';
import { getClassColor, getClassName } from '../utils/wow-constants.js';
import { slugToFriendly, formatNumber } from '../utils/helpers.js';
import { getItemQualityColor, getSlotName, getSlotIcon } from '../utils/item-quality.js';
import { getClassIconUrl, getLocalClassIconUrl, getRaceIconUrl, getLocalRaceIconUrl, getFactionIconUrl, getLocalFactionIconUrl, getSpecIconUrl, getLocalSpecIconUrl, getFallbackIcon } from '../utils/wow-icons.js';
import config from '../config.js';

class GuildRoster {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.roster = null;
    this.sortBy = 'ilvl';
    this.filterClass = null;
    this.searchTerm = '';
    this.itemLevels = new Map(); // Store item levels for sorting
    this.genders = new Map(); // Store character genders
    this.invalidCharacters = new Set(); // Track characters that return 404
  }

  // Helper to create unique character key (name + realm)
  getCharacterKey(characterName, realmSlug) {
    return `${characterName.toLowerCase()}-${realmSlug}`;
  }

  async load() {
    if (!this.container) {
      console.error('Guild roster container not found');
      return;
    }

    this.showLoading();

    try {
      await guildService.fetchGuildRoster();
      // Get all characters
      this.roster = guildService.getRosterMembers({
        sortBy: this.sortBy
      });

      // Fetch character details for spec icons
      await this.enrichRosterWithSpecs();

      this.render();
    } catch (error) {
      this.showError(error.message);
    }
  }

  async enrichRosterWithSpecs() {
    // Fetch specs for a limited number of characters (to avoid too many API calls)
    // We'll fetch them on-demand when cards are rendered instead
    this.characterSpecs = new Map();
  }

  showLoading() {
    this.container.innerHTML = `
      <div class="loading-spinner">
        <i class="las la-circle-notch la-spin la-6x"></i>
        <p>Loading guild roster...</p>
      </div>
    `;
  }

  showError(message) {
    this.container.innerHTML = `
      <div class="error-message">
        <i class="las la-exclamation-triangle la-2x"></i>
        <p>Error loading guild roster: ${message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }

  applyFilters() {
    const options = {
      sortBy: this.sortBy === 'ilvl' ? 'name' : this.sortBy // Use name as base sort for ilvl
    };

    if (this.filterClass) {
      options.classId = this.filterClass;
    }

    this.roster = guildService.getRosterMembers(options);

    // Apply search filter
    if (this.searchTerm) {
      this.roster = this.roster.filter(member =>
        member.character.name.toLowerCase().includes(this.searchTerm.toLowerCase())
      );
    }

    // Sort by ilvl if selected (after roster is loaded)
    if (this.sortBy === 'ilvl' && this.itemLevels.size > 0) {
      this.roster.sort((a, b) => {
        const realmA = a.character.realm?.slug || config.guild.realmSlug;
        const realmB = b.character.realm?.slug || config.guild.realmSlug;
        const keyA = this.getCharacterKey(a.character.name, realmA);
        const keyB = this.getCharacterKey(b.character.name, realmB);
        const ilvlA = this.itemLevels.get(keyA) || 0;
        const ilvlB = this.itemLevels.get(keyB) || 0;
        return ilvlB - ilvlA; // Descending order (highest ilvl first)
      });
    }

    this.render();
  }

  setSortBy(sortBy) {
    this.sortBy = sortBy;
    this.applyFilters();
  }

  setClassFilter(classId) {
    this.filterClass = classId;
    this.applyFilters();
  }

  setLevelFilter(level) {
    this.filterLevel = level;
    this.applyFilters();
  }

  setSearchTerm(term) {
    this.searchTerm = term;
    this.applyFilters();
  }

  render() {
    if (!this.roster || this.roster.length === 0) {
      this.container.innerHTML = '<p class="no-results">No guild members found.</p>';
      return;
    }

    const stats = guildService.getRosterStats();

    const guildName = slugToFriendly(config.guild.name);

    // Clear old content to remove event listeners
    this.container.innerHTML = '';

    // Build new content
    const content = `
      <div class="guild-header">
        <span class="guild-count">${stats.total} Champions</span>
        <h2>
          ${guildName}
        </h2>
        <span class="guild-realms">Tarren Mill, Silvermoon & Frostmane</span>
      </div>

      <div class="roster-controls">

        <select id="sort-select" class="sort-select">
          <option value="ilvl" ${this.sortBy === 'ilvl' ? 'selected' : ''}>Sort by Item Level</option>
          <option value="rank" ${this.sortBy === 'rank' ? 'selected' : ''}>Sort by Rank</option>
          <option value="name" ${this.sortBy === 'name' ? 'selected' : ''}>Sort by Name</option>
          <option value="level" ${this.sortBy === 'level' ? 'selected' : ''}>Sort by Level</option>
          <option value="class" ${this.sortBy === 'class' ? 'selected' : ''}>Sort by Class</option>
        </select>

        <select id="class-filter" class="class-filter">
          <option value="" ${!this.filterClass ? 'selected' : ''}>View All Classes</option>
          ${this.getClassFilterOptions()}
        </select>
      </div>

      <div class="roster-grid">
        ${this.roster
          .filter(member => {
            const realmSlug = member.character.realm?.slug || config.guild.realmSlug;
            const characterKey = this.getCharacterKey(member.character.name, realmSlug);
            return !this.invalidCharacters.has(characterKey);
          })
          .map(member => this.renderMemberCard(member))
          .join('')}
      </div>
    `;

    this.container.innerHTML = content;
    this.attachEventListeners();
    this.loadAllIcons();
  }

  async loadAllIcons() {
    // Load spec, race, faction icons, character avatars, and item levels asynchronously
    try {
      // Load class icons immediately (no API needed)
      this.loadClassIcons();

      // Load item levels first to get gender data
      await this.loadItemLevels();

      // Then load everything else in parallel (race icons need gender data)
      await Promise.all([
        this.loadSpecIcons(),
        this.loadRaceFactionIcons(),
        this.loadCharacterAvatars()
      ]);
    } catch (error) {
      console.error('Error loading icons:', error);
    }
  }

  loadClassIcons() {
    const classIconPlaceholders = this.container.querySelectorAll('.class-icon-placeholder');

    classIconPlaceholders.forEach(placeholder => {
      const classId = placeholder.dataset.classId;
      const className = placeholder.dataset.className;
      const classColor = placeholder.dataset.classColor;

      const classIconUrl = getClassIconUrl(classId);
      const localClassIconUrl = getLocalClassIconUrl(classId);
      const classFallback = getFallbackIcon('class');

      if (classIconUrl) {
        // Add small delay to ensure spinner is visible
        setTimeout(() => {
          placeholder.innerHTML = `
            <i class="las la-spinner la-spin loading-spinner"></i>
            <img src="${classIconUrl}" alt="${className}" class="icon-img"
                 onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                 onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localClassIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
            <i class="${classFallback}" style="display: none; color: ${classColor}"></i>
          `;
        }, 50);
      }
    });
  }

  async loadRaceFactionIcons() {
    const raceIconsToLoad = new Map(); // Map of raceId+gender to list of placeholders
    const factionIconsToLoad = new Map(); // Map of raceId to list of placeholders

    // Collect all placeholders and group them by race/gender
    const memberCards = this.container.querySelectorAll('.member-card');

    for (const card of memberCards) {
      const raceIconPlaceholder = card.querySelector('.race-icon-placeholder');
      if (raceIconPlaceholder) {
        const raceId = raceIconPlaceholder.dataset.raceId;
        const gender = raceIconPlaceholder.dataset.gender;
        const key = `${raceId}-${gender}`;

        if (!raceIconsToLoad.has(key)) {
          raceIconsToLoad.set(key, []);
        }
        raceIconsToLoad.get(key).push({ placeholder: raceIconPlaceholder, raceId, gender });
      }

      const factionIconPlaceholder = card.querySelector('.faction-icon-placeholder');
      if (factionIconPlaceholder) {
        const raceId = factionIconPlaceholder.dataset.raceId;

        if (!factionIconsToLoad.has(raceId)) {
          factionIconsToLoad.set(raceId, []);
        }
        factionIconsToLoad.get(raceId).push({ placeholder: factionIconPlaceholder, raceId });
      }
    }

    // Fetch race data to get race name and faction info
    for (const [key, items] of raceIconsToLoad.entries()) {
      const { raceId, gender } = items[0];

      try {
        const raceData = await wowAPI.getPlayableRace(parseInt(raceId));
        const raceName = raceData.name;
        const factionType = raceData.faction?.type || 'UNKNOWN';
        const isAlliance = factionType === 'ALLIANCE';

        // Get race icon URLs from Wowhead CDN with local fallback
        const raceIconUrl = getRaceIconUrl(parseInt(raceId), gender);
        const localRaceIconUrl = getLocalRaceIconUrl(parseInt(raceId), gender);

        // Update race placeholders with actual icons
        items.forEach(item => {
          item.placeholder.title = raceName;
          if (raceIconUrl) {
            item.placeholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${raceIconUrl}" alt="${raceName}" class="icon-img"
                   onload="this.previousElementSibling.style.display='none';"
                   onerror="this.onerror=null; this.previousElementSibling.style.display='none'; this.src='${localRaceIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
              <i class="${getFallbackIcon('race')}" style="display: none;"></i>
            `;
          }

          // Update race text in the card
          const card = item.placeholder.closest('.member-card');
          if (card) {
            const raceTextElement = card.querySelector('.member-race');
            if (raceTextElement) {
              raceTextElement.textContent = raceName;
            }
          }
        });

        // Update faction placeholders with actual icons
        const factionItems = factionIconsToLoad.get(raceId);
        if (factionItems) {
          const factionIconUrl = getFactionIconUrl(isAlliance);
          const localFactionIconUrl = getLocalFactionIconUrl(isAlliance);
          const factionName = isAlliance ? 'Alliance' : 'Horde';

          factionItems.forEach(item => {
            item.placeholder.title = factionName;
            item.placeholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${factionIconUrl}" alt="${factionName}" class="icon-img"
                   onload="this.previousElementSibling.style.display='none';"
                   onerror="this.onerror=null; this.previousElementSibling.style.display='none'; this.src='${localFactionIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
              <i class="${getFallbackIcon('race')}" style="display: none;"></i>
            `;

            // Update faction text in the card
            const card = item.placeholder.closest('.member-card');
            if (card) {
              const factionTextElement = card.querySelector('.member-faction');
              if (factionTextElement) {
                factionTextElement.textContent = factionName;
              }
            }
          });
        }
      } catch (error) {
        console.error(`Error loading race data for race ${raceId}:`, error);
      }

      // Small delay between requests
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  async loadSpecIcons() {
    const specPlaceholders = this.container.querySelectorAll('.spec-icon-placeholder');

    // Limit concurrent requests to avoid overwhelming the API
    const batchSize = 5;
    let successCount = 0;
    let failCount = 0;

    for (let i = 0; i < specPlaceholders.length; i += batchSize) {
      const batch = Array.from(specPlaceholders).slice(i, i + batchSize);

      await Promise.all(batch.map(async (placeholder) => {
        const characterName = placeholder.dataset.character;
        const realmSlug = placeholder.dataset.realm;

        const card = placeholder.closest('.member-card');
        const specTextElement = card?.querySelector('.member-spec');

        try {
          const specs = await characterService.fetchCharacterSpecializations(realmSlug, characterName);

          if (!specs || !specs.specializations) {
            if (specTextElement) {
              specTextElement.textContent = 'No spec';
            }
            failCount++;
            return;
          }

          const activeSpec = characterService.getActiveSpec(specs);

          if (!activeSpec || !activeSpec.specialization) {
            if (specTextElement) {
              specTextElement.textContent = 'No spec';
            }
            failCount++;
            return;
          }

          const specId = activeSpec.specialization.id;
          const specName = activeSpec.specialization.name;
          const specIconUrl = getSpecIconUrl(specId);
          const localSpecIconUrl = getLocalSpecIconUrl(specId);

          placeholder.title = specName;
          if (specIconUrl) {
            placeholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${specIconUrl}" alt="${specName}" class="icon-img"
                   onload="this.previousElementSibling.style.display='none';"
                   onerror="this.onerror=null; this.previousElementSibling.style.display='none'; this.src='${localSpecIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
              <i class="${getFallbackIcon('spec')}" style="display: none;"></i>
            `;
          }

          // Add spec text to the card
          if (specTextElement) {
            specTextElement.textContent = specName;
            successCount++;
          }
        } catch (error) {
          // Character might not exist or API error
          if (specTextElement) {
            specTextElement.textContent = 'No spec';
          }
          failCount++;
        }
      }));

      // Small delay between batches
      if (i + batchSize < specPlaceholders.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  async loadCharacterAvatars() {
    const memberCards = this.container.querySelectorAll('.member-card');

    // Limit concurrent requests
    const batchSize = 5;
    let successCount = 0;
    let failCount = 0;

    const cardsArray = Array.from(memberCards);
    for (let i = 0; i < cardsArray.length; i += batchSize) {
      const batch = cardsArray.slice(i, i + batchSize);

      await Promise.all(batch.map(async (card) => {
        const characterName = card.dataset.character;
        const realmSlug = card.dataset.realm;
        const avatarPlaceholder = card.querySelector('.character-avatar-placeholder');

        if (!avatarPlaceholder) return;

        try {
          const media = await characterService.fetchCharacterMedia(realmSlug, characterName);

          if (!media || !media.assets) {
            failCount++;
            return;
          }

          // Log if character name in response doesn't match request
          if (media.character && media.character.name) {
            const responseName = media.character.name;
            if (responseName.toLowerCase() !== characterName.toLowerCase()) {
              console.warn(`⚠️ Character name mismatch! Requested: "${characterName}", Got: "${responseName}"`);
            }
          }

          // Get inset image (or fallback to avatar)
          const insetAsset = media.assets.find(asset => asset.key === 'inset');
          const avatarAsset = media.assets.find(asset => asset.key === 'avatar');
          const imageUrl = insetAsset?.value || avatarAsset?.value;

          if (imageUrl) {
            // Preserve the member-header div that's already inside the placeholder
            const memberHeader = avatarPlaceholder.querySelector('.member-header');
            const memberHeaderHTML = memberHeader ? memberHeader.outerHTML : '';

            avatarPlaceholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${imageUrl}" alt="${characterName}" class="character-avatar-img"
                   onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';" />
              ${memberHeaderHTML}
            `;
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          failCount++;
        }
      }));

      // Small delay between batches
      if (i + batchSize < cardsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }
  }

  async loadItemLevels() {
    const memberCards = this.container.querySelectorAll('.member-card');

    // Limit concurrent requests
    const batchSize = 5;
    let successCount = 0;
    let failCount = 0;
    let foundInvalidCharacters = false;

    const cardsArray = Array.from(memberCards);
    for (let i = 0; i < cardsArray.length; i += batchSize) {
      const batch = cardsArray.slice(i, i + batchSize);

      await Promise.all(batch.map(async (card) => {
        const characterName = card.dataset.character;
        const realmSlug = card.dataset.realm;
        const ilvlElement = card.querySelector('.member-ilvl');

        if (!ilvlElement) return;

        try {
          // Fetch character profile which contains the accurate equipped_item_level
          const profile = await characterService.fetchCharacterProfile(realmSlug, characterName);

          if (!profile) {
            ilvlElement.textContent = 'N/A';
            failCount++;
            return;
          }

          // Get item level from profile
          const itemLevel = profile.equipped_item_level || profile.average_item_level;

          // Use composite key (name + realm) for uniqueness
          const characterKey = this.getCharacterKey(characterName, realmSlug);

          // Store gender from profile
          if (profile.gender) {
            this.genders.set(characterKey, profile.gender.type);
          }

          if (itemLevel) {
            ilvlElement.textContent = itemLevel;
            // Store item level for sorting
            this.itemLevels.set(characterKey, itemLevel);
            successCount++;
          } else {
            ilvlElement.textContent = 'N/A';
            failCount++;
          }
        } catch (error) {
          // Track 404 errors - character doesn't exist
          const is404 = error.status === 404 || (error.message && error.message.includes('404'));
          if (is404) {
            const characterKey = this.getCharacterKey(characterName, realmSlug);
            this.invalidCharacters.add(characterKey);
            foundInvalidCharacters = true;
          } else {
            // Log other errors normally
            console.error(`Error loading item level for ${characterName}:`, error);
          }
          ilvlElement.textContent = 'N/A';
          failCount++;
        }
      }));

      // Small delay between batches
      if (i + batchSize < cardsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    // Re-render roster if we found any invalid characters
    if (foundInvalidCharacters) {
      this.render();
      return; // Skip the rest since we're re-rendering
    }

    // Update race icons now that we have gender data
    this.updateRaceIconsWithGender();

    // Re-sort DOM elements without re-rendering if sorting by ilvl
    if (this.sortBy === 'ilvl' && this.itemLevels.size > 0) {
      this.sortDOMByIlvl();
    }
  }

  // Update race icons with correct gender after gender data is loaded
  updateRaceIconsWithGender() {
    const memberCards = this.container.querySelectorAll('.member-card');

    memberCards.forEach(card => {
      const characterName = card.dataset.character;
      const realmSlug = card.dataset.realm;
      const characterKey = this.getCharacterKey(characterName, realmSlug);
      const gender = this.genders.get(characterKey);

      if (!gender) return; // Skip if no gender data

      // Find race icon placeholder
      const raceIconPlaceholder = card.querySelector('.race-icon-placeholder');
      if (raceIconPlaceholder) {
        const raceId = parseInt(raceIconPlaceholder.dataset.raceId);

        // Update the data-gender attribute
        raceIconPlaceholder.dataset.gender = gender;

        // Get new icon URL with correct gender
        const raceIconUrl = getRaceIconUrl(raceId, gender);
        const localRaceIconUrl = getLocalRaceIconUrl(raceId, gender);

        // Replace spinner with image
        if (raceIconUrl) {
          raceIconPlaceholder.innerHTML = `
            <i class="las la-spinner la-spin loading-spinner"></i>
            <img src="${raceIconUrl}" alt="Race" class="icon-img"
                 onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                 onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localRaceIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
            <i class="${getFallbackIcon('race')}" style="display: none;"></i>
          `;
        }
      }
    });
  }

  sortDOMByIlvl() {
    const rosterGrid = this.container.querySelector('.roster-grid');
    if (!rosterGrid) return;

    // Get all member cards
    const cards = Array.from(rosterGrid.querySelectorAll('.member-card'));

    // Sort cards by item level (descending)
    cards.sort((a, b) => {
      const nameA = a.dataset.character;
      const realmA = a.dataset.realm;
      const keyA = this.getCharacterKey(nameA, realmA);

      const nameB = b.dataset.character;
      const realmB = b.dataset.realm;
      const keyB = this.getCharacterKey(nameB, realmB);

      const ilvlA = this.itemLevels.get(keyA) || 0;
      const ilvlB = this.itemLevels.get(keyB) || 0;
      return ilvlB - ilvlA;
    });

    // Re-append cards in sorted order (this moves them in the DOM)
    cards.forEach(card => rosterGrid.appendChild(card));
  }

  getClassFilterOptions() {
    const classes = new Set();
    guildService.guildRoster.members.forEach(member => {
      classes.add(member.character.playable_class.id);
    });

    return Array.from(classes)
      .sort((a, b) => a - b)
      .map(classId => {
        const selected = this.filterClass === classId ? 'selected' : '';
        return `<option value="${classId}" ${selected}>${getClassName(classId)}</option>`;
      })
      .join('');
  }

  renderMemberCard(member) {
    const character = member.character;
    const classColor = getClassColor(character.playable_class.id);
    const className = getClassName(character.playable_class.id);

    // Get realm from character data (cross-realm guilds have characters from different realms)
    const realmSlug = character.realm?.slug || config.guild.realmSlug;
    const realmName = character.realm?.name || slugToFriendly(realmSlug);

    // Get class icon URLs from Wowhead CDN with local fallback
    const classIconUrl = getClassIconUrl(character.playable_class.id);
    const localClassIconUrl = getLocalClassIconUrl(character.playable_class.id);

    // Fallback icons
    const classFallback = getFallbackIcon('class');
    const raceFallback = getFallbackIcon('race');
    const specFallback = getFallbackIcon('spec');
    const factionFallback = getFallbackIcon('race');

    // Get gender from stored data (fetched from character profile)
    const characterKey = this.getCharacterKey(character.name, realmSlug);
    const storedGender = this.genders.get(characterKey);
    const gender = storedGender || 'MALE';
    const genderName = storedGender || 'Unknown';

    // Get race icon URLs from Wowhead CDN with local fallback
    const raceIconUrl = getRaceIconUrl(character.playable_race?.id, gender);
    const localRaceIconUrl = getLocalRaceIconUrl(character.playable_race?.id, gender);

    return `
      <div class="member-card" data-character="${character.name}" data-realm="${realmSlug}" style="border-bottom: 0px solid ${classColor};">
        <div class="member-level">${character.level}</div>
        <div class="character-avatar-placeholder">
          <i class="las la-spinner la-spin loading-spinner"></i>
            
        </div>
        
        <div class="member-header">
            <div class="member-name-with-icon">
              <div class="member-name" style="color: ${classColor}">
                ${character.name}
              </div>
            </div>
        </div>

        <div class="member-details">
          <div class="member-detail-row">
            <div class="member-icon class-icon-small class-icon-placeholder" title="${className}" data-class-id="${character.playable_class.id}" data-class-name="${className}" data-class-color="${classColor}">
              <i class="las la-spinner la-spin loading-spinner"></i>
            </div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon race-icon-small race-icon-placeholder" title="${genderName}" data-race-id="${character.playable_race?.id}" data-gender="${gender}">
              <i class="las la-spinner la-spin loading-spinner"></i>
            </div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon spec-icon-small spec-icon-placeholder" title="Specialization" data-character="${character.name}" data-realm="${realmSlug}">
              <i class="las la-spinner la-spin"></i>
            </div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon faction-icon-small faction-icon-placeholder" title="Faction" data-race-id="${character.playable_race?.id}">
              <i class="las la-spinner la-spin"></i>
            </div>
            <div class="member-ilvl"><i class="las la-spinner la-spin"></i></div>
          </div>
        </div>
        <div class="member-realm-badge-container">
          <div class="member-realm-badge">${realmName}</div>
        </div>
      </div>
    `;
  }

  attachEventListeners() {
    // Search input
    const searchInput = document.getElementById('search-input');
    if (searchInput) {
      searchInput.addEventListener('input', (e) => {
        this.setSearchTerm(e.target.value);
      });
    }

    // Sort select
    const sortSelect = document.getElementById('sort-select');
    if (sortSelect) {
      sortSelect.addEventListener('change', (e) => {
        this.setSortBy(e.target.value);
      });
    }

    // Class filter
    const classFilter = document.getElementById('class-filter');
    if (classFilter) {
      classFilter.addEventListener('change', (e) => {
        const classId = e.target.value ? parseInt(e.target.value) : null;
        this.setClassFilter(classId);
      });
    }

    // Member card clicks
    const memberCards = this.container.querySelectorAll('.member-card');

    memberCards.forEach((card) => {
      // Remove any existing listeners by cloning the element
      const newCard = card.cloneNode(true);
      card.parentNode.replaceChild(newCard, card);

      newCard.addEventListener('click', (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const characterName = newCard.dataset.character;
        const realmSlug = newCard.dataset.realm;

        // Navigate to character details page
        window.location.href = `character-details.html?character=${encodeURIComponent(characterName)}&realm=${encodeURIComponent(realmSlug)}`;
      });
      // Add cursor pointer style
      newCard.style.cursor = 'pointer';
    });
  }

  // All modal-related methods have been removed
  // Character details are now shown on a separate page (character-details.html)
}

export default GuildRoster;
