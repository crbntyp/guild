/**
 * Enchant Mappings
 * Maps Blizzard enchantment IDs to correct Wowhead spell/item IDs
 *
 * To add a new enchant:
 * 1. Find the enchantment_id from Blizzard API (in equipment.enchantments[0].enchantment_id)
 * 2. Search Wowhead for the enchant name
 * 3. Use the correct spell ID from Wowhead URL
 * 4. Optionally add iconUrl if you want to override the icon
 */

export const enchantMappings = {
  // Example format:
  // blizzardEnchantId: {
  //   wowheadId: 12345,           // The spell or item ID on Wowhead
  //   wowheadType: 'spell',       // 'spell' or 'item'
  //   iconUrl: null               // Optional: direct icon URL override
  // }

  // TWW Season 1 Enchants
  // Add enchants here as we discover them
  // Format: enchantment_id: { wowheadId, wowheadType, iconUrl }

  // Weapon Enchants (TWW)
  7460: { wowheadId: 223775, wowheadType: 'item' }, // Authority of Air
  7461: { wowheadId: 223781, wowheadType: 'item' }, // Authority of Radiant Power
  7462: { wowheadId: 223784, wowheadType: 'item' }, // Authority of the Depths
  7463: { wowheadId: 17071, wowheadType: 'item' }, // Authority of Storms
  7457: { wowheadId: 17071, wowheadType: 'item' }, // Council's Guile
  7442: { wowheadId: 445317, wowheadType: 'spell' }, // Stormrider's Fury
  7459: { wowheadId: 17071, wowheadType: 'item' }, // Stonebound Artistry

  // Ring Enchants (TWW)
  7340: { wowheadId: 435503, wowheadType: 'spell' }, // Radiant Critical Strike
  7341: { wowheadId: 435504, wowheadType: 'spell' }, // Radiant Haste
  7342: { wowheadId: 435505, wowheadType: 'spell' }, // Radiant Mastery
  7343: { wowheadId: 435506, wowheadType: 'spell' }, // Radiant Versatility
  7344: { wowheadId: 435499, wowheadType: 'spell' }, // Glimmering Critical Strike
  7345: { wowheadId: 435500, wowheadType: 'spell' }, // Glimmering Haste
  7346: { wowheadId: 435501, wowheadType: 'spell' }, // Glimmering Mastery
  7347: { wowheadId: 435502, wowheadType: 'spell' }, // Glimmering Versatility
  7348: { wowheadId: 435495, wowheadType: 'spell' }, // Cursed Critical Strike
  7349: { wowheadId: 435496, wowheadType: 'spell' }, // Cursed Haste
  7350: { wowheadId: 435497, wowheadType: 'spell' }, // Cursed Mastery
  7351: { wowheadId: 435498, wowheadType: 'spell' }, // Cursed Versatility
  7352: { wowheadId: 435504, wowheadType: 'spell' }, // Radiant Haste (alternate/quality variant)

  // Chest Enchants (TWW)
  7364: { wowheadId: 223690, wowheadType: 'item' }, // Crystalline Radiance
  7365: { wowheadId: 435508, wowheadType: 'item' }, // Oathsworn's Strength
  7366: { wowheadId: 435509, wowheadType: 'item' }, // Stormrider's Agility

  // Cloak Enchants (TWW)
  7409: { wowheadId: 435510, wowheadType: 'item' }, // Chant of Burrowing Rapidity
  7410: { wowheadId: 435512, wowheadType: 'item' }, // Chant of Leeching Fangs
  7411: { wowheadId: 435513, wowheadType: 'item' }, // Chant of Winged Grace

  // Bracer Enchants (TWW)
  7385: { wowheadId: 435514, wowheadType: 'item' }, // Chant of Armored Avoidance
  7386: { wowheadId: 435515, wowheadType: 'item' }, // Chant of Armored Leech
  7387: { wowheadId: 435516, wowheadType: 'item' }, // Chant of Armored Speed

  // Boot Enchants (TWW)
  7424: { wowheadId: 223650, wowheadType: 'item' }, // Cavalry's March
  7425: { wowheadId: 223656, wowheadType: 'item' }, // Defender's March
  7426: { wowheadId: 223651, wowheadType: 'item' }, // Scout's March

  // Leg Enchants (TWW) - Armor Kits and Spellthreads
  // Note: These are items applied to legs, not traditional enchants

  // Armor Kits (Leatherworking - for Leather/Mail/Plate)
  7427: { wowheadId: 219908, wowheadType: 'item' }, // Defender's Armor Kit
  7428: { wowheadId: 219909, wowheadType: 'item' }, // Stormbound Armor Kit (Quality 1)
  7429: { wowheadId: 219910, wowheadType: 'item' }, // Stormbound Armor Kit (Quality 2)
  7430: { wowheadId: 219911, wowheadType: 'item' }, // Stormbound Armor Kit (Quality 3)

  // Spellthreads (Tailoring - for Cloth)
  7431: { wowheadId: 222889, wowheadType: 'item' }, // Weavercloth Spellthread (Quality 1)
  7432: { wowheadId: 222890, wowheadType: 'item' }, // Weavercloth Spellthread (Quality 2)
  7433: { wowheadId: 222891, wowheadType: 'item' }, // Weavercloth Spellthread (Quality 3)
  7434: { wowheadId: 222892, wowheadType: 'item' }, // Sunset Spellthread (Quality 1)
  7435: { wowheadId: 222893, wowheadType: 'item' }, // Sunset Spellthread (Quality 2)
  7436: { wowheadId: 222894, wowheadType: 'item' }, // Sunset Spellthread (Quality 3)
  7437: { wowheadId: 222895, wowheadType: 'item' }, // Daybreak Spellthread (Quality 1)
  7438: { wowheadId: 222896, wowheadType: 'item' }, // Daybreak Spellthread (Quality 2)
  7439: { wowheadId: 222897, wowheadType: 'item' }, // Daybreak Spellthread (Quality 3)
};

/**
 * Get Wowhead data for an enchant
 * @param {number} enchantmentId - Blizzard enchantment ID
 * @returns {object|null} - { wowheadId, wowheadType, iconUrl } or null if not found
 */
export function getEnchantWowheadData(enchantmentId) {
  return enchantMappings[enchantmentId] || null;
}

/**
 * Check if an enchant has a mapping
 * @param {number} enchantmentId - Blizzard enchantment ID
 * @returns {boolean}
 */
export function hasEnchantMapping(enchantmentId) {
  return enchantmentId in enchantMappings;
}
