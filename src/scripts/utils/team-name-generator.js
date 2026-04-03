const ADJECTIVES = [
  'Cosmic', 'Void', 'Neon', 'Astral', 'Quantum', 'Phantom', 'Chrono',
  'Hyper', 'Turbo', 'Shadow', 'Radiant', 'Arcane', 'Stellar', 'Savage',
  'Iron', 'Thunder', 'Spectral', 'Cyber', 'Molten', 'Frozen', 'Crimson',
  'Mythic', 'Cursed', 'Ethereal', 'Primal', 'Rogue', 'Gilded', 'Warp',
  'Feral', 'Omega', 'Nova', 'Infernal', 'Doom', 'Plasma', 'Eldritch',
  'Brutal', 'Chaos', 'Toxic', 'Lunar', 'Solar', 'Blitz', 'Grim'
];

const NOUNS = [
  'Badgers', 'Llamas', 'Warlords', 'Foxes', 'Wolves', 'Pandas',
  'Ravens', 'Vipers', 'Titans', 'Sentinels', 'Reapers', 'Stalkers',
  'Juggernauts', 'Corsairs', 'Berserkers', 'Phantoms', 'Wardens',
  'Nomads', 'Outlaws', 'Marauders', 'Heralds', 'Knights', 'Wraiths',
  'Golems', 'Drakes', 'Hydras', 'Chimeras', 'Griffins', 'Krakens',
  'Leviathans', 'Colossi', 'Basilisks', 'Banshees', 'Specters',
  'Murlocs', 'Gnomes', 'Squirrels', 'Yetis', 'Troggs', 'Kobolds'
];

export function generateTeamName(existingNames = []) {
  let name;
  let attempts = 0;
  do {
    const adj = ADJECTIVES[Math.floor(Math.random() * ADJECTIVES.length)];
    const noun = NOUNS[Math.floor(Math.random() * NOUNS.length)];
    name = `${adj} ${noun}`;
    attempts++;
  } while (existingNames.includes(name) && attempts < 50);
  return name;
}
