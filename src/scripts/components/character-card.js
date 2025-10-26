/**
 * CharacterCard Component
 * Renders a character card with consistent HTML structure
 * Used by guild-roster.js and my-characters.js
 */

import { getClassColor, getClassName } from '../utils/wow-constants.js';
import { slugToFriendly } from '../utils/helpers.js';

class CharacterCard {
  /**
   * Render a character card
   * @param {Object} member - Member object containing character data
   * @param {Object} options - Rendering options
   * @returns {string} HTML string for the character card
   */
  static render(member, options = {}) {
    const {
      // Whether to include detailed data attributes for icon loading (default: true)
      includeDetailedAttributes = true,
      // Optional cached gender data for race icons
      gender = null,
      // Optional cached item level
      itemLevel = null,
      // Optional realm slug override (for cross-realm guilds)
      realmSlugOverride = null,
      // Optional realm name override
      realmNameOverride = null,
      // Whether to lowercase the character name in data attributes
      lowercaseCharacterName = false
    } = options;

    const character = member.character;
    const classId = character.playable_class?.id || character.class?.id;
    const classColor = getClassColor(classId);
    const className = getClassName(classId);
    const raceId = character.playable_race?.id || character.race?.id;

    // Determine realm slug and name
    const realmSlug = realmSlugOverride || character.realm?.slug || character.realm;
    const realmName = realmNameOverride || character.realm?.name || slugToFriendly(realmSlug);

    // Determine character name for data attribute
    const characterNameAttr = lowercaseCharacterName
      ? character.name.toLowerCase()
      : character.name;

    // Item level display
    const itemLevelDisplay = itemLevel || character.itemLevel || '<i class="las la-spinner la-spin"></i>';

    // Determine gender for data attribute
    const genderAttr = gender || 'MALE';
    const genderName = gender || 'Unknown';

    // Build icon placeholder attributes
    const classIconAttrs = includeDetailedAttributes
      ? `title="${className}" data-class-id="${classId}" data-class-name="${className}" data-class-color="${classColor}"`
      : '';

    const raceIconAttrs = includeDetailedAttributes
      ? `title="${genderName}" data-race-id="${raceId}" data-gender="${genderAttr}"`
      : '';

    const specIconAttrs = includeDetailedAttributes
      ? `title="Specialization" data-character="${character.name}" data-realm="${realmSlug}"`
      : '';

    const factionIconAttrs = includeDetailedAttributes
      ? `title="Faction" data-race-id="${raceId}"`
      : '';

    return `
      <div class="member-card"
           data-character="${characterNameAttr}"
           data-realm="${realmSlug}"
           ${member.rank !== undefined ? `data-rank="${member.rank}"` : ''}
           style="border-bottom: 0px solid ${classColor};">
        ${member.rank === 0 ? '<i class="las la-crown guildmaster-crown"></i>' : ''}

        <div class="member-level">
          ${character.level}<span class="member-ilvl">${itemLevelDisplay}</span>
        </div>

        <div class="character-avatar-placeholder">
          <i class="las la-spinner la-spin loading-spinner"></i>
        </div>

        <div class="member-header">
          <div class="member-name" style="color: ${classColor}">
            ${character.name}
          </div>
          <div class="member-hero-talent"></div>
        </div>

        <div class="member-details">
          <div class="member-detail-row">
            <div class="member-icon class-icon-small class-icon-placeholder" ${classIconAttrs}>
              <i class="las la-spinner la-spin loading-spinner"></i>
            </div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon race-icon-small race-icon-placeholder" ${raceIconAttrs}>
              <i class="las la-spinner la-spin loading-spinner"></i>
            </div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon spec-icon-small spec-icon-placeholder" ${specIconAttrs}>
              <i class="las la-spinner la-spin"></i>
            </div>
          </div>
          <div class="member-detail-row">
            <div class="member-icon faction-icon-small faction-icon-placeholder" ${factionIconAttrs}>
              <i class="las la-spinner la-spin"></i>
            </div>
          </div>
        </div>

        <div class="member-realm-badge-container">
          <div class="member-realm-badge">${realmName}</div>
        </div>
      </div>
    `;
  }
}

export default CharacterCard;
