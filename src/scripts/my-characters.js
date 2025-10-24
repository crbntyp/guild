// My Characters Page - Shows user's WoW characters
import accountService from './services/account-service.js';
import authService from './services/auth.js';
import TopBar from './components/top-bar.js';
import BackgroundRotator from './components/background-rotator.js';
import CustomDropdown from './components/custom-dropdown.js';
import config from './config.js';

console.log('⚡ My Characters Page initialized');

// State management
let allCharacters = [];
let filteredCharacters = [];
let sortBy = 'ilvl'; // Default sort
let filterClass = null;
let sortDropdown = null;
let classDropdown = null;

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Initialize top bar (login)
  const topBar = new TopBar();
  await topBar.init();

  // Initialize background rotator
  const backgroundImages = [
    'img/bgs/bg-mulgore.jpg',
    'img/bgs/bg-tglades.jpg',
    'img/bgs/bg-eversong.jpg',
    'img/bgs/bg-shadowglen.jpg',
    'img/bgs/bg-suramar.jpg',
    'img/bgs/bg-echoisles.jpg',
    'img/bgs/bg-freach.jpg',
    'img/bgs/bg-dmorogh.jpg',
    'img/bgs/bg-goldshire.jpg',
    'img/bgs/bg-azuremyst.jpg',
    'img/bgs/bg-gilneas.jpg',
    'img/bgs/bg-wisle.jpg',
    'img/bgs/bg-durotar.jpg',
    'img/bgs/bg-kezan.jpg'
  ];

  const bgRotator = new BackgroundRotator(backgroundImages, 8000, 2000);
  bgRotator.init();

  // Check if user is logged in
  if (!authService.isAuthenticated()) {
    showNotAuthenticated();
    return;
  }

  // Load my characters
  await loadMyCharacters();
});

function showNotAuthenticated() {
  const container = document.getElementById('my-characters-container');
  container.innerHTML = `
    <div class="guild-header">
      <h2 style="color: var(--color-text);">My Characters</h2>
      <p style="color: var(--color-text-light); margin-top: var(--spacing-md);">
        Please log in with Battle.net to view your characters.
      </p>
    </div>
  `;
}

async function loadMyCharacters() {
  const container = document.getElementById('my-characters-container');

  // Show loading
  container.innerHTML = `
    <div class="loading-spinner">
      <i class="las la-circle-notch la-spin la-6x"></i>
      <p>Loading your characters...</p>
    </div>
  `;

  try {
    const characters = await accountService.getAccountCharacters();

    if (!characters || characters.length === 0) {
      container.innerHTML = `
        <div class="guild-header">
          <h2 style="color: var(--color-text);">My Characters</h2>
          <p style="color: var(--color-text-light); margin-top: var(--spacing-md);">
            No WoW characters found on this account.
          </p>
        </div>
      `;
      return;
    }

    // Format characters to match guild roster member structure
    const formattedCharacters = characters.map(char => ({
      character: {
        name: char.name,
        id: char.id,
        realm: {
          slug: char.realm.slug,
          name: char.realm.name || char.realm.slug
        },
        level: char.level,
        playable_class: {
          id: char.playable_class.id
        },
        playable_race: {
          id: char.playable_race.id
        },
        faction: {
          type: char.faction.type
        },
        itemLevel: null // Will be fetched separately
      },
      rank: 0 // Not applicable for personal characters
    }));

    // Store all characters
    allCharacters = formattedCharacters;

    // Apply filters and render
    applyFilters();

  } catch (error) {
    console.error('Error loading characters:', error);
    container.innerHTML = `
      <div class="error-message">
        <i class="las la-exclamation-triangle la-2x"></i>
        <p>Error loading your characters: ${error.message}</p>
        <button class="btn btn-primary" onclick="location.reload()">Retry</button>
      </div>
    `;
  }
}

