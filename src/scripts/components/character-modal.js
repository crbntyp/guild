/**
 * Character Modal Component
 * Displays character details and equipment in a modal popup
 */

import characterService from '../services/character-service.js';
import wowAPI from '../api/wow-api.js';
import battlenetClient from '../api/battlenet-client.js';
import { getClassColor, getClassName } from '../utils/wow-constants.js';
import { getItemQualityColor, getSlotName } from '../utils/item-quality.js';
import { getClassIconUrl, getRaceIconUrl, getSpecIconUrl, getFactionIconUrl, getFallbackIcon } from '../utils/wow-icons.js';
import { slugToFriendly } from '../utils/helpers.js';
import IconLoader from '../services/icon-loader.js';
import config from '../config.js';
import customTooltip from '../services/custom-tooltip.js';

class CharacterModal {
  constructor() {
    this.modal = null;
    this.characterService = characterService;
    this.currentCharacter = null;
  }

  /**
   * Initialize the modal
   */
  init() {
    this.createModalHTML();
    this.attachEventListeners();
    customTooltip.init();
  }

  /**
   * Create modal HTML structure
   */
  createModalHTML() {
    const modalHTML = `
      <div class="character-modal" id="character-modal">
        <div class="character-modal-overlay"></div>
        <div class="character-modal-wrapper">
          <div class="character-modal-content">
            <button class="character-modal-close">
              <i class="las la-times"></i>
            </button>
            <div class="character-modal-body">
              <!-- Character card will be inserted here -->
            </div>
          </div>
        </div>
      </div>
    `;

    // Add to body if not exists
    if (!document.getElementById('character-modal')) {
      document.body.insertAdjacentHTML('beforeend', modalHTML);
    }

    this.modal = document.getElementById('character-modal');
  }

