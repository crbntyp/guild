// Character Details Page
import characterService from './services/character-service.js';
import guildService from './services/guild-service.js';
import TopBar from './components/top-bar.js';
import { getClassColor, getClassName } from './utils/wow-constants.js';
import { formatNumber } from './utils/helpers.js';
import { getItemQualityColor, getSlotName, getSlotIcon } from './utils/item-quality.js';
import { getClassIconUrl, getLocalClassIconUrl, getRaceIconUrl, getLocalRaceIconUrl, getFactionIconUrl, getLocalFactionIconUrl, getSpecIconUrl, getLocalSpecIconUrl, getFallbackIcon } from './utils/wow-icons.js';
import battlenetClient from './api/battlenet-client.js';
import config from './config.js';

console.log('⚡ Character Details Page initialized');

// Initialize top bar (login)
document.addEventListener('DOMContentLoaded', () => {
  new TopBar();
});

// Race-specific background mapping
const raceBackgrounds = {
  'human': '../img/bgs/bg-goldshire.jpg',
  'dwarf': '../img/bgs/bg-dmorogh.jpg',
  'night elf': '../img/bgs/bg-shadowglen.jpg',
  'gnome': '../img/bgs/bg-dmorogh.jpg',
  'draenei': '../img/bgs/bg-azuremyst.jpg',
  'worgen': '../img/bgs/bg-gilneas.jpg',
  'orc': '../img/bgs/bg-durotar.jpg',
  'undead': '../img/bgs/bg-tglades.jpg',
  'tauren': '../img/bgs/bg-mulgore.jpg',
  'troll': '../img/bgs/bg-echoisles.jpg',
  'blood elf': '../img/bgs/bg-eversong.jpg',
  'goblin': '../img/bgs/bg-kezan.jpg',
  'pandaren': '../img/bgs/bg-wisle.jpg',
  'nightborne': '../img/bgs/bg-suramar.jpg',
  'void elf': '../img/bgs/bg-tglades.jpg',
  'lightforged draenei': '../img/bgs/bg-azuremyst.jpg',
  'dark iron dwarf': '../img/bgs/bg-dmorogh.jpg',
  'kul tiran': '../img/bgs/bg-goldshire.jpg',
  'mechagnome': '../img/bgs/bg-dmorogh.jpg',
  'highmountain tauren': '../img/bgs/bg-mulgore.jpg',
  'mag\'har orc': '../img/bgs/bg-durotar.jpg',
  'zandalari troll': '../img/bgs/bg-echoisles.jpg',
  'vulpera': '../img/bgs/bg-durotar.jpg',
  'dracthyr': '../img/bgs/bg-freach.jpg',
  'default': '../img/bgs/bg-tglades.jpg'
};

function setRaceBackground(raceName) {
  const detailsPage = document.querySelector('.character-details-page');
  if (!detailsPage) {
    console.error('Character details page element not found');
    return;
  }

  const backgroundImage = raceBackgrounds[raceName] || raceBackgrounds['default'];
  console.log(`Setting background for race: ${raceName} -> ${backgroundImage}`);

  // Set data attribute for CSS to use
  detailsPage.setAttribute('data-race', raceName);
  detailsPage.style.setProperty('--race-background', `url('${backgroundImage}')`);

  console.log('Background set, CSS variable:', getComputedStyle(detailsPage).getPropertyValue('--race-background'));
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Get character info from URL parameters
  const urlParams = new URLSearchParams(window.location.search);
  const characterName = urlParams.get('character');
  const realmSlug = urlParams.get('realm');

  if (!characterName || !realmSlug) {
    showError('Character information not found in URL');
    return;
  }

  // Load character data
  await loadCharacterDetails(characterName, realmSlug);
});

async function loadCharacterDetails(characterName, realmSlug) {
  const container = document.getElementById('character-details-container');

  try {
    const data = await characterService.fetchFullCharacterData(realmSlug, characterName);
    renderCharacterDetails(container, data, realmSlug);
  } catch (error) {
    console.error('Failed to load character data:', error);
    showError('Failed to load character data');
  }
}

function showError(message) {
  const container = document.getElementById('character-details-container');
  container.innerHTML = `
    <div class="error-message">
      <i class="las la-exclamation-triangle la-2x"></i>
      <p>${message}</p>
      <button class="btn btn-primary" onclick="history.back()">Go Back</button>
    </div>
  `;
}