function applyFilters() {
  // Start with all characters
  filteredCharacters = [...allCharacters];

  // Apply class filter
  if (filterClass) {
    filteredCharacters = filteredCharacters.filter(member =>
      member.character.playable_class.id === filterClass
    );
  }

  // Apply sorting
  filteredCharacters.sort((a, b) => {
    switch (sortBy) {
      case 'name':
        return a.character.name.localeCompare(b.character.name);
      case 'level':
        return b.character.level - a.character.level; // Descending
      case 'class':
        return a.character.playable_class.id - b.character.playable_class.id;
      case 'ilvl':
        return (b.character.itemLevel || 0) - (a.character.itemLevel || 0); // Descending
      default:
        return b.character.level - a.character.level;
    }
  });

  renderCharacters(filteredCharacters);
}

function setSortBy(value) {
  sortBy = value;
  applyFilters();
}

function setClassFilter(classId) {
  filterClass = classId;
  applyFilters();
}

function renderCharacters(characters) {
  const container = document.getElementById('my-characters-container');

  // Get battle tag from auth service
  const user = authService.getUser();
  const battleTag = user?.battletag || 'Your';

  const html = `
    <div class="guild-header">
      <h2 style="color: var(--color-primary);">${battleTag} Characters</h2>
      <div class="guild-header-subtitle">
        <span>${characters.length} character${characters.length !== 1 ? 's' : ''} found.</span> Some older unused characters will be suppressed.
      </div>
    </div>

    <div class="roster-controls">
      <div id="sort-dropdown-container"></div>
      <div id="class-dropdown-container"></div>
    </div>

    <div class="roster-grid">
      ${characters.map(member => createCharacterCard(member)).join('')}
    </div>
  `;

  container.innerHTML = html;

  // Initialize dropdowns
  initializeDropdowns();

  // Initialize character cards (load avatars and specs)
  initializeCharacterCards(characters);
}

function initializeDropdowns() {
  // Initialize Sort Dropdown
  const sortOptions = [
    { value: 'level', label: 'Sort by Level' },
    { value: 'ilvl', label: 'Sort by Item Level' },
    { value: 'name', label: 'Sort by Name' },
    { value: 'class', label: 'Sort by Class' }
  ];

  sortDropdown = new CustomDropdown({
    id: 'sort-dropdown',
    label: 'Sort By',
    options: sortOptions,
    selectedValue: sortBy,
    onChange: (value) => setSortBy(value)
  });

  const sortContainer = document.getElementById('sort-dropdown-container');
  if (sortContainer) {
    sortDropdown.attachToElement(sortContainer);
  }

  // Initialize Class Filter Dropdown
  const { getClassName } = getWowConstants();
  const { getClassIconUrl } = getWowIcons();

  const classCounts = new Map();
  allCharacters.forEach(member => {
    const classId = member.character.playable_class.id;
    classCounts.set(classId, (classCounts.get(classId) || 0) + 1);
  });

  const classOptions = [
    { value: '', label: 'View All Classes', icon: null, count: allCharacters.length }
  ];

  Array.from(classCounts.keys())
    .sort((a, b) => a - b)
    .forEach(classId => {
      classOptions.push({
        value: classId,
        label: getClassName(classId),
        icon: getClassIconUrl(classId),
        count: classCounts.get(classId)
      });
    });

  classDropdown = new CustomDropdown({
    id: 'class-dropdown',
    label: 'Filter by Class',
    options: classOptions,
    selectedValue: filterClass || '',
    onChange: (value) => {
      const classId = value === '' ? null : parseInt(value);
      setClassFilter(classId);
    }
  });

  const classContainer = document.getElementById('class-dropdown-container');
  if (classContainer) {
    classDropdown.attachToElement(classContainer);
  }
}

// Helper to get wow-constants functions
function getWowConstants() {
  return {
    getClassName: (classId) => {
      const names = {
        1: 'Warrior', 2: 'Paladin', 3: 'Hunter', 4: 'Rogue',
        5: 'Priest', 6: 'Death Knight', 7: 'Shaman', 8: 'Mage',
        9: 'Warlock', 10: 'Monk', 11: 'Druid', 12: 'Demon Hunter', 13: 'Evoker'
      };
      return names[classId] || 'Unknown';
    }
  };
}

