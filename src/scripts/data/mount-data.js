/**
 * Mount Data - Static mapping of mount IDs to expansion and icon data
 *
 * This is a curated list of WoW mounts with their expansion categorization.
 * Data sourced from Wowhead and Battle.net API.
 *
 * Structure:
 * - id: Mount ID from Battle.net API
 * - name: Mount display name
 * - expansion: Expansion ID (0-10)
 * - icon: Icon filename (without extension) from Wowhead
 */

const MOUNT_DATA = {
  // Classic (0)
  6: { id: 6, name: "Black Stallion", expansion: 0, icon: "ability_mount_ridinghorse" },
  7: { id: 7, name: "Brown Horse", expansion: 0, icon: "ability_mount_ridinghorse" },
  8: { id: 8, name: "Chestnut Mare", expansion: 0, icon: "ability_mount_ridinghorse" },
  17: { id: 17, name: "Black Ram", expansion: 0, icon: "ability_mount_mountainram" },
  23: { id: 23, name: "Swift Frostsaber", expansion: 0, icon: "ability_mount_blackpanther" },
  24: { id: 24, name: "Swift Mistsaber", expansion: 0, icon: "ability_mount_jungletiger" },
  26: { id: 26, name: "Swift Dawnsaber", expansion: 0, icon: "ability_mount_whitetiger" },
  32: { id: 32, name: "White Stallion", expansion: 0, icon: "ability_mount_ridinghorse" },

  // The Burning Crusade (1)
  41: { id: 41, name: "Swift Nether Drake", expansion: 1, icon: "ability_mount_netherdrakepurple" },
  42: { id: 42, name: "Swift Purple Nether Drake", expansion: 1, icon: "ability_mount_netherdrakepurple" },
  43: { id: 43, name: "Violet Nether Drake", expansion: 1, icon: "ability_mount_netherdrakepurple" },
  44: { id: 44, name: "Veridian Nether Drake", expansion: 1, icon: "ability_mount_netherdrakegreen" },
  45: { id: 45, name: "Cobalt Nether Drake", expansion: 1, icon: "ability_mount_netherdrakeblue" },
  107: { id: 107, name: "Raven Lord", expansion: 1, icon: "ability_mount_ravenlord" },
  183: { id: 183, name: "Ashes of Al'ar", expansion: 1, icon: "ability_mount_phoenix" },

  // Wrath of the Lich King (2)
  363: { id: 363, name: "Icebound Frostbrood Vanquisher", expansion: 2, icon: "ability_mount_frostbroodvanquisher" },
  364: { id: 364, name: "Bloodbathed Frostbrood Vanquisher", expansion: 2, icon: "ability_mount_frostbroodvanquisher" },
  265: { id: 265, name: "Blue Drake", expansion: 2, icon: "ability_mount_drakeblue" },
  266: { id: 266, name: "Azure Drake", expansion: 2, icon: "ability_mount_drakeazure" },
  267: { id: 267, name: "Bronze Drake", expansion: 2, icon: "ability_mount_drakebronze" },
  280: { id: 280, name: "Mimiron's Head", expansion: 2, icon: "inv_misc_head_mech_01" },
  304: { id: 304, name: "Invincible", expansion: 2, icon: "ability_mount_undeadhorse" },

  // Cataclysm (3)
  396: { id: 396, name: "Drake of the East Wind", expansion: 3, icon: "ability_mount_drake_proto" },
  397: { id: 397, name: "Drake of the South Wind", expansion: 3, icon: "ability_mount_drake_proto" },
  415: { id: 415, name: "Flametalon of Alysrazor", expansion: 3, icon: "inv_misc_birdbeck_01" },
  424: { id: 424, name: "Pureblood Fire Hawk", expansion: 3, icon: "inv_misc_birdbeck_01" },
  428: { id: 428, name: "Drake of the North Wind", expansion: 3, icon: "ability_mount_drake_proto" },
  441: { id: 441, name: "Blazing Drake", expansion: 3, icon: "ability_mount_drake_twilight" },
  442: { id: 442, name: "Experiment 12-B", expansion: 3, icon: "ability_mount_drake_twilight" },

  // Mists of Pandaria (4)
  448: { id: 448, name: "Heavenly Onyx Cloud Serpent", expansion: 4, icon: "inv_pandarenserpentgodmount_black" },
  468: { id: 468, name: "Spawn of Horridon", expansion: 4, icon: "inv_misc_monsterclaw_04" },
  504: { id: 504, name: "Clutch of Ji-Kun", expansion: 4, icon: "inv_misc_birdbeck_01" },
  522: { id: 522, name: "Armored Skyscreamer", expansion: 4, icon: "ability_mount_spectralgryphon" },
  523: { id: 523, name: "Spawn of Galakras", expansion: 4, icon: "ability_mount_drake_proto" },
  543: { id: 543, name: "Kor'kron Juggernaut", expansion: 4, icon: "ability_mount_jungletiger" },

  // Warlords of Draenor (5)
  547: { id: 547, name: "Garn Nighthowl", expansion: 5, icon: "ability_mount_blackdirewolf" },
  594: { id: 594, name: "Bloodhoof Bull", expansion: 5, icon: "ability_mount_ridingelekk" },
  613: { id: 613, name: "Voidtalon of the Dark Star", expansion: 5, icon: "ability_mount_hordescorpionamber" },
  618: { id: 618, name: "Coalfist Gronnling", expansion: 5, icon: "ability_mount_polarbear_white" },
  643: { id: 643, name: "Corrupted Dreadwing", expansion: 5, icon: "ability_mount_dreadravenpurple" },
  661: { id: 661, name: "Solar Spirehawk", expansion: 5, icon: "ability_mount_cockatricemountelite" },
  677: { id: 677, name: "Felsteel Annihilator", expansion: 5, icon: "ability_mount_felboar" },

  // Legion (6)
  954: { id: 954, name: "Midnight", expansion: 6, icon: "ability_mount_dreadsteed" },
  959: { id: 959, name: "Fiendish Hellfire Core", expansion: 6, icon: "inv_infernalbrimstone" },
  975: { id: 975, name: "Living Infernal Core", expansion: 6, icon: "inv_infernalbrimstone" },
  883: { id: 883, name: "Shackled Ur'zul", expansion: 6, icon: "ability_mount_demonmoose" },
  899: { id: 899, name: "Abyss Worm", expansion: 6, icon: "ability_mount_worm" },
  906: { id: 906, name: "Antoran Charhound", expansion: 6, icon: "ability_mount_helhound" },

  // Battle for Azeroth (7)
  1289: { id: 1289, name: "Uncorrupted Voidwing", expansion: 7, icon: "inv_voiddragonmount" },
  1040: { id: 1040, name: "Tomb Stalker", expansion: 7, icon: "inv_armoredraptorundead" },
  1042: { id: 1042, name: "Glacial Tidestorm", expansion: 7, icon: "spell_frost_summonwaterelemental_2" },
  1205: { id: 1205, name: "Snapback Scuttler", expansion: 7, icon: "inv_crabmount" },
  1213: { id: 1213, name: "Ny'alotha Allseer", expansion: 7, icon: "inv_eyeballjellyfishmount" },
  1222: { id: 1222, name: "Awakened Mindborer", expansion: 7, icon: "inv_nzothserpentmount_pale" },

  // Shadowlands (8)
  1490: { id: 1490, name: "Sinrunner Blanchy", expansion: 8, icon: "ability_mount_undeadhorse" },
  1311: { id: 1311, name: "Eternal Phalynx of Courage", expansion: 8, icon: "ability_bastion_mage" },
  1312: { id: 1312, name: "Eternal Phalynx of Purity", expansion: 8, icon: "ability_bastion_mage" },
  1424: { id: 1424, name: "Sundancer", expansion: 8, icon: "inv_misc_cat_01" },
  1441: { id: 1441, name: "Harvester's Dredwing", expansion: 8, icon: "ability_revendreth_rogue" },
  1475: { id: 1475, name: "Genesis Mana Saber", expansion: 8, icon: "ability_mount_jungletiger" },

  // Dragonflight (9)
  1563: { id: 1563, name: "Highland Drake", expansion: 9, icon: "inv_companiondrake" },
  1589: { id: 1589, name: "Renewed Proto-Drake", expansion: 9, icon: "inv_protodrake" },
  1590: { id: 1590, name: "Windborne Velocidrake", expansion: 9, icon: "inv_companionpterrordaxdrake" },
  1591: { id: 1591, name: "Winding Slitherdrake", expansion: 9, icon: "inv_slitherdrake" },
  1773: { id: 1773, name: "Scrappy Worldsnail", expansion: 9, icon: "inv_snailmount_yellow" },
  1777: { id: 1777, name: "Otto", expansion: 9, icon: "inv_riverotterlargemount01_blue" },

  // The War Within (10)
  1931: { id: 1931, name: "Siesbarg", expansion: 10, icon: "inv_misc_monsterhorn_03" },
  1950: { id: 1950, name: "Remembered Golden Gryphon", expansion: 10, icon: "ability_mount_goldengryphon" }
};

/**
 * Get mount data by ID
 * @param {number} mountId - The mount ID from Battle.net API
 * @returns {object|null} Mount data or null if not found
 */
export function getMountData(mountId) {
  return MOUNT_DATA[mountId] || null;
}

/**
 * Get all mount data
 * @returns {object} All mount data
 */
export function getAllMountData() {
  return MOUNT_DATA;
}

/**
 * Get mount icon URL (Wowhead CDN)
 * @param {string} iconName - Icon filename (without extension)
 * @param {string} size - Icon size ('tiny', 'medium', 'large')
 * @returns {string} Full icon URL
 */
export function getMountIconUrl(iconName, size = 'large') {
  const extension = size === 'tiny' ? 'gif' : 'jpg';
  return `https://wow.zamimg.com/images/wow/icons/${size}/${iconName}.${extension}`;
}

export default MOUNT_DATA;
