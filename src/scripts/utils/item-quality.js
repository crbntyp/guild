// WoW Item Quality Colors
export const ITEM_QUALITY = {
  0: { name: 'Poor', color: '#9d9d9d' },
  1: { name: 'Common', color: '#ffffff' },
  2: { name: 'Uncommon', color: '#1eff00' },
  3: { name: 'Rare', color: '#0070dd' },
  4: { name: 'Epic', color: '#a335ee' },
  5: { name: 'Legendary', color: '#ff8000' },
  6: { name: 'Artifact', color: '#e6cc80' },
  7: { name: 'Heirloom', color: '#00ccff' }
};

// Equipment slot names and order for display
export const EQUIPMENT_SLOTS = {
  'HEAD': { name: 'Head', order: 1, icon: 'las la-helmet-battle' },
  'NECK': { name: 'Neck', order: 2, icon: 'las la-circle' },
  'SHOULDER': { name: 'Shoulder', order: 3, icon: 'las la-shield-alt' },
  'BACK': { name: 'Back', order: 4, icon: 'las la-tshirt' },
  'CHEST': { name: 'Chest', order: 5, icon: 'las la-vest' },
  'SHIRT': { name: 'Shirt', order: 6, icon: 'las la-tshirt' },
  'TABARD': { name: 'Tabard', order: 7, icon: 'las la-flag' },
  'WRIST': { name: 'Wrist', order: 8, icon: 'las la-watch' },
  'HANDS': { name: 'Hands', order: 9, icon: 'las la-mitten' },
  'WAIST': { name: 'Waist', order: 10, icon: 'las la-circle' },
  'LEGS': { name: 'Legs', order: 11, icon: 'las la-socks' },
  'FEET': { name: 'Feet', order: 12, icon: 'las la-shoe-prints' },
  'FINGER_1': { name: 'Ring 1', order: 13, icon: 'las la-ring' },
  'FINGER_2': { name: 'Ring 2', order: 14, icon: 'las la-ring' },
  'TRINKET_1': { name: 'Trinket 1', order: 15, icon: 'las la-gem' },
  'TRINKET_2': { name: 'Trinket 2', order: 16, icon: 'las la-gem' },
  'MAIN_HAND': { name: 'Main Hand', order: 17, icon: 'las la-sword' },
  'OFF_HAND': { name: 'Off Hand', order: 18, icon: 'las la-shield-alt' }
};

export function getItemQualityColor(qualityType) {
  return ITEM_QUALITY[qualityType]?.color || '#ffffff';
}

export function getItemQualityName(qualityType) {
  return ITEM_QUALITY[qualityType]?.name || 'Common';
}

export function getSlotName(slotType) {
  return EQUIPMENT_SLOTS[slotType]?.name || slotType;
}

export function getSlotIcon(slotType) {
  return EQUIPMENT_SLOTS[slotType]?.icon || 'las la-square';
}