// Helper to get wow-icons functions
function getWowIcons() {
  return {
    getClassIconUrl: (classId) => {
      return `https://wow.zamimg.com/images/wow/icons/large/classicon_${getWowConstants().getClassName(classId).toLowerCase()}.jpg`;
    }
  };
}

function createCharacterCard(member) {
  const character = member.character;
  const classColor = getClassColor(character.playable_class.id);
  const className = getClassName(character.playable_class.id);

  return `
    <div class="member-card"
         style="border: 0px solid ${classColor};"
         data-character="${character.name.toLowerCase()}"
         data-realm="${character.realm.slug}">

      <div class="member-level">
        ${character.level}<span class="member-ilvl">${character.itemLevel || '<i class="las la-spinner la-spin"></i>'}</span>
      </div>

      <div class="character-avatar-placeholder">
        <i class="las la-circle-notch la-spin loading-spinner"></i>
      </div>

      <div class="member-header">
        <div class="member-name" style="color: ${classColor};">
          ${character.name}
        </div>
        <div class="member-hero-talent"></div>
      </div>

      <div class="member-details">
        <div class="member-detail-row">
          <div class="member-icon class-icon-small class-icon-placeholder">
            <i class="las la-spinner la-spin loading-spinner"></i>
          </div>
        </div>
        <div class="member-detail-row">
          <div class="member-icon race-icon-small race-icon-placeholder">
            <i class="las la-spinner la-spin loading-spinner"></i>
          </div>
        </div>
        <div class="member-detail-row">
          <div class="member-icon spec-icon-small spec-icon-placeholder">
            <i class="las la-spinner la-spin"></i>
          </div>
        </div>
        <div class="member-detail-row">
          <div class="member-icon faction-icon-small faction-icon-placeholder">
            <i class="las la-spinner la-spin"></i>
          </div>
        </div>
      </div>

      <div class="member-realm-badge-container">
        <span class="member-realm-badge">${character.realm.name || character.realm.slug}</span>
      </div>
    </div>
  `;
}

async function initializeCharacterCards(characters) {
  // Import required utilities
  const { getClassIconUrl, getRaceIconUrl, getSpecIconUrl } = await import('./utils/wow-icons.js');

  // Reset counters
  itemLevelsLoaded = 0;
  totalCharacters = characters.length;

  for (const member of characters) {
    const character = member.character;
    const card = document.querySelector(`[data-character="${character.name.toLowerCase()}"][data-realm="${character.realm.slug}"]`);

    if (!card) continue;

    // Load avatar
    loadAvatar(card, character);

    // Load icons
    loadIcons(card, character);

    // Load spec data
    loadSpec(card, character);

    // Load item level (async, will trigger re-sort when done)
    loadItemLevel(card, character).then(() => {
      itemLevelsLoaded++;
      // Re-sort when all item levels are loaded and we're sorting by ilvl
      if (itemLevelsLoaded === totalCharacters && sortBy === 'ilvl') {
        console.log('✅ All item levels loaded, re-sorting by ilvl');
        reSortCards();
      }
    });

    // Add click handler to view character details
    card.style.cursor = 'pointer';
    card.addEventListener('click', () => {
      window.location.href = `character-details.html?character=${encodeURIComponent(character.name)}&realm=${encodeURIComponent(character.realm.slug)}`;
    });
  }
}

