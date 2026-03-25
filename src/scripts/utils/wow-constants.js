// WoW Class colors (official Blizzard colors)
export const CLASS_COLORS = {
  1: '#C79C6E',  // Warrior
  2: '#F58CBA',  // Paladin
  3: '#ABD473',  // Hunter
  4: '#FFF569',  // Rogue
  5: '#FFFFFF',  // Priest
  6: '#C41F3B',  // Death Knight
  7: '#0070DE',  // Shaman
  8: '#40C7EB',  // Mage
  9: '#8787ED',  // Warlock
  10: '#00FF96', // Monk
  11: '#FF7D0A', // Druid
  12: '#A330C9', // Demon Hunter
  13: '#33937F'  // Evoker
};

export const CLASS_NAMES = {
  1: 'Warrior',
  2: 'Paladin',
  3: 'Hunter',
  4: 'Rogue',
  5: 'Priest',
  6: 'Death Knight',
  7: 'Shaman',
  8: 'Mage',
  9: 'Warlock',
  10: 'Monk',
  11: 'Druid',
  12: 'Demon Hunter',
  13: 'Evoker'
};

// Faction colors
export const FACTION_COLORS = {
  Alliance: '#0078FF',
  Horde: '#B30000'
};

// Race IDs (some common ones)
export const RACE_NAMES = {
  1: 'Human',
  2: 'Orc',
  3: 'Dwarf',
  4: 'Night Elf',
  5: 'Undead',
  6: 'Tauren',
  7: 'Gnome',
  8: 'Troll',
  9: 'Goblin',
  10: 'Blood Elf',
  11: 'Draenei',
  22: 'Worgen',
  24: 'Pandaren',
  25: 'Pandaren',
  26: 'Pandaren',
  27: 'Nightborne',
  28: 'Highmountain Tauren',
  29: 'Void Elf',
  30: 'Lightforged Draenei',
  31: 'Zandalari Troll',
  32: 'Kul Tiran',
  34: 'Dark Iron Dwarf',
  35: 'Vulpera',
  36: 'Mag\'har Orc',
  37: 'Mechagnome',
  52: 'Dracthyr',
  70: 'Dracthyr',
  84: 'Earthen',
  85: 'Earthen',
  86: 'Haranir',
  91: 'Haranir'
};

// Guild rank colors (customizable)
export const RANK_COLORS = {
  0: '#FF8C00', // Guild Master - Orange
  1: '#9370DB', // Officers - Purple
  2: '#4169E1', // Veterans - Royal Blue
  3: '#32CD32', // Members - Lime Green
  4: '#87CEEB', // Initiates - Sky Blue
};

export function getClassColor(classId) {
  return CLASS_COLORS[classId] || '#FFFFFF';
}

export function getClassName(classId) {
  return CLASS_NAMES[classId] || 'Unknown';
}

export function getRaceName(raceId) {
  return RACE_NAMES[raceId] || 'Unknown';
}

export function getRankColor(rank) {
  return RANK_COLORS[rank] || '#CCCCCC';
}

// Spec name to role mapping
export const SPEC_ROLES = {
  'Arms': 'dps', 'Fury': 'dps', 'Protection': 'tank',
  'Holy': 'healer', 'Retribution': 'dps',
  'Beast Mastery': 'dps', 'Marksmanship': 'dps', 'Survival': 'dps',
  'Assassination': 'dps', 'Outlaw': 'dps', 'Subtlety': 'dps',
  'Discipline': 'healer', 'Shadow': 'dps',
  'Blood': 'tank', 'Frost': 'dps', 'Unholy': 'dps',
  'Elemental': 'dps', 'Enhancement': 'dps', 'Restoration': 'healer',
  'Arcane': 'dps', 'Fire': 'dps',
  'Affliction': 'dps', 'Demonology': 'dps', 'Destruction': 'dps',
  'Brewmaster': 'tank', 'Mistweaver': 'healer', 'Windwalker': 'dps',
  'Balance': 'dps', 'Feral': 'dps', 'Guardian': 'tank',
  'Havoc': 'dps', 'Vengeance': 'tank', 'Devourer': 'dps',
  'Devastation': 'dps', 'Preservation': 'healer', 'Augmentation': 'dps'
};

// Class ID to possible roles
export const CLASS_POSSIBLE_ROLES = {
  1: ['tank', 'dps'],           // Warrior
  2: ['tank', 'healer', 'dps'], // Paladin
  3: ['dps'],                   // Hunter
  4: ['dps'],                   // Rogue
  5: ['healer', 'dps'],         // Priest
  6: ['tank', 'dps'],           // Death Knight
  7: ['healer', 'dps'],         // Shaman
  8: ['dps'],                   // Mage
  9: ['dps'],                   // Warlock
  10: ['tank', 'healer', 'dps'],// Monk
  11: ['tank', 'healer', 'dps'],// Druid
  12: ['tank', 'dps'],          // Demon Hunter
  13: ['healer', 'dps']         // Evoker
};

export function getSpecRole(specName) {
  return SPEC_ROLES[specName] || 'dps';
}
