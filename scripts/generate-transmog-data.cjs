/**
 * Generate Transmog Set Data
 *
 * Fetches all transmog appearance sets from the Blizzard API,
 * resolves each set's appearances (slot, item name, icon),
 * and builds a static JSON database for the transmog collection tracker.
 *
 * Usage: node scripts/generate-transmog-data.js
 * Output: data/transmog-sets.json
 */

const fs = require('fs');
const path = require('path');

const CLIENT_ID = '86af3b20703442e78f9a90778846ce3b';
const CLIENT_SECRET = 'xHpqmVAnuwV8DFcMQncEYxCio35MSUHq';
const REGION = 'eu';
const NAMESPACE = 'static-eu';
const LOCALE = 'en_GB';
const API_BASE = `https://${REGION}.api.blizzard.com`;

let accessToken = '';
let requestCount = 0;

// Rate limiting: max 80 requests per second (safe margin under 100)
const BATCH_SIZE = 40;
const BATCH_DELAY = 600; // ms between batches

async function getAccessToken() {
  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  accessToken = data.access_token;
  console.log('✅ Got access token');
}

async function apiRequest(endpoint) {
  requestCount++;
  const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}namespace=${NAMESPACE}&locale=${LOCALE}`;
  try {
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) {
    return null;
  }
}

async function batchRequests(items, handler) {
  const results = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.all(batch.map(handler));
    results.push(...batchResults);

    const progress = Math.min(i + BATCH_SIZE, items.length);
    process.stdout.write(`\r  ${progress}/${items.length} (${Math.round(progress/items.length*100)}%)`);

    if (i + BATCH_SIZE < items.length) {
      await new Promise(r => setTimeout(r, BATCH_DELAY));
    }
  }
  console.log('');
  return results;
}

// Armor type classification
const ARMOR_TYPES = {
  1: 'Cloth',
  2: 'Leather',
  3: 'Mail',
  4: 'Plate'
};

// Guess expansion from set name patterns or item ID ranges
function guessExpansion(setName, itemIds) {
  const name = (setName || '').toLowerCase();

  // Midnight (12.x)
  if (name.includes('thalassian') || name.includes('sunsworn') || name.includes('dawnlit') ||
      name.includes('quel\'thalas') || name.includes('silvermoon')) return 'Midnight';

  // The War Within (11.x)
  if (name.includes('nerub') || name.includes('undermine') || name.includes('algari') ||
      name.includes('awakened') || name.includes('forged gladiator')) return 'The War Within';

  // Dragonflight (10.x)
  if (name.includes('obsidian') || name.includes('verdant') || name.includes('draconic') ||
      name.includes('primal') || name.includes('centaur')) return 'Dragonflight';

  // Shadowlands (9.x)
  if (name.includes('covenant') || name.includes('maldraxxus') || name.includes('sinful') ||
      name.includes('necrolord') || name.includes('venthyr') || name.includes('korthian')) return 'Shadowlands';

  // BfA (8.x)
  if (name.includes('dread gladiator') || name.includes('notorious') || name.includes('corrupted') ||
      name.includes('dazar') || name.includes('zandalari') || name.includes('kul tiran')) return 'Battle for Azeroth';

  // Legion (7.x)
  if (name.includes('cruel gladiator') || name.includes('fearless') || name.includes('demonic') ||
      name.includes('nighthold') || name.includes('tomb') || name.includes('antorus')) return 'Legion';

  // Use item ID ranges as fallback
  if (itemIds && itemIds.length > 0) {
    const maxId = Math.max(...itemIds);
    if (maxId > 240000) return 'Midnight';
    if (maxId > 210000) return 'The War Within';
    if (maxId > 190000) return 'Dragonflight';
    if (maxId > 170000) return 'Shadowlands';
    if (maxId > 150000) return 'Battle for Azeroth';
    if (maxId > 130000) return 'Legion';
    if (maxId > 110000) return 'Warlords of Draenor';
    if (maxId > 90000) return 'Mists of Pandaria';
    if (maxId > 70000) return 'Cataclysm';
    if (maxId > 40000) return 'Wrath of the Lich King';
    if (maxId > 25000) return 'The Burning Crusade';
    return 'Classic';
  }

  return 'Unknown';
}

async function main() {
  console.log('🔧 Generating transmog set data...\n');

  await getAccessToken();

  // Step 1: Fetch all appearance sets
  console.log('📋 Fetching appearance set index...');
  const setIndex = await apiRequest('/data/wow/item-appearance/set/index');
  if (!setIndex || !setIndex.appearance_sets) {
    console.error('❌ Failed to fetch set index');
    return;
  }

  const allSets = setIndex.appearance_sets;
  console.log(`  Found ${allSets.length} appearance sets`);

  // Step 2: Fetch details for each set
  console.log('\n📦 Fetching set details...');
  const setDetails = await batchRequests(allSets, async (set) => {
    const data = await apiRequest(`/data/wow/item-appearance/set/${set.id}`);
    if (!data) return null;
    return {
      id: data.id,
      name: data.set_name || set.name || 'Unknown Set',
      appearanceIds: (data.appearances || []).map(a => a.id)
    };
  });

  const validSets = setDetails.filter(Boolean);
  console.log(`  Got details for ${validSets.length} sets`);

  // Step 3: Collect all unique appearance IDs
  const allAppearanceIds = new Set();
  validSets.forEach(s => s.appearanceIds.forEach(id => allAppearanceIds.add(id)));
  console.log(`\n🎨 Fetching ${allAppearanceIds.size} unique appearances...`);

  const appearanceLookup = {};
  const appearanceResults = await batchRequests([...allAppearanceIds], async (appId) => {
    const data = await apiRequest(`/data/wow/item-appearance/${appId}`);
    if (!data) return null;

    const firstItem = (data.items && data.items[0]) || {};
    return {
      id: data.id,
      slot: data.slot?.name || 'Unknown',
      slotType: data.slot?.type || 'UNKNOWN',
      armorType: data.item_subclass?.name || 'Unknown',
      armorTypeId: data.item_subclass?.id || 0,
      itemName: firstItem.name || 'Unknown Item',
      itemId: firstItem.id || 0,
      mediaId: data.media?.id || 0
    };
  });

  appearanceResults.filter(Boolean).forEach(a => {
    appearanceLookup[a.id] = a;
  });
  console.log(`  Resolved ${Object.keys(appearanceLookup).length} appearances`);

  // Step 4: Build final dataset
  console.log('\n🔨 Building dataset...');
  const sets = validSets.map(set => {
    const pieces = set.appearanceIds
      .map(id => appearanceLookup[id])
      .filter(Boolean);

    if (pieces.length === 0) return null;

    // Determine armor type from pieces
    const armorTypeIds = pieces.map(p => p.armorTypeId).filter(id => id > 0);
    const primaryArmorTypeId = armorTypeIds.length > 0
      ? armorTypeIds.sort((a, b) => armorTypeIds.filter(v => v === b).length - armorTypeIds.filter(v => v === a).length)[0]
      : 0;

    const itemIds = pieces.map(p => p.itemId).filter(id => id > 0);

    return {
      id: set.id,
      name: set.name,
      armorType: ARMOR_TYPES[primaryArmorTypeId] || 'Other',
      expansion: guessExpansion(set.name, itemIds),
      pieces: pieces.map(p => ({
        appearanceId: p.id,
        slot: p.slot,
        slotType: p.slotType,
        itemName: p.itemName,
        itemId: p.itemId
      }))
    };
  }).filter(Boolean);

  // Sort by expansion (newest first), then name
  const expansionOrder = ['Midnight', 'The War Within', 'Dragonflight', 'Shadowlands', 'Battle for Azeroth', 'Legion', 'Warlords of Draenor', 'Mists of Pandaria', 'Cataclysm', 'Wrath of the Lich King', 'The Burning Crusade', 'Classic', 'Unknown'];
  sets.sort((a, b) => {
    const ea = expansionOrder.indexOf(a.expansion);
    const eb = expansionOrder.indexOf(b.expansion);
    if (ea !== eb) return ea - eb;
    return a.name.localeCompare(b.name);
  });

  // Stats
  const byExpansion = {};
  const byArmor = {};
  sets.forEach(s => {
    byExpansion[s.expansion] = (byExpansion[s.expansion] || 0) + 1;
    byArmor[s.armorType] = (byArmor[s.armorType] || 0) + 1;
  });

  console.log(`\n📊 Final dataset:`);
  console.log(`  Total sets: ${sets.length}`);
  console.log(`  Total pieces: ${sets.reduce((sum, s) => sum + s.pieces.length, 0)}`);
  console.log(`  API requests made: ${requestCount}`);
  console.log(`\n  By expansion:`);
  Object.entries(byExpansion).forEach(([k, v]) => console.log(`    ${k}: ${v}`));
  console.log(`\n  By armor type:`);
  Object.entries(byArmor).forEach(([k, v]) => console.log(`    ${k}: ${v}`));

  // Write output
  const output = {
    generated: new Date().toISOString(),
    totalSets: sets.length,
    sets
  };

  const outputPath = path.join(__dirname, '..', 'data', 'transmog-sets.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n✅ Written to ${outputPath}`);
}

main().catch(console.error);
