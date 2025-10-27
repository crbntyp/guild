/**
 * Custom Tooltip Service
 * Replaces Wowhead tooltips with custom tooltips using Blizzard API data
 */

import wowAPI from '../api/wow-api.js';
import { getItemQualityColor } from '../utils/item-quality.js';

class CustomTooltip {
  constructor() {
    this.tooltip = null;
    this.cache = new Map();
    this.currentTarget = null;
    this.hideTimeout = null;
    this.initialized = false;
  }

  /**
   * Initialize the tooltip system
   */
  init() {
    if (this.initialized) return;
    this.createTooltipElement();
    this.attachGlobalListeners();
    this.initialized = true;
  }

  /**
   * Create the tooltip DOM element
   */
  createTooltipElement() {
    if (this.tooltip) return;

    this.tooltip = document.createElement('div');
    this.tooltip.className = 'wow-tooltip';
    this.tooltip.style.cssText = 'position: fixed; display: none; z-index: 99999; pointer-events: none;';
    document.body.appendChild(this.tooltip);
  }

  /**
   * Attach global event listeners for tooltip triggers
   */
  attachGlobalListeners() {
    // Use event delegation for better performance
    document.addEventListener('mouseover', (e) => {
      const tooltipTrigger = e.target.closest('[data-tooltip-item], [data-tooltip-spell], [data-tooltip-enchant]');
      if (tooltipTrigger) {
        this.show(tooltipTrigger, e);
      }
    });

    document.addEventListener('mouseout', (e) => {
      const tooltipTrigger = e.target.closest('[data-tooltip-item], [data-tooltip-spell], [data-tooltip-enchant]');
      if (tooltipTrigger) {
        this.hide();
      }
    });

    document.addEventListener('mousemove', (e) => {
      if (this.tooltip.style.display === 'block') {
        this.position(e);
      }
    });
  }

  /**
   * Show tooltip for an element
   */
  async show(element, event) {
    clearTimeout(this.hideTimeout);
    this.currentTarget = element;

    const itemId = element.dataset.tooltipItem;
    const spellId = element.dataset.tooltipSpell;
    const enchantId = element.dataset.tooltipEnchant;

    // Handle enchant tooltips directly (no API call needed)
    if (enchantId) {
      const enchantName = element.dataset.enchantName || 'Enchantment';
      const enchantStats = element.dataset.enchantStats || '';
      this.tooltip.innerHTML = this.renderEnchantTooltip(enchantName, enchantStats);
      this.tooltip.style.display = 'block';
      this.position(event);
      return;
    }

    const type = itemId ? 'item' : 'spell';
    const id = itemId || spellId;

    if (!id) return;

    // Show loading state
    this.tooltip.innerHTML = this.renderLoading();
    this.tooltip.style.display = 'block';
    this.position(event);

    try {
      // Check cache first
      const cacheKey = `${type}-${id}`;
      let data = this.cache.get(cacheKey);

      if (!data) {
        // Fetch data from Blizzard API
        if (type === 'item') {
          data = await this.fetchItemData(id);
        } else {
          data = await this.fetchSpellData(id);
        }
        this.cache.set(cacheKey, data);
      }

      // Render tooltip
      if (this.currentTarget === element) {
        this.tooltip.innerHTML = type === 'item'
          ? this.renderItemTooltip(data)
          : this.renderSpellTooltip(data);
        this.position(event);
      }
    } catch (error) {
      console.error(`Error loading ${type} tooltip:`, error);
      this.tooltip.innerHTML = this.renderError();
    }
  }

  /**
   * Hide tooltip
   */
  hide() {
    this.hideTimeout = setTimeout(() => {
      this.tooltip.style.display = 'none';
      this.currentTarget = null;
    }, 100);
  }

