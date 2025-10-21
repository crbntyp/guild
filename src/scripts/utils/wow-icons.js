// WoW Icon URLs - Using local icons
// Icons stored in /assets/icons/

// Placeholder fallback icon
const PLACEHOLDER_ICON = '../img/placeholder.png';

// Gender constants - explicitly defined
export const GENDER_MALE = 'male';
export const GENDER_FEMALE = 'female';

// Class icon file names
export const CLASS_ICON_NAMES = {
  1: 'classicon_warrior',
  2: 'classicon_paladin',
  3: 'classicon_hunter',
  4: 'classicon_rogue',
  5: 'classicon_priest',
  6: 'classicon_deathknight',
  7: 'classicon_shaman',
  8: 'classicon_mage',
  9: 'classicon_warlock',
  10: 'classicon_monk',
  11: 'classicon_druid',
  12: 'classicon_demonhunter',
  13: 'classicon_evoker'
};

/**
 * Get class icon URL from Wowhead CDN with local fallback
 */
export function getClassIconUrl(classId) {
  const iconName = CLASS_ICON_NAMES[classId];
  if (!iconName) return null;

  return `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
}

/**
 * Get local class icon URL (for fallback)
 */
export function getLocalClassIconUrl(classId) {
  return PLACEHOLDER_ICON;
}

// Race ID to IconSmall icon URLs from Wowpedia
// These are animated GIFs with hash-based URLs
export const RACE_ICON_URLS = {
  // Original Races - NEW modern icons (without "2" suffix)
  1: {  // Human
    male: 'https://static.wikia.nocookie.net/wowpedia/images/e/ee/IconSmall_Human_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/8/8b/IconSmall_Human_Female.gif'
  },
  2: {  // Orc
    male: 'https://static.wikia.nocookie.net/wowpedia/images/3/3c/IconSmall_Orc_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/4/4e/IconSmall_Orc_Female.gif'
  },
  3: {  // Dwarf
    male: 'https://static.wikia.nocookie.net/wowpedia/images/6/6b/IconSmall_Dwarf_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/0/03/IconSmall_Dwarf_Female.gif'
  },
  4: {  // Night Elf
    male: 'https://static.wikia.nocookie.net/wowpedia/images/e/e8/IconSmall_NightElf_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/1/18/IconSmall_NightElf_Female.gif'
  },
  5: {  // Undead
    male: 'https://static.wikia.nocookie.net/wowpedia/images/3/3b/IconSmall_Undead_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/8/83/IconSmall_Undead_Female.gif'
  },
  6: {  // Tauren
    male: 'https://static.wikia.nocookie.net/wowpedia/images/4/41/IconSmall_Tauren_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/3/30/IconSmall_Tauren_Female.gif'
  },
  7: {  // Gnome
    male: 'https://static.wikia.nocookie.net/wowpedia/images/8/88/IconSmall_Gnome_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/0/0b/IconSmall_Gnome_Female.gif'
  },
  8: {  // Troll
    male: 'https://static.wikia.nocookie.net/wowpedia/images/5/5f/IconSmall_Troll_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/9/93/IconSmall_Troll_Female.gif'
  },
  9: {  // Goblin
    male: 'https://static.wikia.nocookie.net/wowpedia/images/f/f5/IconSmall_Goblin_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/c/cf/IconSmall_Goblin_Female.gif'
  },
  10: {  // Blood Elf (PNG format, not GIF)
    male: 'https://static.wikia.nocookie.net/wowpedia/images/d/da/IconSmall_BloodElf_Male.png',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/7/72/IconSmall_BloodElf_Female.png'
  },
  11: {  // Draenei
    male: 'https://static.wikia.nocookie.net/wowpedia/images/f/fb/IconSmall_Draenei_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/d/d0/IconSmall_Draenei_Female.gif'
  },
  22: {  // Worgen
    male: 'https://static.wikia.nocookie.net/wowpedia/images/6/6e/IconSmall_Worgen_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/6/64/IconSmall_Worgen_Female.gif'
  },
  24: {  // Pandaren (Neutral)
    male: 'https://static.wikia.nocookie.net/wowpedia/images/6/69/IconSmall_Pandaren_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/5/52/IconSmall_Pandaren_Female.gif'
  },
  25: {  // Pandaren (Alliance)
    male: 'https://static.wikia.nocookie.net/wowpedia/images/6/69/IconSmall_Pandaren_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/5/52/IconSmall_Pandaren_Female.gif'
  },
  26: {  // Pandaren (Horde)
    male: 'https://static.wikia.nocookie.net/wowpedia/images/6/69/IconSmall_Pandaren_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/5/52/IconSmall_Pandaren_Female.gif'
  },
  27: {  // Nightborne
    male: 'https://static.wikia.nocookie.net/wowpedia/images/a/a1/IconSmall_Nightborne_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/f/f0/IconSmall_Nightborne_Female.gif'
  },
  28: {  // Highmountain Tauren
    male: 'https://static.wikia.nocookie.net/wowpedia/images/3/3c/IconSmall_Highmountain_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/d/d6/IconSmall_Highmountain_Female.gif'
  },
  29: {  // Void Elf
    male: 'https://static.wikia.nocookie.net/wowpedia/images/e/e8/IconSmall_VoidElf_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/c/cd/IconSmall_VoidElf_Female.gif'
  },
  30: {  // Lightforged Draenei
    male: 'https://static.wikia.nocookie.net/wowpedia/images/5/57/IconSmall_Lightforged_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/9/96/IconSmall_Lightforged_Female.gif'
  },
  31: {  // Zandalari Troll
    male: 'https://static.wikia.nocookie.net/wowpedia/images/c/c3/IconSmall_Zandalari_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/9/91/IconSmall_Zandalari_Female.gif'
  },
  32: {  // Kul Tiran
    male: 'https://static.wikia.nocookie.net/wowpedia/images/6/63/IconSmall_KulTiran_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/f/ff/IconSmall_KulTiran_Female.gif'
  },
  34: {  // Dark Iron Dwarf
    male: 'https://static.wikia.nocookie.net/wowpedia/images/7/70/IconSmall_DarkIron_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/1/1e/IconSmall_DarkIron_Female.gif'
  },
  35: {  // Vulpera
    male: 'https://static.wikia.nocookie.net/wowpedia/images/e/e8/IconSmall_Vulpera_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/4/4f/IconSmall_Vulpera_Female.gif'
  },
  36: {  // Mag'har Orc
    male: 'https://static.wikia.nocookie.net/wowpedia/images/a/aa/IconSmall_OrcBrown_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/5/5f/IconSmall_OrcBrown_Female.gif'
  },
  37: {  // Mechagnome (Junker - already correct)
    male: 'https://static.wikia.nocookie.net/wowpedia/images/5/56/IconSmall_Junker_Male.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/0/03/IconSmall_Junker_Female.gif'
  },
  52: {  // Dracthyr Horde (single gender-neutral icon for both)
    male: 'https://static.wikia.nocookie.net/wowpedia/images/b/ba/IconSmall_Dracthyr.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/b/ba/IconSmall_Dracthyr.gif'
  },
  70: {  // Dracthyr Alliance (single gender-neutral icon for both)
    male: 'https://static.wikia.nocookie.net/wowpedia/images/b/ba/IconSmall_Dracthyr.gif',
    female: 'https://static.wikia.nocookie.net/wowpedia/images/b/ba/IconSmall_Dracthyr.gif'
  }
  // Note: Earthen (race ID 84) icons don't exist on Wowpedia yet (new race in The War Within 2024)
  // Will fall back to local icons or font icon
};

/**
 * Get race icon URL from Wowpedia IconSmall animated GIFs with local fallback
 * Combines race and gender into a single animated icon (e.g., Human Male, Orc Female)
 *
 * @param {number} raceId - WoW race ID (1-70)
 * @param {string|object|number} gender - Gender value in any format:
 *   - String: 'MALE' or 'FEMALE'
 *   - Object: { type: 'MALE' } or { type: 'FEMALE' }
 *   - Number: 0 (male) or 1 (female)
 * @returns {string|null} - URL to animated race+gender icon or null if invalid
 */
export function getRaceIconUrl(raceId, gender = 'MALE') {
  if (!raceId) return null;

  // Special case: Dracthyr (race ID 52 Horde, 70 Alliance) are gender-neutral - single icon
  if (raceId === 52 || raceId === 70) {
    return 'https://static.wikia.nocookie.net/wowpedia/images/b/ba/IconSmall_Dracthyr.gif';
  }

  const raceUrls = RACE_ICON_URLS[raceId];
  if (!raceUrls) {
    return PLACEHOLDER_ICON;
  }

  // Convert gender to lowercase string for URL lookup
  // Supports: 'MALE'/'FEMALE', {type: 'MALE'}/{type: 'FEMALE'}, 0/1
  let genderStr = GENDER_MALE; // Default to male
  if (gender?.type === 'FEMALE' || gender === 'FEMALE' || gender === 1) {
    genderStr = GENDER_FEMALE;
  }

  return raceUrls[genderStr];
}

/**
 * Get local race icon URL (for fallback)
 */
export function getLocalRaceIconUrl(raceId, gender = 'MALE') {
  return PLACEHOLDER_ICON;
}

/**
 * Get faction icon from Wowhead CDN with local fallback
 */
export function getFactionIconUrl(isAlliance) {
  // Use tournament banner icons: Alliance (human) and Horde (orc)
  const iconName = isAlliance ? 'inv_misc_tournaments_banner_human' : 'inv_misc_tournaments_banner_orc';
  return `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
}