  /**
   * Attach event listeners
   */
  attachEventListeners() {
    // Close on X button
    const closeBtn = this.modal.querySelector('.character-modal-close');
    closeBtn.addEventListener('click', () => this.close());

    // Close on overlay click
    const overlay = this.modal.querySelector('.character-modal-overlay');
    overlay.addEventListener('click', () => this.close());

    // Close on Escape key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && this.modal.classList.contains('active')) {
        this.close();
      }
    });
  }

  /**
   * Open modal with character data
   */
  async open(characterName, realmSlug, region = 'eu') {
    this.modal.classList.add('active');
    document.body.style.overflow = 'hidden';

    // Show loading state
    const modalBody = this.modal.querySelector('.character-modal-body');
    modalBody.innerHTML = `
      <div class="modal-loading">
        <i class="las la-circle-notch la-spin"></i>
        <p>Loading character...</p>
      </div>
    `;

    try {
      // Fetch full character data
      const data = await this.characterService.fetchFullCharacterData(realmSlug, characterName);

      if (!data) {
        throw new Error('Failed to load character data');
      }

      this.currentCharacter = data;
      this.renderCharacter(data);
    } catch (error) {
      console.error('Error loading character modal:', error);
      modalBody.innerHTML = `
        <div class="modal-error">
          <i class="las la-exclamation-triangle"></i>
          <p>Failed to load character data</p>
        </div>
      `;
    }
  }

  /**
   * Close modal
   */
  close() {
    this.modal.classList.remove('active');
    document.body.style.overflow = '';
    this.currentCharacter = null;
  }

  /**
   * Render character in modal
   */
  renderCharacter(data) {
    const { profile, equipment, specs, media } = data;
    const character = profile.character || profile;
    const classId = character.character_class?.id || character.class?.id;
    const classColor = getClassColor(classId);
    const className = character.character_class?.name || character.class?.name || getClassName(classId);

    const modalBody = this.modal.querySelector('.character-modal-body');

    // Get active spec and hero talent
    const activeSpec = specs?.active_specialization;
    const heroTalentName = specs?.active_hero_talent_tree?.name || '';

    // Get spec ID from the active spec
    const specId = activeSpec?.id || null;

    // Get character avatar from media
    const avatarUrl = media?.assets?.find(asset => asset.key === 'inset')?.value ||
                     media?.assets?.find(asset => asset.key === 'avatar')?.value ||
                     profile.avatar_url || '';

    // Get realm name
    const realmName = slugToFriendly(character.realm?.slug || character.realm?.name || character.realm || '');

    // Get gender for race icon
    const gender = character.gender?.type || 'MALE';
    const raceIconUrl = getRaceIconUrl(character.race?.id, gender);
    const classIconUrl = getClassIconUrl(classId);
    const specIconUrl = specId ? getSpecIconUrl(specId) : null;

    // Faction icon - getFactionIconUrl expects boolean (isAlliance)
    const isAlliance = character.faction?.type === 'ALLIANCE';
    const factionIconUrl = getFactionIconUrl(isAlliance);

    modalBody.innerHTML = `
      <div class="modal-character-card">
        ${character.rank === 0 ? '<i class="las la-crown guildmaster-crown"></i>' : ''}

        <div class="modal-member-level">
          ${character.level}<span class="modal-member-ilvl">${character.equipped_item_level || character.average_item_level || '?'}</span>
        </div>

        <div class="modal-avatar-container">
          <img src="${avatarUrl}" alt="${character.name}" class="modal-character-avatar" />
        </div>

        <div class="modal-member-header">
          <div class="modal-member-name" style="color: ${classColor}">
            ${character.name}
          </div>
          <div class="modal-member-hero-talent">${heroTalentName}</div>
        </div>

        <div class="modal-member-details">
          <div class="modal-member-detail-row">
            <div class="modal-member-icon">
              ${classIconUrl ? `<img src="${classIconUrl}" alt="${className}" class="icon-img" />` : '<i class="las la-question"></i>'}
              <span class="modal-icon-tooltip">${className}</span>
            </div>
          </div>
          <div class="modal-member-detail-row">
            <div class="modal-member-icon">
              ${raceIconUrl ? `<img src="${raceIconUrl}" alt="${character.race?.name || ''}" class="icon-img" />` : '<i class="las la-question"></i>'}
              <span class="modal-icon-tooltip">${character.race?.name || 'Unknown'}</span>
            </div>
          </div>
          <div class="modal-member-detail-row">
            <div class="modal-member-icon">
              ${specIconUrl ? `<img src="${specIconUrl}" alt="${activeSpec?.name || ''}" class="icon-img" />` : '<i class="las la-question"></i>'}
              <span class="modal-icon-tooltip">${activeSpec?.name || 'Specialization'}</span>
            </div>
          </div>
          <div class="modal-member-detail-row">
            <div class="modal-member-icon">
              ${factionIconUrl ? `<img src="${factionIconUrl}" alt="${character.faction?.name || ''}" class="icon-img" />` : '<i class="las la-question"></i>'}
              <span class="modal-icon-tooltip">${character.faction?.name || 'Faction'}</span>
            </div>
          </div>
        </div>

        <div class="modal-member-realm-badge-container">
          <div class="modal-member-realm-badge">${realmName}</div>
        </div>

        <div class="modal-content-panes">
          <div class="modal-content-pane active" data-pane="equipment">
            <h3>Equipment</h3>
            ${this.renderEquipment(equipment)}
          </div>

          <div class="modal-content-pane" data-pane="enchants">
            <h3>Enchants & Sockets</h3>
            ${this.renderEnchantsAndSockets(equipment)}
          </div>

          <div class="modal-content-pane" data-pane="raids">
            <div class="modal-raid-progress">
              <h3>Raid Progression</h3>
              <div class="raid-progress-loading">
                <i class="las la-circle-notch la-spin"></i>
                <span>Loading...</span>
              </div>
            </div>
          </div>

          <div class="modal-content-pane" data-pane="mythicplus">
            <div class="modal-mythic-plus">
              <h3>Mythic+ Progression</h3>
              <div class="mythic-plus-loading">
                <i class="las la-circle-notch la-spin"></i>
                <span>Loading...</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    // Add tab buttons to the wrapper
    const modalWrapper = this.modal.querySelector('.character-modal-wrapper');

    // Remove existing buttons if any
    const existingButtons = this.modal.querySelector('.modal-tab-buttons-external');
    if (existingButtons) {
      existingButtons.remove();
    }

    // Insert buttons inside the wrapper
    const buttonsHTML = `
      <div class="modal-tab-buttons-external">
        <button class="modal-tab-btn active" data-tab="equipment">
          <i class="las la-user-shield"></i>
          <span class="modal-tab-tooltip">Equipment</span>
        </button>
        <button class="modal-tab-btn" data-tab="enchants">
          <i class="las la-flask"></i>
          <span class="modal-tab-tooltip">Enchants & Gems</span>
        </button>
        <button class="modal-tab-btn" data-tab="raids">
           <i class="las la-dragon"></i>
           <span class="modal-tab-tooltip">Raid Progression</span>
        </button>
        <button class="modal-tab-btn" data-tab="mythicplus">
           <i class="las la-key"></i>
           <span class="modal-tab-tooltip">Mythic+</span>
        </button>
      </div>
    `;
    modalWrapper.insertAdjacentHTML('beforeend', buttonsHTML);

    // Initialize tab switching
    this.initializeTabSwitching();

    // Load item icons, enchant icons, raid progression, and M+ progression
    this.loadItemIcons(equipment);
    this.loadEnchantIcons();
    this.loadRaidProgression(character.realm?.slug || realm, character.name);
    this.loadMythicPlusProgression(character.realm?.slug || realm, character.name);

    // Refresh Wowhead tooltips after modal loads
    setTimeout(() => {
      if (window.$WowheadPower) {
        window.$WowheadPower.refreshLinks();
      }
    }, 100);
  }

  /**
   * Initialize tab switching functionality
   */
  initializeTabSwitching() {
    const tabButtons = this.modal.querySelectorAll('.modal-tab-btn');
    const panes = this.modal.querySelectorAll('.modal-content-pane');

    tabButtons.forEach(button => {
      button.addEventListener('click', () => {
        const targetTab = button.dataset.tab;

        // Remove active class from all buttons and panes
        tabButtons.forEach(btn => btn.classList.remove('active'));
        panes.forEach(pane => pane.classList.remove('active'));

        // Add active class to clicked button and corresponding pane
        button.classList.add('active');
        const targetPane = this.modal.querySelector(`.modal-content-pane[data-pane="${targetTab}"]`);
        if (targetPane) {
          targetPane.classList.add('active');
        }
      });
    });
  }

  /**
   * Render equipment list
   */
  renderEquipment(equipment) {
    if (!equipment || !equipment.equipped_items || equipment.equipped_items.length === 0) {
      return '<div class="no-equipment"><p>No equipment data available</p></div>';
    }

    const items = equipment.equipped_items;

    // Slot order for display
    const slotOrder = {
      'HEAD': 1, 'NECK': 2, 'SHOULDER': 3, 'BACK': 4, 'CHEST': 5,
      'WRIST': 6, 'HANDS': 7, 'WAIST': 8, 'LEGS': 9, 'FEET': 10,
      'FINGER_1': 11, 'FINGER_2': 12, 'TRINKET_1': 13, 'TRINKET_2': 14,
      'MAIN_HAND': 15, 'OFF_HAND': 16, 'TABARD': 17
    };

    const sortedItems = [...items].sort((a, b) => {
      return (slotOrder[a.slot?.type] || 999) - (slotOrder[b.slot?.type] || 999);
    });

    const itemsHTML = sortedItems.map((item, index) => {
      const quality = item.quality?.name || item.quality?.type || 'COMMON';
      const qualityColor = getItemQualityColor(quality);
      const itemId = item.item?.id || '';
      const itemLevel = item.level?.value || item.item_level || '?';
      const slotName = getSlotName(item.slot?.type) || item.slot?.name || '';
      const mediaHref = item.media?.key?.href || '';

      // Build Wowhead URL with bonus lists and item level
      let wowheadParams = `item=${itemId}`;
      if (item.bonus_list && item.bonus_list.length > 0) {
        wowheadParams += `&bonus=${item.bonus_list.join(':')}`;
      }
      wowheadParams += `&ilvl=${itemLevel}`;

      return `
        <div class="modal-equipment-item"
           data-item-id="${itemId}"
           data-item-index="${index}"
           data-media-href="${mediaHref}">
          <a href="https://www.wowhead.com/${wowheadParams}" data-wowhead="${wowheadParams}" class="modal-item-icon">
            <i class="las la-circle-notch la-spin"></i>
            <div class="modal-item-slot-overlay">${slotName}</div>
            <div class="modal-item-ilvl-overlay">${itemLevel}</div>
          </a>
        </div>
      `;
    }).join('');

    return `<div class="modal-equipment-grid">${itemsHTML}</div>`;
  }

  /**
   * Render enchants and sockets section
   */
  renderEnchantsAndSockets(equipment) {
    if (!equipment || !equipment.equipped_items || equipment.equipped_items.length === 0) {
      return '<div class="no-enchants"><p>No equipment data available</p></div>';
    }

    // Define enchantable slots with friendly names
    const enchantableSlots = {
      'CHEST': 'Chest',
      'LEGS': 'Legs',
      'FEET': 'Feet',
      'WRIST': 'Wrist',
      'HANDS': 'Hands',
      'BACK': 'Back',
      'MAIN_HAND': 'Main Hand',
      'FINGER_1': 'Ring 1',
      'FINGER_2': 'Ring 2'
    };

    // Build a map of slot -> item data
    const itemsBySlot = {};
    equipment.equipped_items.forEach(item => {
      const slotType = item.slot?.type;
      if (enchantableSlots[slotType]) {
        itemsBySlot[slotType] = item;
      }
    });

    // Render each enchantable slot
    const enchantsHTML = Object.entries(enchantableSlots).map(([slotType, slotName]) => {
      const item = itemsBySlot[slotType];

      if (!item) {
        // Slot not equipped
        return `
          <div class="enchant-row">
            <div class="enchant-slot-name">${slotName}</div>
            <div class="enchant-status empty">
              <i class="las la-times"></i>
              <span>Not Equipped</span>
            </div>
          </div>
        `;
      }

      const hasEnchant = item.enchantments && item.enchantments.length > 0;
      const hasSockets = item.sockets && item.sockets.length > 0;

      // Build enchant HTML
      let enchantHTML = '';
      if (hasEnchant) {
        const enchant = item.enchantments[0];
        const enchantFullString = enchant.display_string || enchant.enchantment_name || 'Enchanted';

        // Remove anything after "|" - just show the name
        const enchantName = enchantFullString.split('|')[0].trim();

        enchantHTML = `
          <div class="enchant-status enchanted">
            <i class="las la-check-circle"></i>
            <span class="enchant-name">${enchantName}</span>
          </div>
        `;
      } else {
        enchantHTML = `
          <div class="enchant-status missing">
            <i class="las la-exclamation-triangle"></i>
            <span>Missing Enchant</span>
          </div>
        `;
      }

      // Build sockets HTML
      let socketsHTML = '';
      if (hasSockets) {
        socketsHTML = item.sockets.map(socket => {
          const hasGem = socket.item && socket.item.id;
          const gemName = socket.display_string || socket.item?.name || 'Empty Socket';

          if (hasGem) {
            return `
              <div class="socket-status socketed">
                <i class="las la-check-circle"></i>
                <span class="socket-name">Socketed: ${gemName}</span>
              </div>
            `;
          } else {
            return `
              <div class="socket-status empty-socket">
                <i class="las la-gem"></i>
                <span>Empty Socket</span>
              </div>
            `;
          }
        }).join('');
      }

      return `
        <div class="enchant-row">
          <div class="enchant-slot-name">${slotName}</div>
          <div class="enchant-socket-container">
            ${enchantHTML}
            ${socketsHTML}
          </div>
        </div>
      `;
    }).join('');

    return `<div class="enchants-list">${enchantsHTML}</div>`;
  }

  /**
   * Load item icons asynchronously
   */
  async loadItemIcons(equipment) {
    if (!equipment || !equipment.equipped_items) {
      return;
    }

    // Sort items in the same order as renderEquipment
    const slotOrder = {
      'HEAD': 1, 'NECK': 2, 'SHOULDER': 3, 'BACK': 4, 'CHEST': 5,
      'WRIST': 6, 'HANDS': 7, 'WAIST': 8, 'LEGS': 9, 'FEET': 10,
      'FINGER_1': 11, 'FINGER_2': 12, 'TRINKET_1': 13, 'TRINKET_2': 14,
      'MAIN_HAND': 15, 'OFF_HAND': 16, 'TABARD': 17
    };

    const items = [...equipment.equipped_items].sort((a, b) => {
      return (slotOrder[a.slot?.type] || 999) - (slotOrder[b.slot?.type] || 999);
    });

    const itemElements = this.modal.querySelectorAll('.modal-equipment-item');

    await IconLoader.loadItemIcons(items, itemElements, {
      fallbackIcon: 'las la-shield-alt',
      slotOverlaySelector: '.modal-item-slot-overlay',
      ilvlOverlaySelector: '.modal-item-ilvl-overlay',
      iconContainerSelector: '.modal-item-icon',
      fetchItemMedia: async (itemId) => await wowAPI.getItemMedia(itemId)
    });
  }

  /**
   * Load enchant icons asynchronously using Wowhead icon service
   */
  async loadEnchantIcons() {
    const enchantLinks = this.modal.querySelectorAll('.enchant-link[data-enchant-id]');

    for (const link of enchantLinks) {
      const enchantId = link.dataset.enchantId;
      const placeholder = link.querySelector('.enchant-icon-placeholder');

      if (!enchantId || !placeholder) continue;

      // Try using Wowhead's icon CDN with spell ID
      // Format: https://wow.zamimg.com/images/wow/icons/medium/ICON_NAME.jpg
      // Since we don't have icon name, try the spell media endpoint but with better error handling

      try {
        const endpoint = `/data/wow/media/spell/${enchantId}`;
        const mediaData = await battlenetClient.request(endpoint, {
          params: {
            namespace: config.api.namespace.static,
            locale: config.api.locale
          }
        });

        if (mediaData?.assets) {
          const iconAsset = mediaData.assets.find(asset => asset.key === 'icon');
          if (iconAsset?.value) {
            // Test if image loads successfully
            const img = new Image();
            img.onload = () => {
              placeholder.innerHTML = `<img src="${iconAsset.value}" alt="Enchant" class="enchant-icon-img" />`;
            };
            img.onerror = () => {
              // If image fails to load, use magic icon
              placeholder.innerHTML = `<i class="las la-magic"></i>`;
            };
            img.src = iconAsset.value;
          } else {
            placeholder.innerHTML = `<i class="las la-magic"></i>`;
          }
        } else {
          placeholder.innerHTML = `<i class="las la-magic"></i>`;
        }
      } catch (error) {
        // On API error, use magic icon
        placeholder.innerHTML = `<i class="las la-magic"></i>`;
      }
    }
  }

  /**
   * Load raid progression data
   */
  async loadRaidProgression(realmSlug, characterName) {
    const container = this.modal.querySelector('.modal-raid-progress');
    if (!container) return;

    try {
      // First, get the encounters summary which has a link to raids
      const encounters = await wowAPI.getCharacterEncounters(realmSlug, characterName);

      // The raids field is just a link, we need to fetch the actual raid data
      const raidsHref = encounters?.raids?.href;

      if (!raidsHref) {
        throw new Error('No raids href found');
      }

      // Extract the path from the full URL (remove the base URL)
      // Example: https://eu.api.blizzard.com/profile/wow/character/... -> /profile/wow/character/...
      const url = new URL(raidsHref);
      const raidsPath = url.pathname;

      // Use battlenetClient to make authenticated request
      const raidsData = await battlenetClient.request(raidsPath, {
        params: {
          namespace: config.api.namespace.profile
        }
      });

      // Get raids from the API (TWW raids should be in here)
      const expansionRaids = raidsData?.expansions || [];

      // Find TWW expansion
      const twwExpansion = expansionRaids.find(exp =>
        exp.expansion?.name === 'The War Within' ||
        exp.expansion?.id === 10 // TWW is expansion 10
      );

      // Find Dragonflight expansion
      const dfExpansion = expansionRaids.find(exp =>
        exp.expansion?.name === 'Dragonflight' ||
        exp.expansion?.id === 9 // DF is expansion 9
      );

      const twwRaids = twwExpansion?.instances || [];
      const dfRaids = dfExpansion?.instances || [];

      // Define all raids organized by expansion
      const expansionRaidData = {
        11: { // Midnight
          name: "Midnight",
          raids: [
            { name: "The Voidspire", bossCount: 6, instanceId: 1307 },
            { name: "March on Quel'Danas", bossCount: 2, instanceId: 1308 },
            { name: "The Dreamrift", bossCount: 1, instanceId: 1314 }
          ]
        },
        10: { // The War Within
          name: "The War Within",
          raids: [
            { name: "Nerub-ar Palace", bossCount: 8, instanceId: 1273 },
            { name: "Liberation of Undermine", bossCount: 8, instanceId: 1296 },
            { name: "Manaforge Omega", bossCount: 8, instanceId: 1302 }
          ]
        },
        9: { // Dragonflight
          name: "Dragonflight",
          raids: [
            { name: "Vault of the Incarnates", bossCount: 8, instanceId: 1200 },
            { name: "Aberrus, the Shadowed Crucible", bossCount: 9, instanceId: 1208 },
            { name: "Amirdrassil, the Dream's Hope", bossCount: 9, instanceId: 1207 }
          ]
        },
        8: { // Shadowlands
          name: "Shadowlands",
          raids: [
            { name: "Castle Nathria", bossCount: 10, instanceId: 1190 },
            { name: "Sanctum of Domination", bossCount: 10, instanceId: 1193 },
            { name: "Sepulcher of the First Ones", bossCount: 11, instanceId: 1195 }
          ]
        },
        7: { // Battle for Azeroth
          name: "Battle for Azeroth",
          raids: [
            { name: "Uldir", bossCount: 8, instanceId: 1031 },
            { name: "Battle of Dazar'alor", bossCount: 9, instanceId: 1176 },
            { name: "Crucible of Storms", bossCount: 2, instanceId: 1177 },
            { name: "The Eternal Palace", bossCount: 8, instanceId: 1179 },
            { name: "Ny'alotha, the Waking City", bossCount: 12, instanceId: 1180 }
          ]
        },
        6: { // Legion
          name: "Legion",
          raids: [
            { name: "The Emerald Nightmare", bossCount: 7, instanceId: 768 },
            { name: "Trial of Valor", bossCount: 3, instanceId: 861 },
            { name: "The Nighthold", bossCount: 10, instanceId: 786 },
            { name: "Tomb of Sargeras", bossCount: 9, instanceId: 875 },
            { name: "Antorus, the Burning Throne", bossCount: 11, instanceId: 946 }
          ]
        },
        5: { // Warlords of Draenor
          name: "Warlords of Draenor",
          raids: [
            { name: "Highmaul", bossCount: 7, instanceId: 477 },
            { name: "Blackrock Foundry", bossCount: 10, instanceId: 457 },
            { name: "Hellfire Citadel", bossCount: 13, instanceId: 669 }
          ]
        },
        4: { // Mists of Pandaria
          name: "Mists of Pandaria",
          raids: [
            { name: "Mogu'shan Vaults", bossCount: 6, instanceId: 317 },
            { name: "Heart of Fear", bossCount: 6, instanceId: 330 },
            { name: "Terrace of Endless Spring", bossCount: 4, instanceId: 320 },
            { name: "Throne of Thunder", bossCount: 13, instanceId: 362 },
            { name: "Siege of Orgrimmar", bossCount: 14, instanceId: 369 }
          ]
        },
        3: { // Cataclysm
          name: "Cataclysm",
          raids: [
            { name: "Baradin Hold", bossCount: 3, instanceId: 75 },
            { name: "Blackwing Descent", bossCount: 6, instanceId: 73 },
            { name: "The Bastion of Twilight", bossCount: 5, instanceId: 72 },
            { name: "Throne of the Four Winds", bossCount: 3, instanceId: 74 },
            { name: "Firelands", bossCount: 7, instanceId: 78 },
            { name: "Dragon Soul", bossCount: 8, instanceId: 187 }
          ]
        },
        2: { // Wrath of the Lich King
          name: "Wrath of the Lich King",
          raids: [
            { name: "Vault of Archavon", bossCount: 4, instanceId: 1 },
            { name: "Naxxramas", bossCount: 15, instanceId: 754 },
            { name: "The Obsidian Sanctum", bossCount: 4, instanceId: 755 },
            { name: "The Eye of Eternity", bossCount: 1, instanceId: 756 },
            { name: "Ulduar", bossCount: 14, instanceId: 759 },
            { name: "Trial of the Crusader", bossCount: 5, instanceId: 757 },
            { name: "Onyxia's Lair", bossCount: 1, instanceId: 760 },
            { name: "Icecrown Citadel", bossCount: 12, instanceId: 758 },
            { name: "The Ruby Sanctum", bossCount: 1, instanceId: 761 }
          ]
        },
        1: { // Burning Crusade - API only tracks completion (1/1 or 0/1)
          name: "Burning Crusade",
          raids: [
            { name: "Karazhan", bossCount: 1, instanceId: 745 },
            { name: "Gruul's Lair", bossCount: 1, instanceId: 746 },
            { name: "Magtheridon's Lair", bossCount: 1, instanceId: 747 },
            { name: "Serpentshrine Cavern", bossCount: 1, instanceId: 748 },
            { name: "Tempest Keep", bossCount: 1, instanceId: 749 },
            { name: "The Battle for Mount Hyjal", bossCount: 1, instanceId: 750 },
            { name: "Black Temple", bossCount: 1, instanceId: 751 },
            { name: "Zul'Aman", bossCount: 1, instanceId: 752 },
            { name: "Sunwell Plateau", bossCount: 1, instanceId: 753 }
          ]
        },
        0: { // Classic - API only tracks completion (1/1 or 0/1)
          name: "Classic",
          raids: [
            { name: "Molten Core", bossCount: 1, instanceId: 741 },
            { name: "Onyxia's Lair", bossCount: 1, instanceId: 760 },
            { name: "Blackwing Lair", bossCount: 1, instanceId: 742 },
            { name: "Ruins of Ahn'Qiraj", bossCount: 1, instanceId: 743 },
            { name: "Temple of Ahn'Qiraj", bossCount: 1, instanceId: 744 },
            { name: "Naxxramas", bossCount: 1, instanceId: 754 }
          ]
        }
      };

      // Build flat list HTML for all expansions
      const raidsListHTML = Object.entries(expansionRaidData).reverse().map(([expId, expData]) => {
        // Get character raids for this expansion by matching name
        const expRaidsData = expansionRaids.find(exp => exp.expansion?.name === expData.name)?.instances || [];

        // Build raids HTML for this expansion
        const raidsHTML = expData.raids.map(raidInfo => {
          const raidData = expRaidsData.find(r => r.instance.name === raidInfo.name);
          const instanceId = raidInfo.instanceId;

          // Determine best progression by finding the mode with the most kills
          let bestDiff = 'NORMAL';
          let killed = 0;
          let total = raidInfo.bossCount;
          let bestMode = null;

          // Priority order for difficulty types (modern raids)
          const difficultyPriority = ['MYTHIC', 'HEROIC', 'NORMAL', 'RAID_FINDER',
            'LEGACY_25_MAN_HEROIC', 'LEGACY_10_MAN_HEROIC', 'LEGACY_25_MAN', 'LEGACY_10_MAN'];

          if (raidData?.modes && raidData.modes.length > 0) {
            // Find the best mode based on priority order
            for (const diffType of difficultyPriority) {
              const mode = raidData.modes.find(m => m.difficulty.type === diffType);
              if (mode && (mode.progress?.completed_count || 0) > 0) {
                bestMode = mode;
                break;
              }
            }

            // If no mode with kills found, use the first mode
            if (!bestMode && raidData.modes[0]) {
              bestMode = raidData.modes[0];
            }

            if (bestMode) {
              killed = bestMode.progress?.completed_count || 0;
              total = bestMode.progress?.total_count || raidInfo.bossCount;

              // Map difficulty type to display name and color
              const diffType = bestMode.difficulty.type;
              const isLegacy = diffType.startsWith('LEGACY_');

              if (diffType === 'MYTHIC') {
                bestDiff = 'MYTHIC';
              } else if (diffType === 'HEROIC' || diffType.includes('HEROIC')) {
                bestDiff = isLegacy ? 'LEGACY_HEROIC' : 'HEROIC';
              } else if (diffType === 'NORMAL' || diffType.includes('25_MAN') && !diffType.includes('HEROIC')) {
                bestDiff = isLegacy ? 'LEGACY_NORMAL' : 'NORMAL';
              } else if (diffType.includes('10_MAN') && !diffType.includes('HEROIC')) {
                bestDiff = isLegacy ? 'LEGACY_NORMAL' : 'NORMAL';
              } else {
                bestDiff = 'NORMAL';
              }
            }
          }

          const percentage = total > 0 ? (killed / total * 100) : 0;

          const diffColors = {
            'MYTHIC': 'rgba(255, 128, 0, 0.9)',
            'HEROIC': 'rgba(163, 53, 238, 0.9)',
            'LEGACY_HEROIC': 'rgba(163, 53, 238, 0.9)',
            'NORMAL': 'rgba(0, 174, 255, 0.9)',
            'LEGACY_NORMAL': 'rgba(0, 174, 255, 0.9)'
          };

          // Format display label
          let displayLabel = bestDiff;
          if (bestDiff.startsWith('LEGACY_')) {
            const diffName = bestDiff.replace('LEGACY_', '');
            displayLabel = `${diffName.charAt(0)}${diffName.slice(1).toLowerCase()}`;
          } else {
            displayLabel = `${bestDiff.charAt(0)}${bestDiff.slice(1).toLowerCase()}`;
          }

          const isComplete = percentage === 100;
          const progressBar = `
            <div class="raid-difficulty">
              <div class="difficulty-label">${displayLabel}</div>
              <div class="progress-bar-container">
                <div class="progress-bar${isComplete ? ' complete' : ''}" style="width: ${percentage}%; background: ${diffColors[bestDiff]}"></div>
              </div>
              <div class="difficulty-count">${killed}/${total}</div>
            </div>
          `;

          return `
            <div class="raid-instance" data-instance-id="${instanceId || ''}">
              <div class="raid-background-overlay"></div>
              <div class="raid-content">
                <div class="raid-name">${raidInfo.name}</div>
                ${progressBar}
              </div>
            </div>
          `;
        }).join('');

        return `
          <div class="raid-expansion-section">
            <h4 class="expansion-title">${expData.name}</h4>
            <div class="raid-expansion-raids">
              ${raidsHTML}
            </div>
          </div>
        `;
      }).join('');

      container.innerHTML = `
        <h3>Raid Progression</h3>
        <div class="raids-flat-list">${raidsListHTML}</div>
      `;

      // Load raid icons
      this.loadRaidIcons();
    } catch (error) {
      container.innerHTML = `
        <h3>Raid Progression</h3>
        <div class="no-raid-data">
          <p>No raid progression data available</p>
        </div>
      `;
    }
  }

  /**
   * Load raid background images asynchronously
   */
  async loadRaidIcons() {
    const raidInstances = this.modal.querySelectorAll('.raid-instance[data-instance-id]');

    for (const raidInstance of raidInstances) {
      const instanceId = raidInstance.dataset.instanceId;

      if (!instanceId) continue;

      try {
        const mediaData = await wowAPI.getJournalInstanceMedia(parseInt(instanceId));

        if (mediaData?.assets && mediaData.assets.length > 0) {
          // Use the tile asset (banner image)
          const tileAsset = mediaData.assets.find(asset => asset.key === 'tile');

          if (tileAsset?.value) {
            // Set as background image on the raid-instance container
            raidInstance.style.backgroundImage = `url('${tileAsset.value}')`;
            raidInstance.classList.add('has-background');
          }
        }
      } catch (error) {
        console.error('Error loading raid background for instance', instanceId, ':', error);
      }
    }
  }

  /**
   * Load Mythic+ progression data
   */
  async loadMythicPlusProgression(realmSlug, characterName) {
    const container = this.modal.querySelector('.modal-mythic-plus');
    if (!container) return;

    try {
      // Fetch current season dungeons list
      const dungeonIndex = await wowAPI.getMythicKeystoneDungeons();
      const currentDungeons = dungeonIndex?.dungeons || [];

      // Fetch character's M+ profile
      let mplusProfile = null;
      let characterBestRuns = [];
      let overallRating = 0;

      try {
        mplusProfile = await wowAPI.getCharacterMythicKeystoneProfile(realmSlug, characterName);

        // Get overall rating from profile
        overallRating = mplusProfile?.current_mythic_rating?.rating ||
                       mplusProfile?.mythic_rating?.rating || 0;

        // The base profile returns seasons with links - we need to fetch the season details
        // to get the actual best_runs data
        if (mplusProfile?.seasons?.length > 0) {
          // Find current season (highest ID) - id is directly on the season object
          const currentSeasonRef = mplusProfile.seasons.reduce((max, s) =>
            (s.id || 0) > (max?.id || 0) ? s : max, null);

          if (currentSeasonRef?.id) {
            try {
              // Fetch the detailed season data which contains best_runs
              const seasonDetails = await wowAPI.getCharacterMythicKeystoneSeasonDetails(
                realmSlug, characterName, currentSeasonRef.id
              );

              if (seasonDetails?.best_runs) {
                characterBestRuns = seasonDetails.best_runs;
              }
            } catch (seasonError) {
              // Silently fail - character may not have data for this season
            }
          }
        }
      } catch (error) {
        // Character has no M+ data - continue with empty data
      }

      // TWW Season 3 dungeon to Journal Instance mapping for backgrounds
      const dungeonToJournal = {
        378: 1185,   // Halls of Atonement
        391: 1194,   // Tazavesh: Streets of Wonder
        392: 1194,   // Tazavesh: So'leah's Gambit
        499: 1267,   // Priory of the Sacred Flame
        503: 1271,   // Ara-Kara, City of Echoes
        505: 1270,   // The Dawnbreaker
        525: 1298,   // Operation: Floodgate
        542: 1303    // Eco-Dome Al'dani
      };

      // Current season dungeon IDs (TWW Season 3)
      const currentSeasonDungeonIds = [378, 391, 392, 499, 503, 505, 525, 542];

      // Filter to only current season dungeons
      const seasonDungeons = currentDungeons.filter(d => currentSeasonDungeonIds.includes(d.id));

      // Build dungeon cards for current season dungeons only
      const dungeonsHTML = seasonDungeons.map(dungeon => {
        // Find character's best run for this dungeon
        const bestRun = characterBestRuns.find(run =>
          run.dungeon?.id === dungeon.id
        );

        const keyLevel = bestRun?.keystone_level || 0;
        const duration = bestRun?.duration || 0;
        const upgrades = bestRun?.keystone_upgrades || 0; // 0-3 for timer bonus

        // Format duration (milliseconds to mm:ss)
        let timeStr = '--:--';
        if (duration > 0) {
          const totalSeconds = Math.floor(duration / 1000);
          const minutes = Math.floor(totalSeconds / 60);
          const seconds = totalSeconds % 60;
          timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Determine badge color based on key level
        let badgeClass = '';
        if (keyLevel >= 15) badgeClass = 'mythic-badge-high';
        else if (keyLevel >= 10) badgeClass = 'mythic-badge-mid';
        else if (keyLevel > 0) badgeClass = 'mythic-badge-low';

        // Timer upgrade indicators
        let timerIndicator = '';
        if (keyLevel > 0) {
          if (upgrades >= 3) timerIndicator = '<span class="timer-bonus gold">+++</span>';
          else if (upgrades === 2) timerIndicator = '<span class="timer-bonus silver">++</span>';
          else if (upgrades === 1) timerIndicator = '<span class="timer-bonus bronze">+</span>';
          else timerIndicator = '<span class="timer-bonus depleted">-</span>';
        }

        const journalId = dungeonToJournal[dungeon.id] || '';

        return `
          <div class="dungeon-instance" data-dungeon-id="${dungeon.id}" data-journal-id="${journalId}">
            <div class="dungeon-background-overlay"></div>
            <div class="dungeon-content">
              <div class="dungeon-name">${dungeon.name}</div>
              <div class="dungeon-stats">
                <div class="dungeon-key-level ${badgeClass}">
                  ${keyLevel > 0 ? `+${keyLevel}` : '-'}
                </div>
                <div class="dungeon-time">${timeStr}</div>
                ${timerIndicator}
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Rating color (matches Blizzard's color scheme)
      const ratingColor = this.getMythicRatingColor(overallRating);

      container.innerHTML = `
        <h3>Mythic+ Progression</h3>
        <div class="mythic-plus-rating" style="color: ${ratingColor}">
          <span class="rating-label">Rating</span>
          <span class="rating-value">${Math.round(overallRating)}</span>
        </div>
        <div class="dungeons-list">${dungeonsHTML}</div>
      `;

      // Load dungeon backgrounds
      this.loadDungeonIcons();

    } catch (error) {
      console.error('Error loading M+ progression:', error);
      container.innerHTML = `
        <h3>Mythic+ Progression</h3>
        <div class="no-mythic-data">
          <p>No Mythic+ data available</p>
        </div>
      `;
    }
  }

  /**
   * Get color for M+ rating (matches Blizzard's color scheme)
   */
  getMythicRatingColor(rating) {
    if (rating >= 3000) return '#ff8000'; // Orange (very high)
    if (rating >= 2500) return '#a335ee'; // Purple (epic)
    if (rating >= 2000) return '#0070dd'; // Blue (rare)
    if (rating >= 1500) return '#1eff00'; // Green (uncommon)
    if (rating >= 750) return '#ffffff';  // White (common)
    return 'rgba(255, 255, 255, 0.5)';    // Gray (no rating)
  }

  /**
   * Load dungeon background images asynchronously
   */
  async loadDungeonIcons() {
    const dungeonInstances = this.modal.querySelectorAll('.dungeon-instance[data-journal-id]');

    for (const dungeonInstance of dungeonInstances) {
      const journalId = dungeonInstance.dataset.journalId;

      if (!journalId) continue;

      try {
        const mediaData = await wowAPI.getJournalInstanceMedia(parseInt(journalId));

        if (mediaData?.assets && mediaData.assets.length > 0) {
          const tileAsset = mediaData.assets.find(asset => asset.key === 'tile');

          if (tileAsset?.value) {
            dungeonInstance.style.backgroundImage = `url('${tileAsset.value}')`;
            dungeonInstance.classList.add('has-background');
          }
        }
      } catch (error) {
        console.error('Error loading dungeon background for journal', journalId, ':', error);
      }
    }
  }

}

// Create singleton instance
const characterModal = new CharacterModal();

export default characterModal;