async function loadAvatar(card, character) {
  try {
    const characterService = (await import('./services/character-service.js')).default;
    const media = await characterService.fetchCharacterMedia(character.realm.slug, character.name);

    const placeholder = card.querySelector('.character-avatar-placeholder');
    if (!placeholder) return;

    if (media?.assets) {
      // Get inset image (or fallback to avatar)
      const insetAsset = media.assets.find(asset => asset.key === 'inset');
      const avatarAsset = media.assets.find(asset => asset.key === 'avatar');
      const imageUrl = insetAsset?.value || avatarAsset?.value;

      if (imageUrl) {
        const img = new Image();
        img.onload = () => {
          placeholder.innerHTML = `<img src="${imageUrl}" alt="${character.name}" class="character-avatar-img" />`;
        };
        img.onerror = () => {
          // Hide card on 403/404 (privacy settings or invalid character)
          card.style.display = 'none';
        };
        img.src = imageUrl;
      } else {
        // Hide card if no image URL
        card.style.display = 'none';
      }
    } else {
      // Hide card if no media assets
      card.style.display = 'none';
    }
  } catch (error) {
    // Hide card on error
    card.style.display = 'none';
  }
}

async function loadIcons(card, character) {
  const { getClassIconUrl, getRaceIconUrl, getFactionIconUrl } = await import('./utils/wow-icons.js');

  // Load class icon
  const classIconUrl = getClassIconUrl(character.playable_class.id);
  const classIconElement = card.querySelector('.class-icon-placeholder');
  if (classIconElement && classIconUrl) {
    classIconElement.innerHTML = `<img src="${classIconUrl}" class="icon-img" alt="Class" />`;
    classIconElement.classList.remove('class-icon-placeholder');
  }

  // Fetch gender from character profile API using user's access token
  try {
    const accessToken = authService.getAccessToken();
    if (!accessToken) {
      console.error('No access token available');
      throw new Error('Not authenticated');
    }

    // Fetch character profile directly with user's token
    const encodedName = encodeURIComponent(character.name.toLowerCase());
    const profileUrl = `${config.getApiUrl()}/profile/wow/character/${character.realm.slug}/${encodedName}?namespace=${config.api.namespace.profile}&locale=${config.api.locale}`;

    const response = await fetch(profileUrl, {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch profile: ${response.status}`);
    }

    const profile = await response.json();

    let gender = 'male'; // default
    if (profile?.gender?.type) {
      gender = profile.gender.type.toLowerCase(); // Convert "MALE" to "male", "FEMALE" to "female"
      console.log(`${character.name} gender: ${gender}`);
    }

    // Load race icon with correct gender
    const raceIconUrl = getRaceIconUrl(character.playable_race.id, gender);
    const raceIconElement = card.querySelector('.race-icon-placeholder');
    if (raceIconElement && raceIconUrl) {
      raceIconElement.innerHTML = `<img src="${raceIconUrl}" class="icon-img" alt="Race" />`;
      raceIconElement.classList.remove('race-icon-placeholder');
    }
  } catch (error) {
    console.error(`Error loading gender for ${character.name}:`, error);
    // Fallback to male
    const raceIconUrl = getRaceIconUrl(character.playable_race.id, 'male');
    const raceIconElement = card.querySelector('.race-icon-placeholder');
    if (raceIconElement && raceIconUrl) {
      raceIconElement.innerHTML = `<img src="${raceIconUrl}" class="icon-img" alt="Race" />`;
      raceIconElement.classList.remove('race-icon-placeholder');
    }
  }

  // Load faction icon
  const factionIconUrl = getFactionIconUrl(character.faction.type.toLowerCase());
  const factionIconElement = card.querySelector('.faction-icon-placeholder');
  if (factionIconElement && factionIconUrl) {
    factionIconElement.innerHTML = `<img src="${factionIconUrl}" class="icon-img" alt="Faction" />`;
    factionIconElement.classList.remove('faction-icon-placeholder');
  }
}

async function loadSpec(card, character) {
  try {
    const wowAPI = (await import('./api/wow-api.js')).default;
    const specs = await wowAPI.getCharacterSpecializations(character.realm.slug, character.name);

    console.log(`🔧 Spec data for ${character.name}:`, specs);

    if (specs?.active_specialization) {
      const { getSpecIconUrl } = await import('./utils/wow-icons.js');
      const specIconUrl = getSpecIconUrl(specs.active_specialization.id);

      console.log(`✅ Spec icon URL for ${character.name}:`, specIconUrl);

      // Load spec icon into placeholder
      const specIconElement = card.querySelector('.spec-icon-placeholder');
      console.log(`📍 Spec icon element found:`, !!specIconElement);

      if (specIconElement && specIconUrl) {
        specIconElement.innerHTML = `<img src="${specIconUrl}" class="icon-img" alt="Spec" />`;
        specIconElement.classList.remove('spec-icon-placeholder');
      }

      // Add hero talent name
      const heroTalentName = specs?.active_hero_talent_tree?.name;
      if (heroTalentName) {
        const heroTalentElement = card.querySelector('.member-hero-talent');
        if (heroTalentElement) {
          heroTalentElement.textContent = heroTalentName;
        }
      }
    } else {
      console.log(`❌ No active specialization for ${character.name}`);
    }
  } catch (error) {
    console.error(`Error loading spec for ${character.name}:`, error);
  }
}

async function loadItemLevel(card, character) {
  try {
    const characterService = (await import('./services/character-service.js')).default;
    const profile = await characterService.fetchCharacterProfile(character.realm.slug, character.name);

    const itemLevel = profile?.equipped_item_level || profile?.average_item_level;

    if (itemLevel) {
      // Update character object
      character.itemLevel = itemLevel;

      // Update DOM
      const ilvlElement = card.querySelector('.member-ilvl');
      if (ilvlElement) {
        ilvlElement.textContent = itemLevel;
      }
    } else {
      const ilvlElement = card.querySelector('.member-ilvl');
      if (ilvlElement) {
        ilvlElement.textContent = 'N/A';
      }
    }
  } catch (error) {
    console.error(`Error loading item level for ${character.name}:`, error);
    const ilvlElement = card.querySelector('.member-ilvl');
    if (ilvlElement) {
      ilvlElement.textContent = 'N/A';
    }
  }
}

// Track how many item levels have been loaded
let itemLevelsLoaded = 0;
let totalCharacters = 0;

function reSortCards() {
  // Sort DOM elements by item level without re-rendering
  const rosterGrid = document.querySelector('.roster-grid');
  if (!rosterGrid) return;

  // Get all member cards
  const cards = Array.from(rosterGrid.querySelectorAll('.member-card'));

  // Sort cards by item level (descending)
  cards.sort((a, b) => {
    const nameA = a.dataset.character;
    const realmA = a.dataset.realm;
    const charA = allCharacters.find(m =>
      m.character.name.toLowerCase() === nameA && m.character.realm.slug === realmA
    );

    const nameB = b.dataset.character;
    const realmB = b.dataset.realm;
    const charB = allCharacters.find(m =>
      m.character.name.toLowerCase() === nameB && m.character.realm.slug === realmB
    );

    const ilvlA = charA?.character.itemLevel || 0;
    const ilvlB = charB?.character.itemLevel || 0;
    return ilvlB - ilvlA; // Descending order (highest ilvl first)
  });

  // Re-append cards in sorted order (this moves them in the DOM)
  cards.forEach(card => rosterGrid.appendChild(card));

  console.log('🔄 Re-sorted cards by item level');
}

// Helper functions (imported from wow-constants)
function getClassColor(classId) {
  const colors = {
    1: '#C79C6E', 2: '#F58CBA', 3: '#ABD473', 4: '#FFF569',
    5: '#FFFFFF', 6: '#C41F3B', 7: '#0070DE', 8: '#40C7EB',
    9: '#8787ED', 10: '#00FF96', 11: '#FF7D0A', 12: '#A330C9', 13: '#33937F'
  };
  return colors[classId] || '#FFFFFF';
}

function getClassName(classId) {
  const names = {
    1: 'Warrior', 2: 'Paladin', 3: 'Hunter', 4: 'Rogue',
    5: 'Priest', 6: 'Death Knight', 7: 'Shaman', 8: 'Mage',
    9: 'Warlock', 10: 'Monk', 11: 'Druid', 12: 'Demon Hunter', 13: 'Evoker'
  };
  return names[classId] || 'Unknown';
}
