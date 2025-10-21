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

      console.log(`Loaded ${this.roster.length} characters`);

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
        <i class="las la-circle-notch la-spin la-3x"></i>
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
        <h2>${guildName}</h2>
        <div class="guild-stats">
          <div class="stat">
            <span class="stat-label">Members</span>
            <span class="stat-value">${stats.total}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Max Level</span>
            <span class="stat-value">${stats.maxLevel}</span>
          </div>
          <div class="stat">
            <span class="stat-label">Avg Level</span>
            <span class="stat-value">${stats.averageLevel}</span>
          </div>
        </div>
      </div>

      <div class="roster-controls">
        <input
          type="text"
          id="search-input"
          class="search-input"
          placeholder="Search members..."
        />

        <select id="sort-select" class="sort-select">
          <option value="ilvl" ${this.sortBy === 'ilvl' ? 'selected' : ''}>Sort by iLvl</option>
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
      const results = await Promise.all([
        this.loadSpecIcons(),
        this.loadRaceFactionIcons(),
        this.loadCharacterAvatars()
      ]);
      console.log('All icons loaded', results);
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
    console.log('loadRaceFactionIcons called - using Blizzard render service');
    const raceIconsToLoad = new Map(); // Map of raceId+gender to list of placeholders
    const factionIconsToLoad = new Map(); // Map of raceId to list of placeholders

    // Collect all placeholders and group them by race/gender
    const memberCards = this.container.querySelectorAll('.member-card');
    console.log('Found member cards:', memberCards.length);

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

    console.log('Race/Faction icons to load:', raceIconsToLoad.size);

    // Fetch race data to get race name and faction info
    for (const [key, items] of raceIconsToLoad.entries()) {
      const { raceId, gender } = items[0];

      try {
        const raceData = await wowAPI.getPlayableRace(parseInt(raceId));
        const raceName = raceData.name;
        const factionType = raceData.faction?.type || 'UNKNOWN';
        const isAlliance = factionType === 'ALLIANCE';

        console.log(`Race ${raceId}: ${raceName} (${factionType})`);

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

    console.log('Race and faction icons loaded from Blizzard render service');
  }

  async loadSpecIcons() {
    console.log('loadSpecIcons called - loading spec text');
    const specPlaceholders = this.container.querySelectorAll('.spec-icon-placeholder');
    console.log('Found spec placeholders:', specPlaceholders.length);

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
          console.log(`Fetching spec for ${characterName}...`);
          const specs = await characterService.fetchCharacterSpecializations(realmSlug, characterName);

          if (!specs || !specs.specializations) {
            console.log(`${characterName}: No spec data returned`, specs);
            if (specTextElement) {
              specTextElement.textContent = 'No spec';
            }
            failCount++;
            return;
          }

          console.log(`${characterName}: Spec data:`, specs.specializations);

          const activeSpec = characterService.getActiveSpec(specs);

          if (!activeSpec || !activeSpec.specialization) {
            console.log(`${characterName}: No active spec found. Full specs:`, JSON.stringify(specs.specializations));
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
            console.log(`${characterName}: ✓ ${specName}`);
            successCount++;
          }
        } catch (error) {
          // Character might not exist or API error
          console.log(`${characterName}: ✗ Error - ${error.message}`);
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

    console.log(`Spec loading complete: ${successCount} loaded, ${failCount} failed`);
  }

  async loadCharacterAvatars() {
    console.log('loadCharacterAvatars called');
    const memberCards = this.container.querySelectorAll('.member-card');
    console.log('Found member cards for avatars:', memberCards.length);

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
            avatarPlaceholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${imageUrl}" alt="${characterName}" class="character-avatar-img"
                   onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';" />
            `;
            successCount++;
          } else {
            failCount++;
          }
        } catch (error) {
          console.log(`Could not load avatar for ${characterName}`);
          failCount++;
        }
      }));

      // Small delay between batches
      if (i + batchSize < cardsArray.length) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    console.log(`Avatar loading complete: ${successCount} loaded, ${failCount} failed`);
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
            console.log(`Character ${characterName} (${realmSlug}) not found (404) - will be filtered from roster`);
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
      console.log(`Found ${this.invalidCharacters.size} invalid characters - re-rendering roster`);
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
      <div class="member-card" data-character="${character.name}" data-realm="${realmSlug}" style="border: 2px solid ${classColor}">
        <div class="character-avatar-placeholder">
          <i class="las la-spinner la-spin loading-spinner"></i>
        </div>
        <div class="member-header">
          <div class="member-name-with-icon">
            <div class="member-icon class-icon" title="${className}">
              ${classIconUrl ? `
                <img src="${classIconUrl}" alt="${className}" class="icon-img"
                     onerror="this.onerror=null; this.src='${localClassIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
                <i class="${classFallback}" style="display: none; color: ${classColor}"></i>
              ` : `
                <i class="${classFallback}" style="color: ${classColor}"></i>
              `}
            </div>
            <div class="member-name" style="color: ${classColor}">
              ${character.name}
              ${character.realm?.name ? `<span style="font-size: 0.75em; opacity: 0.7; font-weight: normal;"> - ${character.realm.name}</span>` : ''}
            </div>
          </div>
          <div class="member-level">Level ${character.level}</div>
        </div>
        <div class="member-details">
          <div class="member-detail-row">
            <div class="member-icon class-icon-small class-icon-placeholder" title="${className}" data-class-id="${character.playable_class.id}" data-class-name="${className}" data-class-color="${classColor}">
              <i class="las la-spinner la-spin loading-spinner"></i>
            </div>
            <div class="member-class">${className}</div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon race-icon-small race-icon-placeholder" title="${genderName}" data-race-id="${character.playable_race?.id}" data-gender="${gender}">
              <i class="las la-spinner la-spin loading-spinner"></i>
            </div>
            <div class="member-race">Loading...</div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon spec-icon-small spec-icon-placeholder" title="Specialization" data-character="${character.name}" data-realm="${realmSlug}">
              <i class="las la-spinner la-spin"></i>
            </div>
            <div class="member-spec">Loading spec...</div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon faction-icon-small faction-icon-placeholder" title="Faction" data-race-id="${character.playable_race?.id}">
              <i class="las la-spinner la-spin"></i>
            </div>
            <div class="member-faction">Loading...</div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon ilvl-icon" title="Item Level">
              <i class="las la-shield-alt"></i>
            </div>
            <div class="member-ilvl">Loading...</div>
          </div>
        </div>
        ${realmName ? `<div class="member-realm-badge">${realmName}</div>` : ''}
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

      newCard.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent event bubbling
        const characterName = newCard.dataset.character;
        const realmSlug = newCard.dataset.realm;
        await this.showCharacterDetails(realmSlug, characterName);
      });
      // Add cursor pointer style
      newCard.style.cursor = 'pointer';
    });
  }

  async showCharacterDetails(realmSlug, characterName) {
    // Prevent multiple simultaneous calls for the same character
    if (this.loadingCharacter === characterName) {
      return;
    }
    this.loadingCharacter = characterName;

    // Show loading modal
    const modal = document.createElement('div');
    modal.className = 'character-modal';
    modal.innerHTML = `
      <div class="modal-content">
        <span class="modal-close">&times;</span>
        <div class="loading-spinner">
          <i class="las la-circle-notch la-spin la-3x"></i>
          <p>Loading character data...</p>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Close button
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Close on background click
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    try {
      const data = await characterService.fetchFullCharacterData(realmSlug, characterName);
      this.renderCharacterDetails(modal, data, realmSlug);
    } catch (error) {
      modal.querySelector('.modal-content').innerHTML = `
        <span class="modal-close">&times;</span>
        <div class="error-message">
          <p>Failed to load character data</p>
        </div>
      `;
      // Re-attach close event after replacing content
      const newCloseBtn = modal.querySelector('.modal-close');
      newCloseBtn.addEventListener('click', () => {
        modal.remove();
      });
    } finally {
      this.loadingCharacter = null;
    }
  }

  renderCharacterDetails(modal, data, realmSlug) {
    const { profile, equipment, specs, media } = data;

    if (!profile) {
      modal.querySelector('.modal-content').innerHTML = `
        <span class="modal-close">&times;</span>
        <div class="error-message">
          <p>Character data not available</p>
        </div>
      `;
      // Re-attach close event after replacing content
      const newCloseBtn = modal.querySelector('.modal-close');
      newCloseBtn.addEventListener('click', () => {
        modal.remove();
      });
      return;
    }

    const classColor = getClassColor(profile.character_class.id);
    const className = getClassName(profile.character_class.id);
    const itemLevel = profile?.equipped_item_level || profile?.average_item_level || 'N/A';
    const activeSpec = specs ? characterService.getActiveSpec(specs) : null;

    // Get different media assets (priority: main-raw for full body, then inset, then avatar)
    const avatar = media?.assets?.find(asset => asset.key === 'avatar')?.value || '';
    const inset = media?.assets?.find(asset => asset.key === 'inset')?.value || '';
    const mainRaw = media?.assets?.find(asset => asset.key === 'main-raw')?.value || '';
    const main = media?.assets?.find(asset => asset.key === 'main')?.value || '';

    // Use main-raw (full body without background) as primary, with fallbacks
    const render = mainRaw || main || inset || avatar;

    // Gender display
    const gender = profile.gender?.name || profile.gender?.type || 'Unknown';

    const equipmentHTML = this.renderEquipment(equipment);
    const carouselHTML = this.renderCharacterCarousel(profile.name, realmSlug);

    modal.querySelector('.modal-content').innerHTML = `
      <span class="modal-close">&times;</span>
      <div class="character-modal-top">
        <div class="character-details-wrapper">
          <div class="character-details-left">
            <div class="character-details">
              <div class="character-header-section">
                ${render ? `<img src="${render}" alt="${profile.name}" class="character-render" />` : ''}
                <div class="character-title-info">
                  <h2 style="color: ${classColor}">${profile.name}</h2>
                  <div class="character-meta">
                    <span class="meta-badge" style="background-color: ${classColor}20; color: ${classColor}">
                      ${className}
                    </span>
                    <span class="meta-badge">${profile.race.name}</span>
                    <span class="meta-badge">${gender}</span>
                    ${profile.realm?.name ? `<span class="meta-badge" style="background-color: rgba(255, 255, 255, 0.1);"><i class="las la-server"></i> ${profile.realm.name}</span>` : ''}
                  </div>
                  <div class="character-detail-icons">
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div class="character-info">
                <p><strong>Level:</strong> ${profile.level}</p>
                ${activeSpec ? `<p><strong>Spec:</strong> ${activeSpec.specialization?.name || 'N/A'}</p>` : ''}
                <p><strong>Item Level:</strong> ${itemLevel}</p>
                <p><strong>Achievement Points:</strong> ${formatNumber(profile.achievement_points || 0)}</p>
              </div>
            </div>
          </div>
          <div class="character-details-right">
            ${equipmentHTML}
          </div>
        </div>
      </div>
      <div class="character-carousel-container">
        <button class="carousel-nav carousel-nav-left" aria-label="Scroll left">
          <i class="las la-chevron-left"></i>
        </button>
        <div class="character-carousel">
          ${carouselHTML}
        </div>
        <button class="carousel-nav carousel-nav-right" aria-label="Scroll right">
          <i class="las la-chevron-right"></i>
        </button>
      </div>
    `;

    // Re-attach close event
    const closeBtn = modal.querySelector('.modal-close');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Attach tooltip events
    this.attachTooltipEvents();

    // Attach carousel events
    this.attachCarouselEvents(modal);

    // Load carousel character images asynchronously
    this.loadCarouselCharacterImages(modal);

    // Load carousel spec icons
    this.loadCarouselSpecIcons(modal);

    // Load character detail icons (class, race, spec, faction)
    this.loadCharacterDetailIcons(modal, profile, activeSpec);

    // Load item thumbnails asynchronously
    this.loadItemThumbnails(modal, equipment);
  }

  async loadCarouselCharacterImages(modal) {
    const carouselPlaceholders = modal.querySelectorAll('.carousel-character-avatar-placeholder');
    console.log('Loading carousel character images:', carouselPlaceholders.length);

    let foundInvalidCharacters = false;

    // Load images in batches
    const batchSize = 3;
    const placeholdersArray = Array.from(carouselPlaceholders);

    for (let i = 0; i < placeholdersArray.length; i += batchSize) {
      const batch = placeholdersArray.slice(i, i + batchSize);

      await Promise.all(batch.map(async (placeholder) => {
        const characterName = placeholder.dataset.characterName;
        const realmSlug = placeholder.dataset.realmSlug;

        if (!characterName || !realmSlug) return;

        try {
          const media = await characterService.fetchCharacterMedia(realmSlug, characterName);

          if (!media || !media.assets) return;

          // Get inset image
          const insetAsset = media.assets.find(asset => asset.key === 'inset');
          const avatarAsset = media.assets.find(asset => asset.key === 'avatar');
          const imageUrl = insetAsset?.value || avatarAsset?.value;

          if (imageUrl) {
            placeholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${imageUrl}" alt="${characterName}"
                   onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';" />
            `;
          }
        } catch (error) {
          // Track 404 errors - character doesn't exist
          const is404 = error.status === 404 || (error.message && error.message.includes('404'));
          if (is404) {
            const characterKey = this.getCharacterKey(characterName, realmSlug);
            this.invalidCharacters.add(characterKey);
            foundInvalidCharacters = true;
            console.log(`Character ${characterName} (${realmSlug}) not found (404) - will be filtered from roster`);
          }
        }
      }));

      // Small delay between batches
      if (i + batchSize < placeholdersArray.length) {
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }

    // Re-render roster if we found any invalid characters
    if (foundInvalidCharacters) {
      console.log(`Found ${this.invalidCharacters.size} invalid characters - re-rendering roster`);
      this.render();
    }
  }

  async loadCarouselSpecIcons(modal) {
    const carouselCharacters = modal.querySelectorAll('.carousel-character');

    for (const charElement of carouselCharacters) {
      const characterName = charElement.dataset.character;
      const realmSlug = charElement.dataset.realm;

      try {
        const specs = await characterService.fetchCharacterSpecializations(realmSlug, characterName);
        if (!specs || !specs.specializations) continue;

        const activeSpec = specs.specializations.find(s => s.is_active || specs.active_specialization?.id === s.specialization?.id);
        if (!activeSpec || !activeSpec.specialization) continue;

        const specId = activeSpec.specialization.id;
        const specIconUrl = getSpecIconUrl(specId);
        const localSpecIconUrl = getLocalSpecIconUrl(specId);

        charElement.dataset.specId = specId;
        const specIconWrapper = charElement.querySelector('.carousel-icon-wrapper:nth-child(3)');
        if (specIconWrapper && specIconUrl) {
          specIconWrapper.innerHTML = `
            <i class="las la-spinner la-spin loading-spinner"></i>
            <img src="${specIconUrl}" alt="Spec" class="carousel-icon carousel-icon-spec"
                 onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                 onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localSpecIconUrl}';" />
          `;
        }
      } catch (error) {
        // Track 404 errors - character doesn't exist
        const is404 = error.status === 404 || (error.message && error.message.includes('404'));
        if (is404) {
          const characterKey = this.getCharacterKey(characterName, realmSlug);
          this.invalidCharacters.add(characterKey);
          console.log(`Character ${characterName} (${realmSlug}) not found (404) - will be filtered from roster`);
        }
      }
    }
  }

  loadCharacterDetailIcons(modal, profile, activeSpec) {
    const iconContainer = modal.querySelector('.character-detail-icons');
    if (!iconContainer) return;

    const iconWrappers = iconContainer.querySelectorAll('.detail-icon-wrapper');
    if (iconWrappers.length !== 4) return;

    // Get all icon URLs
    const classId = profile.character_class.id;
    const raceId = profile.race.id;
    const specId = activeSpec?.specialization?.id;
    const isAlliance = profile.faction?.type === 'ALLIANCE';
    const gender = profile.gender?.type || profile.gender?.name || 'MALE';

    const classIconUrl = getClassIconUrl(classId);
    const localClassIconUrl = getLocalClassIconUrl(classId);
    const className = getClassName(classId);
    const classColor = getClassColor(classId);

    const raceIconUrl = getRaceIconUrl(raceId, gender);
    const localRaceIconUrl = getLocalRaceIconUrl(raceId, gender);

    const specIconUrl = specId ? getSpecIconUrl(specId) : null;
    const localSpecIconUrl = specId ? getLocalSpecIconUrl(specId) : null;
    const specName = activeSpec?.specialization?.name || 'N/A';

    const factionIconUrl = getFactionIconUrl(isAlliance);
    const localFactionIconUrl = getLocalFactionIconUrl(isAlliance);
    const factionName = isAlliance ? 'Alliance' : 'Horde';

    // Load class icon
    if (classIconUrl) {
      iconWrappers[0].innerHTML = `
        <i class="las la-spinner la-spin loading-spinner"></i>
        <img src="${classIconUrl}" alt="${className}" class="detail-icon"
             onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
             onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localClassIconUrl}';" />
      `;
    }

    // Load race icon
    if (raceIconUrl) {
      iconWrappers[1].innerHTML = `
        <i class="las la-spinner la-spin loading-spinner"></i>
        <img src="${raceIconUrl}" alt="Race" class="detail-icon"
             onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
             onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localRaceIconUrl}';" />
      `;
    }

    // Load spec icon
    if (specIconUrl) {
      iconWrappers[2].innerHTML = `
        <i class="las la-spinner la-spin loading-spinner"></i>
        <img src="${specIconUrl}" alt="${specName}" class="detail-icon"
             onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
             onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localSpecIconUrl}';" />
      `;
    }

    // Load faction icon
    if (factionIconUrl) {
      iconWrappers[3].innerHTML = `
        <i class="las la-spinner la-spin loading-spinner"></i>
        <img src="${factionIconUrl}" alt="${factionName}" class="detail-icon"
             onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
             onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localFactionIconUrl}';" />
      `;
    }
  }

  renderCharacterCarousel(currentCharacterName, currentRealmSlug) {
    if (!this.roster || this.roster.length === 0) {
      return '<p>No characters available</p>';
    }

    // Create composite key for current character
    const currentCharacterKey = this.getCharacterKey(currentCharacterName, currentRealmSlug);

    // Filter out invalid characters (404s) and sort roster by ilvl (descending)
    const sortedRoster = [...this.roster]
      .filter(member => {
        const realmSlug = member.character.realm?.slug || config.guild.realmSlug;
        const characterKey = this.getCharacterKey(member.character.name, realmSlug);
        return !this.invalidCharacters.has(characterKey);
      })
      .sort((a, b) => {
        const realmA = a.character.realm?.slug || config.guild.realmSlug;
        const realmB = b.character.realm?.slug || config.guild.realmSlug;
        const keyA = this.getCharacterKey(a.character.name, realmA);
        const keyB = this.getCharacterKey(b.character.name, realmB);
        const ilvlA = this.itemLevels.get(keyA) || 0;
        const ilvlB = this.itemLevels.get(keyB) || 0;
        return ilvlB - ilvlA;
      });

    // Render all characters in roster
    return sortedRoster.map(member => {
      const character = member.character;
      const classColor = getClassColor(character.playable_class.id);
      const className = getClassName(character.playable_class.id);
      const realmSlug = character.realm?.slug || config.guild.realmSlug;
      const characterKey = this.getCharacterKey(character.name, realmSlug);
      const isActive = characterKey === currentCharacterKey;
      const classIconUrl = getClassIconUrl(character.playable_class.id);
      const localClassIconUrl = getLocalClassIconUrl(character.playable_class.id);
      const ilvl = this.itemLevels.get(characterKey) || '?';

      const storedGender = this.genders.get(characterKey);
      const gender = storedGender || 'MALE';
      const raceIconUrl = getRaceIconUrl(character.playable_race?.id, gender);
      const localRaceIconUrl = getLocalRaceIconUrl(character.playable_race?.id, gender);

      const isAlliance = character.faction?.type === 'ALLIANCE';
      const factionIconUrl = getFactionIconUrl(isAlliance);
      const localFactionIconUrl = getLocalFactionIconUrl(isAlliance);

      return `
        <div class="carousel-character ${isActive ? 'active' : ''}"
             data-character="${character.name}"
             data-realm="${realmSlug}"
             data-race-id="${character.playable_race?.id}"
             data-spec-id=""
             style="border: 2px solid ${classColor}">
          <div class="carousel-character-avatar-placeholder" data-character-name="${character.name}" data-realm-slug="${realmSlug}">
            <i class="las la-spinner la-spin loading-spinner"></i>
          </div>
          <div class="carousel-character-info">
            <div class="carousel-character-name" style="color: ${classColor}">
              ${character.name}
              ${character.realm?.name ? `<span style="font-size: 0.8em; opacity: 0.7; display: block; font-weight: normal;">${character.realm.name}</span>` : ''}
            </div>
            <div class="carousel-character-class">${className}</div>
            <div class="carousel-character-level">Level ${character.level} • iLvl ${ilvl}</div>
            <div class="carousel-character-icons">
              <span class="carousel-icon-wrapper">
                <i class="las la-spinner la-spin loading-spinner"></i>
                <img src="${classIconUrl}" alt="${className}" class="carousel-icon"
                     onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                     onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localClassIconUrl}';" />
              </span>
              <span class="carousel-icon-wrapper">
                <i class="las la-spinner la-spin loading-spinner"></i>
                <img src="${raceIconUrl}" alt="Race" class="carousel-icon carousel-icon-race"
                     onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                     onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localRaceIconUrl}';" />
              </span>
              <span class="carousel-icon-wrapper">
                <i class="las la-spinner la-spin loading-spinner"></i>
                <img src="" alt="Spec" class="carousel-icon carousel-icon-spec" style="display:none;" />
              </span>
              <span class="carousel-icon-wrapper">
                <i class="las la-spinner la-spin loading-spinner"></i>
                <img src="${factionIconUrl}" alt="Faction" class="carousel-icon"
                     onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                     onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localFactionIconUrl}';" />
              </span>
            </div>
          </div>
        </div>
      `;
    }).join('');
  }

  attachCarouselEvents(modal) {
    const carousel = modal.querySelector('.character-carousel');
    const navLeft = modal.querySelector('.carousel-nav-left');
    const navRight = modal.querySelector('.carousel-nav-right');
    const carouselCharacters = carousel.querySelectorAll('.carousel-character');

    if (!carousel || !navLeft || !navRight) return;

    // Function to update arrow states
    const updateArrowStates = () => {
      const isAtStart = carousel.scrollLeft <= 0;
      const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;

      if (isAtStart) {
        navLeft.disabled = true;
        navLeft.style.opacity = '0.3';
        navLeft.style.cursor = 'not-allowed';
      } else {
        navLeft.disabled = false;
        navLeft.style.opacity = '1';
        navLeft.style.cursor = 'pointer';
      }

      if (isAtEnd) {
        navRight.disabled = true;
        navRight.style.opacity = '0.3';
        navRight.style.cursor = 'not-allowed';
      } else {
        navRight.disabled = false;
        navRight.style.opacity = '1';
        navRight.style.cursor = 'pointer';
      }
    };

    // Initial arrow state
    updateArrowStates();

    // Update arrow states on scroll
    carousel.addEventListener('scroll', updateArrowStates);

    // Scroll left - navigate to previous card and center it
    navLeft.addEventListener('click', async () => {
      if (!navLeft.disabled) {
        const currentActive = carousel.querySelector('.carousel-character.active');
        if (!currentActive) return;

        const allChars = Array.from(carouselCharacters);
        const currentIndex = allChars.indexOf(currentActive);

        if (currentIndex > 0) {
          const prevChar = allChars[currentIndex - 1];
          const characterName = prevChar.dataset.character;
          const realmSlug = prevChar.dataset.realm;

          // Update the character details in the modal
          await this.updateCharacterDetails(modal, realmSlug, characterName);

          // Update active state in carousel
          carouselCharacters.forEach(c => c.classList.remove('active'));
          prevChar.classList.add('active');

          // Scroll to center the newly selected character
          this.scrollCarouselToCenter(carousel, prevChar);
        }
      }
    });

    // Scroll right - navigate to next card and center it
    navRight.addEventListener('click', async () => {
      if (!navRight.disabled) {
        const currentActive = carousel.querySelector('.carousel-character.active');
        if (!currentActive) return;

        const allChars = Array.from(carouselCharacters);
        const currentIndex = allChars.indexOf(currentActive);

        if (currentIndex < allChars.length - 1) {
          const nextChar = allChars[currentIndex + 1];
          const characterName = nextChar.dataset.character;
          const realmSlug = nextChar.dataset.realm;

          // Update the character details in the modal
          await this.updateCharacterDetails(modal, realmSlug, characterName);

          // Update active state in carousel
          carouselCharacters.forEach(c => c.classList.remove('active'));
          nextChar.classList.add('active');

          // Scroll to center the newly selected character
          this.scrollCarouselToCenter(carousel, nextChar);
        }
      }
    });

    // Scroll active character to center initially (snap into place without animation)
    const activeChar = carousel.querySelector('.carousel-character.active');

    if (activeChar) {
      // Wait for layout to settle and images to start loading, then snap to center
      // Use requestAnimationFrame to ensure DOM is fully rendered, then add delay for images
      requestAnimationFrame(() => {
        setTimeout(() => {
          this.scrollCarouselToCenter(carousel, activeChar, true); // Pass true for instant snap
          updateArrowStates();
        }, 300); // Increased delay to allow images to load
      });
    }

    // Watch for carousel container resize and re-center active card
    const resizeObserver = new ResizeObserver(() => {
      const currentActive = carousel.querySelector('.carousel-character.active');
      if (currentActive) {
        // Re-center without smooth scrolling to avoid jarring animation during resize
        const carouselRect = carousel.getBoundingClientRect();
        const elementRect = currentActive.getBoundingClientRect();
        const elementRelativeLeft = elementRect.left - carouselRect.left + carousel.scrollLeft;
        const targetScrollLeft = elementRelativeLeft - (carouselRect.width / 2) + (elementRect.width / 2);

        carousel.scrollTo({
          left: targetScrollLeft,
          behavior: 'auto' // No animation during resize
        });
      }
    });
    resizeObserver.observe(carousel);

    // Click on carousel character to switch
    carouselCharacters.forEach(charElement => {
      charElement.addEventListener('click', async () => {
        const characterName = charElement.dataset.character;
        const realmSlug = charElement.dataset.realm;
        const isAlreadyActive = charElement.classList.contains('active');

        // If clicking on active character, just center it
        if (isAlreadyActive) {
          this.scrollCarouselToCenter(carousel, charElement);
          return;
        }

        // Update the character details in the modal
        await this.updateCharacterDetails(modal, realmSlug, characterName);

        // Update active state in carousel
        carouselCharacters.forEach(c => c.classList.remove('active'));
        charElement.classList.add('active');

        // Scroll to center the newly selected character
        this.scrollCarouselToCenter(carousel, charElement);
      });
    });

    // Keyboard controls for carousel
    const handleKeydown = async (e) => {
      // Only handle arrow keys when modal is open
      if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        e.preventDefault();

        const currentActive = carousel.querySelector('.carousel-character.active');
        if (!currentActive) return;

        const allChars = Array.from(carouselCharacters);
        const currentIndex = allChars.indexOf(currentActive);

        let nextIndex;
        if (e.key === 'ArrowLeft') {
          nextIndex = currentIndex > 0 ? currentIndex - 1 : currentIndex;
        } else {
          nextIndex = currentIndex < allChars.length - 1 ? currentIndex + 1 : currentIndex;
        }

        if (nextIndex !== currentIndex) {
          const nextChar = allChars[nextIndex];
          const characterName = nextChar.dataset.character;
          const realmSlug = nextChar.dataset.realm;

          // Update the character details in the modal
          await this.updateCharacterDetails(modal, realmSlug, characterName);

          // Update active state in carousel
          carouselCharacters.forEach(c => c.classList.remove('active'));
          nextChar.classList.add('active');

          // Scroll to center the newly selected character
          this.scrollCarouselToCenter(carousel, nextChar);
        }
      }
    };

    // Add keyboard listener
    document.addEventListener('keydown', handleKeydown);

    // Clean up keyboard listener and resize observer when modal is closed
    const modalCloseBtn = modal.querySelector('.modal-close');
    const originalRemove = modal.remove.bind(modal);
    modal.remove = () => {
      document.removeEventListener('keydown', handleKeydown);
      resizeObserver.disconnect();
      originalRemove();
    };

    if (modalCloseBtn) {
      modalCloseBtn.addEventListener('click', () => {
        document.removeEventListener('keydown', handleKeydown);
      });
    }
  }

  scrollCarouselToCenter(carousel, element, instant = false) {
    // Calculate perfect center position using getBoundingClientRect for accurate positioning
    // This automatically adjusts to any container width or card width changes
    const carouselRect = carousel.getBoundingClientRect();
    const elementRect = element.getBoundingClientRect();

    // Calculate the element's position relative to the carousel's scroll container
    const elementRelativeLeft = elementRect.left - carouselRect.left + carousel.scrollLeft;

    // Calculate scroll position to center the element
    // Center of carousel viewport should align with center of element
    const scrollPosition = elementRelativeLeft - (carouselRect.width / 2) + (elementRect.width / 2);

    carousel.scrollTo({
      left: scrollPosition,
      behavior: instant ? 'auto' : 'smooth' // Use 'auto' for instant snap, 'smooth' for animation
    });
  }

  async updateCharacterDetails(modal, realmSlug, characterName) {
    const modalTop = modal.querySelector('.character-modal-top');
    if (!modalTop) return;

    // Show loading state
    modalTop.innerHTML = `
      <div class="loading-spinner">
        <i class="las la-circle-notch la-spin la-3x"></i>
        <p>Loading character data...</p>
      </div>
    `;

    try {
      const data = await characterService.fetchFullCharacterData(realmSlug, characterName);
      const { profile, equipment, specs, media } = data;

      if (!profile) {
        modalTop.innerHTML = `
          <div class="error-message">
            <p>Character data not available</p>
          </div>
        `;
        return;
      }

      const classColor = getClassColor(profile.character_class.id);
      const className = getClassName(profile.character_class.id);
      const itemLevel = profile?.equipped_item_level || profile?.average_item_level || 'N/A';
      const activeSpec = specs ? characterService.getActiveSpec(specs) : null;

      // Get different media assets
      const avatar = media?.assets?.find(asset => asset.key === 'avatar')?.value || '';
      const inset = media?.assets?.find(asset => asset.key === 'inset')?.value || '';
      const mainRaw = media?.assets?.find(asset => asset.key === 'main-raw')?.value || '';
      const main = media?.assets?.find(asset => asset.key === 'main')?.value || '';
      const render = mainRaw || main || inset || avatar;

      const gender = profile.gender?.name || profile.gender?.type || 'Unknown';
      const equipmentHTML = this.renderEquipment(equipment);

      modalTop.innerHTML = `
        <div class="character-details-wrapper">
          <div class="character-details-left">
            <div class="character-details">
              <div class="character-header-section">
                ${render ? `<img src="${render}" alt="${profile.name}" class="character-render" />` : ''}
                <div class="character-title-info">
                  <h2 style="color: ${classColor}">${profile.name}</h2>
                  <div class="character-meta">
                    <span class="meta-badge" style="background-color: ${classColor}20; color: ${classColor}">
                      ${className}
                    </span>
                    <span class="meta-badge">${profile.race.name}</span>
                    <span class="meta-badge">${gender}</span>
                    ${profile.realm?.name ? `<span class="meta-badge" style="background-color: rgba(255, 255, 255, 0.1);"><i class="las la-server"></i> ${profile.realm.name}</span>` : ''}
                  </div>
                  <div class="character-detail-icons">
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                    <div class="detail-icon-wrapper">
                      <i class="las la-spinner la-spin loading-spinner"></i>
                    </div>
                  </div>
                </div>
              </div>
              <div class="character-info">
                <p><strong>Level:</strong> ${profile.level}</p>
                ${activeSpec ? `<p><strong>Spec:</strong> ${activeSpec.specialization?.name || 'N/A'}</p>` : ''}
                <p><strong>Item Level:</strong> ${itemLevel}</p>
                <p><strong>Achievement Points:</strong> ${formatNumber(profile.achievement_points || 0)}</p>
              </div>
            </div>
          </div>
          <div class="character-details-right">
            ${equipmentHTML}
          </div>
        </div>
      `;

      // Re-attach tooltip events for new equipment
      this.attachTooltipEvents();

      // Load character detail icons
      this.loadCharacterDetailIcons(modal, profile, activeSpec);

      // Load item thumbnails for new equipment
      this.loadItemThumbnails(modal, equipment);

    } catch (error) {
      modalTop.innerHTML = `
        <div class="error-message">
          <p>Failed to load character data</p>
        </div>
      `;
    }
  }

  async loadItemThumbnails(modal, equipment) {
    if (!equipment || !equipment.equipped_items) return;

    const items = equipment.equipped_items;
    const equipmentItems = modal.querySelectorAll('.equipment-item');

    console.log(`Loading thumbnails for ${equipmentItems.length} items`);

    for (let i = 0; i < equipmentItems.length && i < items.length; i++) {
      const itemElement = equipmentItems[i];
      const item = items[i];
      const mediaHref = itemElement.dataset.mediaHref;

      console.log(`Item ${i}: mediaHref = ${mediaHref}`);

      if (mediaHref && mediaHref !== '') {
        try {
          console.log(`Full mediaHref URL: ${mediaHref}`);

          // Fetch directly with auth token
          const token = battlenetClient.accessToken;
          if (!token) {
            console.error('No access token available');
            continue;
          }

          // Add locale to existing query string properly
          const separator = mediaHref.includes('?') ? '&' : '?';
          const fullUrl = `${mediaHref}${separator}locale=en_GB`;

          console.log(`Fetching from: ${fullUrl}`);

          const response = await fetch(fullUrl, {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          });

          console.log(`Response status: ${response.status}`);

          if (!response.ok) {
            console.error(`Failed to fetch media: ${response.status} ${response.statusText}`);
            continue;
          }

          const mediaData = await response.json();
          console.log(`Media data received:`, mediaData);

          const iconAsset = mediaData.assets?.find(asset => asset.key === 'icon');

          if (iconAsset?.value) {
            console.log(`Found icon URL: ${iconAsset.value}`);

            // Replace the loader with the actual image
            const wrapper = itemElement.querySelector('.item-icon-wrapper');
            const loader = wrapper.querySelector('.item-thumbnail-loader');

            if (loader) {
              loader.outerHTML = `
                <img src="${iconAsset.value}" alt="${item.name}" class="item-thumbnail"
                     onerror="this.style.display='none';" />
              `;
              console.log(`Replaced loader with image for item ${i}`);
            }
          }
        } catch (error) {
          console.error(`Failed to load item thumbnail for item ${i}:`, error);
          // Keep the fallback icon
        }
      } else {
        console.log(`No mediaHref for item ${i}`);
      }
    }
  }

  renderEquipment(equipment) {
    if (!equipment || !equipment.equipped_items || equipment.equipped_items.length === 0) {
      return '<div class="no-equipment"><p>No equipment data available</p></div>';
    }

    const items = equipment.equipped_items;

    // Debug: Log first item to see structure
    console.log('First equipment item structure:', items[0]);

    // Sort items by slot type for better display order
    const sortedItems = [...items].sort((a, b) => {
      const slotA = a.slot?.type || '';
      const slotB = b.slot?.type || '';
      return slotA.localeCompare(slotB);
    });

    const itemsHTML = sortedItems.map(item => {
      const quality = item.quality?.type || 1;
      const qualityColor = getItemQualityColor(quality);
      const slotName = getSlotName(item.slot?.type || 'UNKNOWN');
      const slotIcon = getSlotIcon(item.slot?.type || 'UNKNOWN');
      const itemLevel = item.level?.value || 0;
      const itemName = item.name || 'Unknown Item';

      // Get item thumbnail from media
      let itemThumbnail = null;

      // Debug: log media structure
      console.log(`Item ${itemName} media:`, item.media);

      // Check if media.key.href exists (this is a URL to fetch media from)
      if (item.media?.key?.href) {
        // The equipment endpoint should include media data, or we need to fetch it
        // For now, mark this item for async loading
        itemThumbnail = null; // We'll handle this below
      }

      // Try to get from media assets if already loaded
      if (item.media?.assets && Array.isArray(item.media.assets)) {
        const iconAsset = item.media.assets.find(asset => asset.key === 'icon');
        itemThumbnail = iconAsset?.value;
        console.log(`Found thumbnail for ${itemName}:`, itemThumbnail);
      }

      // Store item ID for async loading if needed
      const itemId = item.item?.id;
      const mediaHref = item.media?.key?.href;
      console.log(`Item ${itemName} - ID: ${itemId}, Media Href: ${mediaHref}`);

      // Prepare tooltip data
      const tooltipData = this.buildItemTooltipData(item, qualityColor);

      return `
        <div class="equipment-item" style="border-left: 3px solid ${qualityColor}"
             data-item-id="${itemId || ''}"
             data-media-href="${mediaHref || ''}"
             data-tooltip='${JSON.stringify(tooltipData).replace(/'/g, "&apos;")}'>
          <div class="item-icon-wrapper" style="border: 2px solid ${qualityColor}">
            ${itemThumbnail ? `
              <img src="${itemThumbnail}" alt="${itemName}" class="item-thumbnail"
                   onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';" />
              <div class="item-icon-fallback" style="display: none;">
                <i class="${slotIcon}"></i>
              </div>
            ` : `
              <div class="item-thumbnail-loader" style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; background: var(--color-bg-secondary);">
                <i class="${slotIcon}" style="font-size: 1.75rem; color: var(--color-text-light);"></i>
              </div>
            `}
          </div>
          <div class="equipment-slot">
            <span>${slotName}</span>
          </div>
          <div class="equipment-details">
            <div class="item-name" style="color: ${qualityColor}">${itemName}</div>
            <div class="item-level">iLvl ${itemLevel}</div>
          </div>
        </div>
      `;
    }).join('');

    return `
      <div class="character-equipment">
        <h3>Equipment</h3>
        <div class="equipment-grid">
          ${itemsHTML}
        </div>
      </div>
    `;
  }

  buildItemTooltipData(item, qualityColor) {
    const data = {
      name: item.name || 'Unknown Item',
      quality: item.quality?.name || 'Common',
      qualityColor: qualityColor,
      itemLevel: item.level?.value || 0,
      slot: item.slot?.name || item.slot?.type || 'Unknown',
      stats: [],
      sockets: []
    };

    // Extract stats
    if (item.stats && Array.isArray(item.stats)) {
      data.stats = item.stats.map(stat => ({
        type: stat.type?.name || stat.display?.display_string || 'Unknown Stat',
        value: stat.value || stat.display?.value || 0
      }));
    }

    // Extract sockets
    if (item.sockets && Array.isArray(item.sockets)) {
      data.sockets = item.sockets.map(socket => ({
        type: socket.socket_type?.name || 'Socket',
        item: socket.item?.name || null
      }));
    }

    // Durability
    if (item.durability) {
      data.durability = item.durability;
    }

    // Required level
    if (item.requirements?.level) {
      data.requiredLevel = item.requirements.level.display_string || item.requirements.level.value;
    }

    // Item class and subclass
    if (item.item_class) {
      data.itemClass = item.item_class.name;
    }
    if (item.item_subclass) {
      data.itemSubclass = item.item_subclass.name;
    }

    // Binding
    if (item.binding?.name) {
      data.binding = item.binding.name;
    }

    return data;
  }

  attachTooltipEvents() {
    const equipmentItems = document.querySelectorAll('.equipment-item[data-tooltip]');
    let tooltipElement = null;

    equipmentItems.forEach(item => {
      item.addEventListener('mouseenter', (e) => {
        const tooltipData = JSON.parse(item.dataset.tooltip);
        tooltipElement = this.createTooltip(tooltipData);
        document.body.appendChild(tooltipElement);
        this.positionTooltip(tooltipElement, e);
      });

      item.addEventListener('mousemove', (e) => {
        if (tooltipElement) {
          this.positionTooltip(tooltipElement, e);
        }
      });

      item.addEventListener('mouseleave', () => {
        if (tooltipElement) {
          tooltipElement.remove();
          tooltipElement = null;
        }
      });
    });
  }

  createTooltip(data) {
    const tooltip = document.createElement('div');
    tooltip.className = 'item-tooltip';
    tooltip.style.borderColor = data.qualityColor;

    let statsHTML = '';
    if (data.stats.length > 0) {
      statsHTML = '<div class="tooltip-stats">' +
        data.stats.map(stat => `<div class="tooltip-stat">+${stat.value} ${stat.type}</div>`).join('') +
        '</div>';
    }

    let socketsHTML = '';
    if (data.sockets.length > 0) {
      socketsHTML = '<div class="tooltip-sockets">' +
        data.sockets.map(socket => `<div class="tooltip-socket"><i class="las la-circle"></i> ${socket.item || socket.type}</div>`).join('') +
        '</div>';
    }

    let metaHTML = '';
    if (data.binding || data.itemClass || data.requiredLevel) {
      const metaParts = [];
      if (data.binding) metaParts.push(data.binding);
      if (data.itemClass) metaParts.push(data.itemClass);
      if (data.itemSubclass) metaParts.push(data.itemSubclass);
      if (data.requiredLevel) metaParts.push(`Requires Level ${data.requiredLevel}`);

      metaHTML = '<div class="tooltip-meta">' +
        metaParts.map(part => `<div>${part}</div>`).join('') +
        '</div>';
    }

    tooltip.innerHTML = `
      <div class="tooltip-header">
        <div class="tooltip-name" style="color: ${data.qualityColor}">${data.name}</div>
        <div class="tooltip-slot">${data.slot}</div>
      </div>
      <div class="tooltip-ilvl">Item Level ${data.itemLevel}</div>
      ${metaHTML}
      ${statsHTML}
      ${socketsHTML}
    `;

    return tooltip;
  }

  positionTooltip(tooltip, event) {
    const offset = 15;
    let x = event.clientX + offset;
    let y = event.clientY + offset;

    // Check if tooltip goes off screen
    const tooltipRect = tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    // Adjust horizontal position if needed
    if (x + tooltipRect.width > viewportWidth) {
      x = event.clientX - tooltipRect.width - offset;
    }

    // Adjust vertical position if needed
    if (y + tooltipRect.height > viewportHeight) {
      y = event.clientY - tooltipRect.height - offset;
    }

    tooltip.style.left = `${x}px`;
    tooltip.style.top = `${y}px`;
  }
}

export default GuildRoster;