function renderCharacterDetails(container, data, realmSlug) {
  const { profile, equipment, specs, media } = data;

  if (!profile) {
    showError('Character data not available');
    return;
  }

  const classColor = getClassColor(profile.character_class.id);
  const className = getClassName(profile.character_class.id);
  const itemLevel = profile?.equipped_item_level || profile?.average_item_level || 'N/A';
  const activeSpec = specs ? characterService.getActiveSpec(specs) : null;

  // Get hero talent name
  const heroTalentName = specs?.active_hero_talent_tree?.name || null;

  // Get different media assets
  const avatar = media?.assets?.find(asset => asset.key === 'avatar')?.value || '';
  const inset = media?.assets?.find(asset => asset.key === 'inset')?.value || '';
  const mainRaw = media?.assets?.find(asset => asset.key === 'main-raw')?.value || '';
  const main = media?.assets?.find(asset => asset.key === 'main')?.value || '';
  const render = mainRaw || main || inset || avatar;

  const gender = profile.gender?.name || profile.gender?.type || 'Unknown';
  const equipmentHTML = renderEquipment(equipment);
  const carouselHTML = renderCharacterCarousel(profile.name, realmSlug);

  // Set race-specific background
  const raceName = profile.race?.name?.toLowerCase() || 'default';
  setRaceBackground(raceName);

  container.innerHTML = `
    <div class="character-details-top">
      <div class="character-details-wrapper">
        <div class="character-details-left">
          <div class="character-details">
            <div class="character-header-section">
              ${render ? `<img src="${render}" alt="${profile.name}" class="character-render" onerror="this.src='img/character-fallback.svg';" />` : '<img src="img/character-fallback.svg" alt="${profile.name}" class="character-render" />'}
              <div class="character-title-info">
                <h2 style="color: ${classColor}">${profile.name}</h2>
                <div class="character-meta">
                  <span class="meta-badge" style="background-color: ${classColor}20; color: ${classColor}">
                    ${className}
                  </span>
                  ${heroTalentName ? `<span class="meta-badge" style="background-color: rgba(255, 215, 0, 0.2); color: #FFD700; border: 1px solid #FFD700;">
                    <i class="las la-star"></i> ${heroTalentName}
                  </span>` : ''}
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
          <div class="character-details">
            ${equipmentHTML}
          </div>
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

  // Load character detail icons
  loadCharacterDetailIcons(profile, activeSpec);

  // Attach tooltip events
  attachTooltipEvents();

  // Attach carousel events
  attachCarouselEvents();

  // Load carousel character images asynchronously
  loadCarouselCharacterImages();

  // Load carousel spec icons
  loadCarouselSpecIcons();

  // Load item thumbnails asynchronously
  loadItemThumbnails(equipment);
}

function renderEquipment(equipment) {
  if (!equipment || !equipment.equipped_items || equipment.equipped_items.length === 0) {
    return '<div class="no-equipment"><p>No equipment data available</p></div>';
  }

  const items = equipment.equipped_items;

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

    // Try to get from media assets if already loaded
    if (item.media?.assets && Array.isArray(item.media.assets)) {
      const iconAsset = item.media.assets.find(asset => asset.key === 'icon');
      itemThumbnail = iconAsset?.value;
    }

    // Store item ID for async loading if needed
    const itemId = item.item?.id;
    const mediaHref = item.media?.key?.href;

    // Prepare tooltip data
    const tooltipData = buildItemTooltipData(item, qualityColor);

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

function renderCharacterCarousel(currentCharacterName, currentRealmSlug) {
  // Get roster from guild service (need to load it first)
  const roster = guildService.getRosterMembers({ sortBy: 'name' });

  if (!roster || roster.length === 0) {
    return '<p>Loading other characters...</p>';
  }

  const currentCharacterKey = `${currentCharacterName.toLowerCase()}-${currentRealmSlug}`;

  return roster.map(member => {
    const character = member.character;
    const classColor = getClassColor(character.playable_class.id);
    const className = getClassName(character.playable_class.id);
    const realmSlug = character.realm?.slug || config.guild.realmSlug;
    const characterKey = `${character.name.toLowerCase()}-${realmSlug}`;
    const isActive = characterKey === currentCharacterKey;
    const classIconUrl = getClassIconUrl(character.playable_class.id);
    const localClassIconUrl = getLocalClassIconUrl(character.playable_class.id);

    const raceIconUrl = getRaceIconUrl(character.playable_race?.id, 'MALE');
    const localRaceIconUrl = getLocalRaceIconUrl(character.playable_race?.id, 'MALE');

    const isAlliance = character.faction?.type === 'ALLIANCE';
    const factionIconUrl = getFactionIconUrl(isAlliance);
    const localFactionIconUrl = getLocalFactionIconUrl(isAlliance);

    return `
      <div class="carousel-character ${isActive ? 'active' : ''}"
           data-character="${character.name}"
           data-realm="${realmSlug}"
           onclick="window.location.href='character-details.html?character=${encodeURIComponent(character.name)}&realm=${encodeURIComponent(realmSlug)}'"
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
          <div class="carousel-character-level">Level ${character.level}</div>
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

// Helper functions (copied from guild-roster.js)
function buildItemTooltipData(item, qualityColor) {
  const data = {
    name: item.name || 'Unknown Item',
    quality: item.quality?.name || 'Common',
    qualityColor: qualityColor,
    itemLevel: item.level?.value || 0,
    slot: item.slot?.name || item.slot?.type || 'Unknown',
    stats: [],
    sockets: []
  };

  if (item.stats && Array.isArray(item.stats)) {
    data.stats = item.stats.map(stat => ({
      type: stat.type?.name || stat.display?.display_string || 'Unknown Stat',
      value: stat.value || stat.display?.value || 0
    }));
  }

  if (item.sockets && Array.isArray(item.sockets)) {
    data.sockets = item.sockets.map(socket => ({
      type: socket.socket_type?.name || 'Socket',
      item: socket.item?.name || null
    }));
  }

  if (item.durability) {
    data.durability = item.durability;
  }

  if (item.requirements?.level) {
    data.requiredLevel = item.requirements.level.display_string || item.requirements.level.value;
  }

  if (item.item_class) {
    data.itemClass = item.item_class.name;
  }
  if (item.item_subclass) {
    data.itemSubclass = item.item_subclass.name;
  }

  if (item.binding?.name) {
    data.binding = item.binding.name;
  }

  return data;
}

function attachTooltipEvents() {
  const equipmentItems = document.querySelectorAll('.equipment-item[data-tooltip]');
  let tooltipElement = null;

  equipmentItems.forEach(item => {
    item.addEventListener('mouseenter', (e) => {
      const tooltipData = JSON.parse(item.dataset.tooltip);
      tooltipElement = createTooltip(tooltipData);
      document.body.appendChild(tooltipElement);
      positionTooltip(tooltipElement, e);
    });

    item.addEventListener('mousemove', (e) => {
      if (tooltipElement) {
        positionTooltip(tooltipElement, e);
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

function createTooltip(data) {
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

function positionTooltip(tooltip, event) {
  const offset = 15;
  let x = event.clientX + offset;
  let y = event.clientY + offset;

  const tooltipRect = tooltip.getBoundingClientRect();
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (x + tooltipRect.width > viewportWidth) {
    x = event.clientX - tooltipRect.width - offset;
  }

  if (y + tooltipRect.height > viewportHeight) {
    y = event.clientY - tooltipRect.height - offset;
  }

  tooltip.style.left = `${x}px`;
  tooltip.style.top = `${y}px`;
}

function loadCharacterDetailIcons(profile, activeSpec) {
  const iconContainer = document.querySelector('.character-detail-icons');
  if (!iconContainer) return;

  const iconWrappers = iconContainer.querySelectorAll('.detail-icon-wrapper');
  if (iconWrappers.length !== 4) return;

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

  if (classIconUrl) {
    iconWrappers[0].innerHTML = `
      <i class="las la-spinner la-spin loading-spinner"></i>
      <img src="${classIconUrl}" alt="${className}" class="detail-icon"
           onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
           onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localClassIconUrl}';" />
    `;
  }

  if (raceIconUrl) {
    iconWrappers[1].innerHTML = `
      <i class="las la-spinner la-spin loading-spinner"></i>
      <img src="${raceIconUrl}" alt="Race" class="detail-icon"
           onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
           onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localRaceIconUrl}';" />
    `;
  }

  if (specIconUrl) {
    iconWrappers[2].innerHTML = `
      <i class="las la-spinner la-spin loading-spinner"></i>
      <img src="${specIconUrl}" alt="${specName}" class="detail-icon"
           onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
           onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localSpecIconUrl}';" />
    `;
  }

  if (factionIconUrl) {
    iconWrappers[3].innerHTML = `
      <i class="las la-spinner la-spin loading-spinner"></i>
      <img src="${factionIconUrl}" alt="${factionName}" class="detail-icon"
           onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
           onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localFactionIconUrl}';" />
    `;
  }
}

async function loadCarouselCharacterImages() {
  const carouselPlaceholders = document.querySelectorAll('.carousel-character-avatar-placeholder');

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
        // Skip errors silently
      }
    }));

    if (i + batchSize < placeholdersArray.length) {
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
}

async function loadCarouselSpecIcons() {
  const carouselCharacters = document.querySelectorAll('.carousel-character');

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
      // Skip errors silently
    }
  }
}

function attachCarouselEvents() {
  const carousel = document.querySelector('.character-carousel');
  const navLeft = document.querySelector('.carousel-nav-left');
  const navRight = document.querySelector('.carousel-nav-right');

  if (!carousel || !navLeft || !navRight) return;

  const updateArrowStates = () => {
    const isAtStart = carousel.scrollLeft <= 0;
    const isAtEnd = carousel.scrollLeft + carousel.clientWidth >= carousel.scrollWidth - 1;

    navLeft.disabled = isAtStart;
    navLeft.style.opacity = isAtStart ? '0.3' : '1';
    navLeft.style.cursor = isAtStart ? 'not-allowed' : 'pointer';

    navRight.disabled = isAtEnd;
    navRight.style.opacity = isAtEnd ? '0.3' : '1';
    navRight.style.cursor = isAtEnd ? 'not-allowed' : 'pointer';
  };

  updateArrowStates();
  carousel.addEventListener('scroll', updateArrowStates);

  navLeft.addEventListener('click', () => {
    if (!navLeft.disabled) {
      carousel.scrollBy({ left: -240, behavior: 'smooth' });
    }
  });

  navRight.addEventListener('click', () => {
    if (!navRight.disabled) {
      carousel.scrollBy({ left: 240, behavior: 'smooth' });
    }
  });

  // Scroll active character into view
  setTimeout(() => {
    const activeChar = carousel.querySelector('.carousel-character.active');
    if (activeChar) {
      activeChar.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
    }
  }, 500);
}

async function loadItemThumbnails(equipment) {
  if (!equipment || !equipment.equipped_items) return;

  const items = equipment.equipped_items;
  const equipmentItems = document.querySelectorAll('.equipment-item');

  for (let i = 0; i < equipmentItems.length && i < items.length; i++) {
    const itemElement = equipmentItems[i];
    const item = items[i];
    const mediaHref = itemElement.dataset.mediaHref;

    if (mediaHref && mediaHref !== '') {
      try {
        const token = battlenetClient.accessToken;
        if (!token) {
          console.error('No access token available');
          continue;
        }

        const separator = mediaHref.includes('?') ? '&' : '?';
        const fullUrl = `${mediaHref}${separator}locale=en_GB`;

        const response = await fetch(fullUrl, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (!response.ok) {
          console.error(`Failed to fetch media: ${response.status} ${response.statusText}`);
          continue;
        }

        const mediaData = await response.json();

        const iconAsset = mediaData.assets?.find(asset => asset.key === 'icon');

        if (iconAsset?.value) {
          const wrapper = itemElement.querySelector('.item-icon-wrapper');
          const loader = wrapper.querySelector('.item-thumbnail-loader');

          if (loader) {
            loader.outerHTML = `
              <img src="${iconAsset.value}" alt="${item.name}" class="item-thumbnail"
                   onerror="this.style.display='none';" />
            `;
          }
        }
      } catch (error) {
        console.error(`Failed to load item thumbnail for item ${i}:`, error);
      }
    }
  }
}

// Initialize guild service on page load to get roster for carousel
guildService.fetchGuildRoster().catch(error => {
  console.error('Failed to load guild roster for carousel:', error);
});
