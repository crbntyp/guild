/**
 * Character Modal Component
 * Displays character details and equipment in a modal popup
 */

import characterService from '../services/character-service.js';
import wowAPI from '../api/wow-api.js';
import { getClassColor, getClassName } from '../utils/wow-constants.js';
import { getItemQualityColor, getSlotName } from '../utils/item-quality.js';
import { getClassIconUrl, getRaceIconUrl, getSpecIconUrl, getFactionIconUrl, getFallbackIcon } from '../utils/wow-icons.js';
import { slugToFriendly } from '../utils/helpers.js';
import IconLoader from '../services/icon-loader.js';

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
  }

  /**
   * Create modal HTML structure
   */
  createModalHTML() {
    const modalHTML = `
      <div class="character-modal" id="character-modal">
        <div class="character-modal-overlay"></div>
        <div class="character-modal-content">
          <button class="character-modal-close">
            <i class="las la-times"></i>
          </button>
          <div class="character-modal-body">
            <!-- Character card will be inserted here -->
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
            <div class="modal-member-icon" title="${className}">
              ${classIconUrl ? `<img src="${classIconUrl}" alt="${className}" class="icon-img" />` : '<i class="las la-question"></i>'}
            </div>
          </div>
          <div class="modal-member-detail-row">
            <div class="modal-member-icon" title="${character.race?.name || ''}">
              ${raceIconUrl ? `<img src="${raceIconUrl}" alt="${character.race?.name || ''}" class="icon-img" />` : '<i class="las la-question"></i>'}
            </div>
          </div>
          <div class="modal-member-detail-row">
            <div class="modal-member-icon" title="${activeSpec?.name || 'Specialization'}">
              ${specIconUrl ? `<img src="${specIconUrl}" alt="${activeSpec?.name || ''}" class="icon-img" />` : '<i class="las la-question"></i>'}
            </div>
          </div>
          <div class="modal-member-detail-row">
            <div class="modal-member-icon" title="${character.faction?.name || 'Faction'}">
              ${factionIconUrl ? `<img src="${factionIconUrl}" alt="${character.faction?.name || ''}" class="icon-img" />` : '<i class="las la-question"></i>'}
            </div>
          </div>
        </div>

        <div class="modal-member-realm-badge-container">
          <div class="modal-member-realm-badge">${realmName}</div>
        </div>

        <div class="modal-equipment">
          <h3>Equipment</h3>
          ${this.renderEquipment(equipment)}
        </div>
      </div>
    `;

    // Load item icons and initialize Wowhead tooltips
    this.loadItemIcons(equipment);
    this.initializeWowheadTooltips();
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

      return `
        <a href="https://www.wowhead.com/item=${itemId}&ilvl=${itemLevel}"
           class="modal-equipment-item"
           data-wowhead="item=${itemId}&ilvl=${itemLevel}"
           data-item-id="${itemId}"
           data-item-index="${index}"
           data-media-href="${mediaHref}">
          <div class="modal-item-icon">
            <i class="las la-circle-notch la-spin"></i>
            <div class="modal-item-slot-overlay">${slotName}</div>
            <div class="modal-item-ilvl-overlay">${itemLevel}</div>
          </div>
        </a>
      `;
    }).join('');

    return `<div class="modal-equipment-grid">${itemsHTML}</div>`;
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
   * Initialize Wowhead tooltips
   */
  initializeWowheadTooltips() {
    // Delay to ensure Wowhead script is fully loaded
    setTimeout(() => {
      if (window.$WowheadPower) {
        window.$WowheadPower.refreshLinks();
      }
    }, 100);
  }
}

// Create singleton instance
const characterModal = new CharacterModal();

export default characterModal;
