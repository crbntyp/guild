/**
 * IconLoader Service - Centralized icon loading with spinner management and fallbacks
 * Handles class, race, faction, spec, and item icons
 */

import wowAPI from '../api/wow-api.js';
import {
  getClassIconUrl,
  getRaceIconUrl,
  getSpecIconUrl,
  getFactionIconUrl,
  getLocalClassIconUrl,
  getLocalRaceIconUrl,
  getLocalSpecIconUrl,
  getLocalFactionIconUrl,
  getFallbackIcon
} from '../utils/wow-icons.js';

class IconLoader {
  /**
   * Load class icons for all placeholders
   * @param {string|NodeList} selector - CSS selector or NodeList of placeholders
   * @param {Object} options - Configuration options
   */
  static loadClassIcons(selector, options = {}) {
    const placeholders = typeof selector === 'string'
      ? document.querySelectorAll(selector)
      : selector;

    placeholders.forEach(placeholder => {
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
            <span class="member-icon-tooltip">${className}</span>
          `;
        }, 50);
      }
    });
  }

  /**
   * Load race and faction icons with batched API requests
   * @param {string|Element} containerSelector - Container to search for placeholders
   * @param {Object} options - Configuration options
   */
  static async loadRaceFactionIcons(containerSelector, options = {}) {
    const container = typeof containerSelector === 'string'
      ? document.querySelector(containerSelector)
      : containerSelector;

    if (!container) return;

    const raceIconsToLoad = new Map(); // Map of raceId+gender to list of placeholders
    const factionIconsToLoad = new Map(); // Map of raceId to list of placeholders

    // Collect all placeholders and group them by race/gender
    const memberCards = container.querySelectorAll('.member-card');

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
          if (raceIconUrl) {
            item.placeholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${raceIconUrl}" alt="${raceName}" class="icon-img"
                   onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                   onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localRaceIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
              <i class="${getFallbackIcon('race')}" style="display: none;"></i>
              <span class="member-icon-tooltip">${raceName}</span>
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
            item.placeholder.innerHTML = `
              <i class="las la-spinner la-spin loading-spinner"></i>
              <img src="${factionIconUrl}" alt="${factionName}" class="icon-img"
                   onload="if(this.previousElementSibling) this.previousElementSibling.style.display='none';"
                   onerror="this.onerror=null; if(this.previousElementSibling) this.previousElementSibling.style.display='none'; this.src='${localFactionIconUrl}'; this.onerror=function() { this.style.display='none'; this.nextElementSibling.style.display='flex'; };" />
              <i class="${getFallbackIcon('race')}" style="display: none;"></i>
              <span class="member-icon-tooltip">${factionName}</span>
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

  /**
   * Load specialization icons for all placeholders
   * @param {string|NodeList} selector - CSS selector or NodeList of placeholders
   * @param {Object} options - Configuration options
   * @returns {Promise<Map>} - Map of character keys to spec data
   */
  static async loadSpecIcons(selector, options = {}) {
    const {
      onSpecLoad = null, // Callback when spec loads: (characterKey, specData) => {}
      getCharacterKey = (name, realm) => `${name}-${realm}` // Function to generate character key
    } = options;

    const placeholders = typeof selector === 'string'
      ? document.querySelectorAll(selector)
      : selector;

    const specDataMap = new Map();

    // Load all specs in parallel
    await Promise.all(Array.from(placeholders).map(async (placeholder) => {
      const characterName = placeholder.dataset.character;
      const realmSlug = placeholder.dataset.realm;
      const card = placeholder.closest('.member-card');

      try {
        const specs = await wowAPI.getCharacterSpecializations(realmSlug, characterName);

        if (specs?.active_specialization) {
          const specId = specs.active_specialization.id;
          const specName = specs.active_specialization.name;
          const heroTalentName = specs?.active_hero_talent_tree?.name;
          const specIconUrl = getSpecIconUrl(specId);
          const localSpecIconUrl = getLocalSpecIconUrl(specId);

          // Store spec data
          const characterKey = getCharacterKey(characterName, realmSlug);
          const specData = {
            specId,
            specName,
            heroTalentName
          };
          specDataMap.set(characterKey, specData);

          // Call callback if provided
          if (onSpecLoad) {
            onSpecLoad(characterKey, specData);
          }

          // Update icon
          if (specIconUrl) {
            // Create image element with proper error handling
            const img = new Image();
            img.onload = () => {
              placeholder.innerHTML = `
                <img src="${specIconUrl}" alt="${specName}" class="icon-img" />
                <span class="member-icon-tooltip">${specName}</span>
              `;
              placeholder.classList.remove('spec-icon-placeholder');
            };
            img.onerror = () => {
              // Silently fail, leave placeholder as is
            };
            img.src = specIconUrl;
          }

          // Add hero talent name if present
          if (heroTalentName) {
            const heroTalentElement = card?.querySelector('.member-hero-talent');
            if (heroTalentElement) {
              heroTalentElement.textContent = heroTalentName;
            }
          }
        }
      } catch (error) {
        console.error(`Error loading spec for ${characterName}:`, error);
      }
    }));

    return specDataMap;
  }

  /**
   * Load item icons asynchronously
   * @param {Array} items - Sorted array of equipment items
   * @param {string|NodeList} selector - CSS selector or NodeList of item elements
   * @param {Object} options - Configuration options
   */
  static async loadItemIcons(items, selector, options = {}) {
    const {
      fallbackIcon = 'las la-shield-alt',
      slotOverlaySelector = '.modal-item-slot-overlay',
      ilvlOverlaySelector = '.modal-item-ilvl-overlay',
      iconContainerSelector = '.modal-item-icon',
      fetchItemMedia = async (itemId) => await wowAPI.getItemMedia(itemId)
    } = options;

    const itemElements = typeof selector === 'string'
      ? document.querySelectorAll(selector)
      : selector;

    for (let i = 0; i < itemElements.length && i < items.length; i++) {
      const itemElement = itemElements[i];
      const item = items[i];
      const itemId = item.item?.id;

      if (!itemId) {
        // No item ID, show fallback icon
        const iconContainer = itemElement.querySelector(iconContainerSelector);
        if (iconContainer) {
          // Preserve overlays
          const slotOverlay = iconContainer.querySelector(slotOverlaySelector);
          const ilvlOverlay = iconContainer.querySelector(ilvlOverlaySelector);

          const overlaysHTML = (slotOverlay ? slotOverlay.outerHTML : '') +
                               (ilvlOverlay ? ilvlOverlay.outerHTML : '');

          iconContainer.innerHTML = `<i class="${fallbackIcon}"></i>${overlaysHTML}`;
        }
        continue;
      }

      try {
        // Fetch item media from the API
        const mediaData = await fetchItemMedia(itemId);

        if (mediaData?.assets) {
          const iconAsset = mediaData.assets.find(asset => asset.key === 'icon');
          if (iconAsset?.value) {
            const iconContainer = itemElement.querySelector(iconContainerSelector);
            if (iconContainer) {
              // Preserve overlays
              const slotOverlay = iconContainer.querySelector(slotOverlaySelector);
              const ilvlOverlay = iconContainer.querySelector(ilvlOverlaySelector);

              const overlaysHTML = (slotOverlay ? slotOverlay.outerHTML : '') +
                                   (ilvlOverlay ? ilvlOverlay.outerHTML : '');

              iconContainer.innerHTML = `<img src="${iconAsset.value}" alt="${item.name}" />${overlaysHTML}`;
            }
          }
        }
      } catch (error) {
        // On error, show fallback icon
        const iconContainer = itemElement.querySelector(iconContainerSelector);
        if (iconContainer) {
          // Preserve overlays
          const slotOverlay = iconContainer.querySelector(slotOverlaySelector);
          const ilvlOverlay = iconContainer.querySelector(ilvlOverlaySelector);

          const overlaysHTML = (slotOverlay ? slotOverlay.outerHTML : '') +
                               (ilvlOverlay ? ilvlOverlay.outerHTML : '');

          iconContainer.innerHTML = `<i class="${fallbackIcon}"></i>${overlaysHTML}`;
        }
      }
    }
  }
}

export default IconLoader;