  /**
   * Position tooltip near cursor
   */
  position(event) {
    const offset = 15;
    const tooltipRect = this.tooltip.getBoundingClientRect();
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    let x = event.clientX + offset;
    let y = event.clientY + offset;

    // Keep tooltip within viewport
    if (x + tooltipRect.width > viewportWidth) {
      x = event.clientX - tooltipRect.width - offset;
    }
    if (y + tooltipRect.height > viewportHeight) {
      y = event.clientY - tooltipRect.height - offset;
    }

    this.tooltip.style.left = `${x}px`;
    this.tooltip.style.top = `${y}px`;
  }

  /**
   * Fetch item data from Blizzard API
   */
  async fetchItemData(itemId) {
    try {
      const itemData = await wowAPI.getItem(itemId);
      const previewItem = itemData.preview_item || {};

      return {
        id: itemId,
        name: itemData.name || 'Unknown Item',
        quality: itemData.quality?.type || 1,
        itemLevel: itemData.level || 0,
        description: previewItem.spells?.[0]?.description || '',
        requiresLevel: itemData.required_level || null,
        itemClass: itemData.item_class?.name || '',
        itemSubclass: itemData.item_subclass?.name || '',
        inventoryType: itemData.inventory_type?.name || '',
        sellPrice: itemData.sell_price || null,
        stats: previewItem.stats || [],
        spells: previewItem.spells || [],
        armor: previewItem.armor?.value || null,
        durability: previewItem.durability?.value || null,
        binding: previewItem.binding?.name || null,
        // Weapon-specific data
        weapon: previewItem.weapon ? {
          damage: previewItem.weapon.damage,
          speed: previewItem.weapon.attack_speed,
          dps: previewItem.weapon.dps
        } : null
      };
    } catch (error) {
      console.error('Error fetching item data:', error);
      throw error;
    }
  }

  /**
   * Fetch spell data from Blizzard API
   */
  async fetchSpellData(spellId) {
    try {
      const spellData = await wowAPI.getSpell(spellId);

      return {
        id: spellId,
        name: spellData.name || 'Unknown Spell',
        description: spellData.description || '',
        castTime: spellData.cast_time || null,
        range: spellData.range || null,
        cooldown: spellData.cooldown || null,
        powerCost: spellData.power_cost || null
      };
    } catch (error) {
      console.error('Error fetching spell data:', error);
      throw error;
    }
  }

  /**
   * Render loading state
   */
  renderLoading() {
    return `
      <div class="tooltip-header">
        <div class="tooltip-name" style="color: #ffd100;">Loading...</div>
      </div>
    `;
  }

  /**
   * Render error state
   */
  renderError() {
    return `
      <div class="tooltip-header">
        <div class="tooltip-name" style="color: #ff4040;">Failed to load tooltip</div>
      </div>
    `;
  }

  /**
   * Render enchant tooltip (uses data from equipment API, no fetch needed)
   */
  renderEnchantTooltip(enchantName, enchantStats) {
    let html = `
      <div class="tooltip-header">
        <div class="tooltip-name spell-name">${enchantName}</div>
      </div>
    `;

    // Show stats if available
    if (enchantStats) {
      html += `<div class="tooltip-enchant-stats">${enchantStats}</div>`;
    }

    html += `<div class="tooltip-enchant-type">Enchantment</div>`;

    return html;
  }