/**
 * Get local faction icon URL (for fallback)
 */
export function getLocalFactionIconUrl(isAlliance) {
  return PLACEHOLDER_ICON;
}

// Spec icon name mapping (spec ID to Wowhead icon name)
// Using actual spell/ability icon names from Wowhead CDN
export const SPEC_ICON_NAMES = {
  // Death Knight
  250: 'spell_deathknight_bloodpresence',
  251: 'spell_deathknight_frostpresence',
  252: 'spell_deathknight_unholypresence',
  // Demon Hunter
  577: 'ability_demonhunter_specdps',
  581: 'ability_demonhunter_spectank',
  // Druid
  102: 'spell_nature_starfall',
  103: 'ability_druid_catform',
  104: 'ability_druid_maul',
  105: 'ability_druid_improvedtreeform',
  // Evoker
  1467: 'classicon_evoker_devastation',
  1468: 'classicon_evoker_preservation',
  1473: 'classicon_evoker_augmentation',
  // Hunter
  253: 'ability_hunter_bestialdiscipline',
  254: 'ability_hunter_focusedaim',
  255: 'ability_hunter_camouflage',
  // Mage
  62: 'ability_mage_arcanebarrage',
  63: 'spell_fire_flamebolt',
  64: 'spell_frost_frostbolt02',
  // Monk
  268: 'monk_stance_drunkenox',
  270: 'monk_stance_wiseserpent',
  269: 'monk_stance_whitetiger',
  // Paladin
  65: 'spell_holy_holybolt',
  66: 'ability_paladin_shieldofthetemplar',
  70: 'paladin_retribution',
  // Priest
  256: 'spell_holy_powerwordshield',
  257: 'spell_holy_guardianspirit',
  258: 'spell_shadow_shadowwordpain',
  // Rogue
  259: 'ability_rogue_deadlybrew',
  260: 'ability_rogue_pistolshot',
  261: 'ability_stealth',
  // Shaman
  262: 'spell_nature_lightning',
  263: 'spell_nature_lightningshield',
  264: 'spell_nature_magicimmunity',
  // Warlock
  265: 'spell_shadow_deathcoil',
  266: 'spell_shadow_metamorphosis',
  267: 'spell_shadow_rainoffire',
  // Warrior
  71: 'ability_warrior_savageblow',
  72: 'ability_warrior_innerrage',
  73: 'ability_warrior_defensivestance'
};

/**
 * Get spec icon URL from Wowhead CDN with local fallback
 */
export function getSpecIconUrl(specId) {
  if (!specId) return null;

  const iconName = SPEC_ICON_NAMES[specId];
  if (!iconName) {
    return PLACEHOLDER_ICON;
  }

  return `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;
}

/**
 * Get local spec icon URL (for fallback)
 */
export function getLocalSpecIconUrl(specId) {
  return PLACEHOLDER_ICON;
}

/**
 * Fallback icon if Blizzard CDN fails
 */
export function getFallbackIcon(type) {
  const fallbacks = {
    'class': 'las la-shield-alt',
    'race': 'las la-user',
    'gender': 'las la-question',
    'spec': 'las la-star'
  };
  return fallbacks[type] || 'las la-question';
}