  /**
   * Render item tooltip
   */
  renderItemTooltip(data) {
    const qualityColor = getItemQualityColor(data.quality);

    let html = `
      <div class="tooltip-header">
        <div class="tooltip-name" style="color: ${qualityColor};">${data.name}</div>
      </div>
    `;

    // Item level
    if (data.itemLevel) {
      html += `<div class="tooltip-item-level">Item Level ${data.itemLevel}</div>`;
    }

    // Binding
    if (data.binding) {
      html += `<div class="tooltip-binding">${data.binding}</div>`;
    }

    // Inventory type (slot)
    if (data.inventoryType) {
      html += `<div class="tooltip-slot">${data.inventoryType}</div>`;
    }

    // Item class and subclass
    if (data.itemClass || data.itemSubclass) {
      const classInfo = [data.itemSubclass, data.itemClass].filter(Boolean).join(' ');
      if (classInfo) {
        html += `<div class="tooltip-subclass">${classInfo}</div>`;
      }
    }

    // Weapon stats (damage, speed, DPS)
    if (data.weapon) {
      if (data.weapon.damage) {
        const minDmg = data.weapon.damage.min_value || 0;
        const maxDmg = data.weapon.damage.max_value || 0;
        html += `<div class="tooltip-weapon-damage">${minDmg} - ${maxDmg} Damage</div>`;
      }
      if (data.weapon.speed) {
        html += `<div class="tooltip-weapon-speed">Speed ${data.weapon.speed.toFixed(2)}</div>`;
      }
      if (data.weapon.dps) {
        html += `<div class="tooltip-weapon-dps">(${data.weapon.dps.toFixed(1)} damage per second)</div>`;
      }
    }

    // Armor value
    if (data.armor) {
      html += `<div class="tooltip-armor">${data.armor.toLocaleString()} Armor</div>`;
    }

    // Stats
    if (data.stats && data.stats.length > 0) {
      html += '<div class="tooltip-stats">';
      data.stats.forEach(stat => {
        // Try multiple ways to get stat name and value
        const statName = stat.type?.name || stat.display?.display_string || 'Stat';
        const statValue = stat.value || stat.display?.value || 0;

        // Format large numbers with commas
        const formattedValue = statValue.toLocaleString();
        html += `<div class="tooltip-stat">+${formattedValue} ${statName}</div>`;
      });
      html += '</div>';
    }

    // Durability
    if (data.durability) {
      html += `<div class="tooltip-durability">Durability ${data.durability} / ${data.durability}</div>`;
    }

    // Requirements
    if (data.requiresLevel) {
      html += `<div class="tooltip-requirements">Requires Level ${data.requiresLevel}</div>`;
    }

    // Spells/effects (Use effects)
    if (data.spells && data.spells.length > 0) {
      data.spells.forEach(spell => {
        if (spell.description) {
          html += `<div class="tooltip-spell-effect">${spell.description}</div>`;
        }
      });
    }

    // Description
    if (data.description) {
      html += `<div class="tooltip-description">${data.description}</div>`;
    }

    // Sell price
    if (data.sellPrice) {
      const gold = Math.floor(data.sellPrice / 10000);
      const silver = Math.floor((data.sellPrice % 10000) / 100);
      const copper = data.sellPrice % 100;

      let priceHTML = '<div class="tooltip-sell-price">Sell Price: ';
      if (gold > 0) priceHTML += `<span class="gold">${gold}</span> `;
      if (silver > 0) priceHTML += `<span class="silver">${silver}</span> `;
      if (copper > 0 || data.sellPrice === 0) priceHTML += `<span class="copper">${copper}</span>`;
      priceHTML += '</div>';

      html += priceHTML;
    }

    return html;
  }

  /**
   * Render spell/enchant tooltip
   */
  renderSpellTooltip(data) {
    let html = `
      <div class="tooltip-header">
        <div class="tooltip-name spell-name">${data.name}</div>
      </div>
    `;

    // Cast time
    if (data.castTime) {
      const castTimeText = data.castTime === 'Instant' ? 'Instant' : data.castTime;
      html += `<div class="tooltip-cast-time">${castTimeText}</div>`;
    }

    // Range
    if (data.range) {
      html += `<div class="tooltip-range">Range: ${data.range}</div>`;
    }

    // Cooldown
    if (data.cooldown) {
      html += `<div class="tooltip-cooldown">Cooldown: ${data.cooldown}</div>`;
    }

    // Power cost
    if (data.powerCost) {
      html += `<div class="tooltip-power-cost">${data.powerCost}</div>`;
    }

    // Description
    if (data.description) {
      html += `<div class="tooltip-description">${data.description}</div>`;
    }

    return html;
  }

  /**
   * Clear the cache
   */
  clearCache() {
    this.cache.clear();
  }
}

// Create singleton instance
const customTooltip = new CustomTooltip();

export default customTooltip;
