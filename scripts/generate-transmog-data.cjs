/**
 * Generate Transmog Set Data — Hybrid Approach
 *
 * 1. Fetch item-sets (942) for class identification
 * 2. Fetch appearance sets for full piece lists (all slots including belt/cloak/bracer)
 * 3. Cross-reference: if an appearance set's items overlap with an item-set, inherit the class
 * 4. For modern sets without class restriction, use armor type → class mapping
 *
 * Usage: node scripts/generate-transmog-data.cjs
 * Output: data/transmog-sets.json
 */

const fs = require('fs');
const path = require('path');

const CLIENT_ID = '86af3b20703442e78f9a90778846ce3b';
const CLIENT_SECRET = 'xHpqmVAnuwV8DFcMQncEYxCio35MSUHq';
const API_BASE = 'https://eu.api.blizzard.com';
const NAMESPACE = 'static-eu';
const LOCALE = 'en_GB';

let accessToken = '';
let requestCount = 0;
const BATCH_SIZE = 40;
const BATCH_DELAY = 600;

async function getAccessToken() {
  const res = await fetch('https://oauth.battle.net/token', {
    method: 'POST',
    headers: {
      'Authorization': 'Basic ' + Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64'),
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  accessToken = (await res.json()).access_token;
  console.log('Got access token');
}

async function api(endpoint) {
  requestCount++;
  const url = `${API_BASE}${endpoint}${endpoint.includes('?') ? '&' : '?'}namespace=${NAMESPACE}&locale=${LOCALE}`;
  try {
    const res = await fetch(url, { headers: { 'Authorization': `Bearer ${accessToken}` } });
    if (!res.ok) return null;
    return await res.json();
  } catch (e) { return null; }
}

async function batch(items, handler) {
  const results = [];
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const b = items.slice(i, i + BATCH_SIZE);
    results.push(...await Promise.all(b.map(handler)));
    const p = Math.min(i + BATCH_SIZE, items.length);
    process.stdout.write(`\r  ${p}/${items.length} (${Math.round(p / items.length * 100)}%)`);
    if (i + BATCH_SIZE < items.length) await new Promise(r => setTimeout(r, BATCH_DELAY));
  }
  console.log('');
  return results;
}

const ARMOR_TYPES = { 1: 'Cloth', 2: 'Leather', 3: 'Mail', 4: 'Plate' };
const ARMOR_CLASSES = {
  'Cloth': ['Mage', 'Priest', 'Warlock'],
  'Leather': ['Rogue', 'Druid', 'Monk', 'Demon Hunter'],
  'Mail': ['Hunter', 'Shaman', 'Evoker'],
  'Plate': ['Warrior', 'Paladin', 'Death Knight']
};
const SHARED_TIER_EXPANSIONS = ['Dragonflight', 'The War Within', 'Midnight'];

function getExpansionFromLevel(requiredLevel) {
  if (requiredLevel >= 90) return 'Midnight';
  if (requiredLevel >= 80) return 'The War Within';
  if (requiredLevel >= 70) return 'Dragonflight';
  if (requiredLevel >= 60) return 'Shadowlands';
  if (requiredLevel >= 50) return 'Battle for Azeroth';
  if (requiredLevel >= 45) return 'Legion';
  if (requiredLevel >= 40) return 'Warlords of Draenor';
  if (requiredLevel >= 35) return 'Mists of Pandaria';
  if (requiredLevel >= 32) return 'Cataclysm';
  if (requiredLevel >= 30) return 'Wrath of the Lich King';
  if (requiredLevel >= 27) return 'The Burning Crusade';
  return 'Classic';
}

function isPvp(name) {
  const l = (name || '').toLowerCase();
  return l.includes('gladiator') || l.includes('combatant') || l.includes('aspirant');
}

// Step caching — avoids re-fetching completed steps on retry
const CACHE_DIR = path.join(__dirname, '..', 'data', '.transmog-cache');
if (!fs.existsSync(CACHE_DIR)) fs.mkdirSync(CACHE_DIR, { recursive: true });

function saveCache(step, data) {
  fs.writeFileSync(path.join(CACHE_DIR, `${step}.json`), JSON.stringify(data));
  console.log(`  [cached ${step}]`);
}
function loadCache(step) {
  const p = path.join(CACHE_DIR, `${step}.json`);
  if (fs.existsSync(p)) {
    console.log(`  [using cached ${step}]`);
    return JSON.parse(fs.readFileSync(p, 'utf-8'));
  }
  return null;
}

async function main() {
  console.log('Generating transmog data (hybrid approach)...\n');
  await getAccessToken();

  // ── Step 1: Build class lookup from item-sets ──
  let step1 = loadCache('step1');
  const itemSetItemToClass = {};
  const itemSetItemIds = new Set();
  const itemRequiredLevel = {};

  if (step1) {
    Object.entries(step1.classMap).forEach(([id, cls]) => { itemSetItemToClass[id] = cls; });
    step1.itemIds.forEach(id => itemSetItemIds.add(id));
    Object.entries(step1.levels).forEach(([id, lvl]) => { itemRequiredLevel[id] = lvl; });
  } else {
    console.log('Step 1: Fetching item-set index for class identification...');
    const itemSetIndex = await api('/data/wow/item-set/index');
    const itemSets = itemSetIndex?.item_sets || [];
    console.log(`  Found ${itemSets.length} item sets`);

    console.log('Fetching item-set details...');
    await batch(itemSets, async (iset) => {
      const data = await api(`/data/wow/item-set/${iset.id}`);
      if (!data || !data.items) return null;
      data.items.forEach(i => { if (i.id) itemSetItemIds.add(i.id); });
      return null;
    });

    console.log(`\nFetching class + level info for ${itemSetItemIds.size} item-set items...`);
    await batch([...itemSetItemIds], async (itemId) => {
      const data = await api(`/data/wow/item/${itemId}`);
      const classes = data?.preview_item?.requirements?.playable_classes?.links || [];
      if (classes.length > 0) itemSetItemToClass[itemId] = classes.map(c => c.name);
      if (data?.required_level) itemRequiredLevel[itemId] = data.required_level;
      return null;
    });
    console.log(`  Got class info for ${Object.keys(itemSetItemToClass).length} items`);
    saveCache('step1', { classMap: itemSetItemToClass, itemIds: [...itemSetItemIds], levels: itemRequiredLevel });
  }

  // ── Step 2: Fetch appearance sets (PvE only) ──
  let validAppSets = loadCache('step2');
  if (!validAppSets) {
    console.log('Step 2: Fetching appearance set index...');
    const appSetIndex = await api('/data/wow/item-appearance/set/index');
    const allAppSets = (appSetIndex?.appearance_sets || []).filter(s => !isPvp(s.name));
    console.log(`  ${allAppSets.length} PvE appearance sets\n`);

    console.log('Fetching appearance set details...');
    const appSetDetails = await batch(allAppSets, async (set) => {
      const data = await api(`/data/wow/item-appearance/set/${set.id}`);
      if (!data) return null;
      return { id: data.id, name: data.set_name || set.name || 'Unknown', appearanceIds: (data.appearances || []).map(a => a.id) };
    });
    validAppSets = appSetDetails.filter(Boolean);
    console.log(`  Got ${validAppSets.length} sets`);
    saveCache('step2', validAppSets);
  }

  // ── Step 3: Resolve appearances ──
  let appLookup = loadCache('step3');
  if (!appLookup) {
    appLookup = {};
    const allAppIds = new Set();
    validAppSets.forEach(s => s.appearanceIds.forEach(id => allAppIds.add(id)));
    console.log(`Step 3: Fetching ${allAppIds.size} unique appearances...`);
    await batch([...allAppIds], async (appId) => {
      const data = await api(`/data/wow/item-appearance/${appId}`);
      if (!data) return null;
      const firstItem = data.items?.[0] || {};
      appLookup[appId] = { id: data.id, slot: data.slot?.name || 'Unknown', slotType: data.slot?.type || 'UNKNOWN', armorTypeId: data.item_subclass?.id || 0, itemName: firstItem.name || 'Unknown', itemId: firstItem.id || 0 };
      return null;
    });
    console.log(`  Resolved ${Object.keys(appLookup).length} appearances`);
    saveCache('step3', appLookup);
  }

  // ── Step 4: Get icons for all unique items ──
  let iconLookup = loadCache('step4');
  if (!iconLookup) {
    iconLookup = {};
    const uniqueItemIds = new Set();
    Object.values(appLookup).forEach(a => { if (a.itemId > 0) uniqueItemIds.add(a.itemId); });
    console.log(`Step 4: Fetching icons for ${uniqueItemIds.size} items...`);
    await batch([...uniqueItemIds], async (itemId) => {
      const media = await api(`/data/wow/media/item/${itemId}`);
      iconLookup[itemId] = media?.assets?.find(a => a.key === 'icon')?.value || '';
      return null;
    });
    console.log(`  Got ${Object.values(iconLookup).filter(Boolean).length} icons`);
    saveCache('step4', iconLookup);
  }

  // ── Step 5: Build item source lookup from Journal API ──
  let itemSourceLookup = loadCache('step5');
  if (!itemSourceLookup) {
    itemSourceLookup = {};
    console.log('Step 5: Fetching journal instances for item sources...');
    const journalIndex = await api('/data/wow/journal-instance/index');
    const instances = journalIndex?.instances || [];
    console.log(`  Found ${instances.length} instances`);

    console.log('Fetching instance details...');
    const encounterIds = [];
    await batch(instances, async (inst) => {
      const data = await api(`/data/wow/journal-instance/${inst.id}`);
      if (!data || !data.encounters) return null;
      const instName = data.name || inst.name || 'Unknown';
      data.encounters.forEach(enc => {
        encounterIds.push({ id: enc.id, instance: instName });
      });
      return null;
    });
    console.log(`  Found ${encounterIds.length} encounters\n`);

    console.log('Fetching encounter loot tables...');
    await batch(encounterIds, async (enc) => {
      const data = await api(`/data/wow/journal-encounter/${enc.id}`);
      if (!data) return null;
      const bossName = data.name || 'Unknown Boss';
      (data.items || []).forEach(drop => {
        const itemId = drop.item?.id;
        if (itemId) itemSourceLookup[itemId] = { boss: bossName, instance: enc.instance };
      });
      return null;
    });
    console.log(`  Built source data for ${Object.keys(itemSourceLookup).length} items`);
    saveCache('step5', itemSourceLookup);
  }

  // ── Step 6: Build dataset ──
  console.log('Step 6: Building dataset...');
  const sets = validAppSets.map(set => {
    const pieces = set.appearanceIds.map(id => appLookup[id]).filter(Boolean);
    if (pieces.length === 0) return null;

    // Determine armor type
    const armorTypeIds = pieces.map(p => p.armorTypeId).filter(id => id > 0);
    const primaryArmorTypeId = armorTypeIds.length > 0
      ? armorTypeIds.sort((a, b) =>
          armorTypeIds.filter(v => v === b).length - armorTypeIds.filter(v => v === a).length
        )[0] : 0;
    const armorType = ARMOR_TYPES[primaryArmorTypeId] || 'Other';

    const itemIds = pieces.map(p => p.itemId).filter(id => id > 0);

    // Determine expansion from required_level of any item-set item in this set
    let expansion = 'Unknown';
    for (const id of itemIds) {
      if (itemRequiredLevel[id]) {
        expansion = getExpansionFromLevel(itemRequiredLevel[id]);
        break;
      }
    }

    // Cross-reference with item-sets for class
    let classes = null;
    for (const p of pieces) {
      if (itemSetItemToClass[p.itemId]) {
        classes = itemSetItemToClass[p.itemId];
        break;
      }
    }

    // For modern expansions without class restriction, use armor type → classes
    if (!classes && SHARED_TIER_EXPANSIONS.includes(expansion)) {
      // Only if any item is in an item-set (confirms it's a tier set)
      const isTierSet = itemIds.some(id => itemSetItemIds.has(id));
      if (isTierSet) {
        classes = ARMOR_CLASSES[armorType] || null;
      }
    }

    // Skip if we can't determine class (not a class tier set)
    if (!classes) return null;

    return {
      id: set.id,
      name: set.name,
      classes,
      armorType,
      expansion,
      pieceCount: pieces.length,
      pieces: pieces.map(p => {
        const source = itemSourceLookup[p.itemId] || null;
        return {
          appearanceId: p.id,
          slot: p.slot,
          slotType: p.slotType,
          itemName: p.itemName,
          itemId: p.itemId,
          icon: iconLookup[p.itemId] || '',
          source: source ? { boss: source.boss, instance: source.instance } : null
        };
      })
    };
  }).filter(Boolean);

  // Sort
  const expansionOrder = ['Midnight', 'The War Within', 'Dragonflight', 'Shadowlands', 'Battle for Azeroth', 'Legion', 'Warlords of Draenor', 'Mists of Pandaria', 'Cataclysm', 'Wrath of the Lich King', 'The Burning Crusade', 'Classic', 'Unknown'];
  sets.sort((a, b) => {
    const ea = expansionOrder.indexOf(a.expansion);
    const eb = expansionOrder.indexOf(b.expansion);
    if (ea !== eb) return ea - eb;
    return a.name.localeCompare(b.name);
  });

  // Stats
  const byExpansion = {};
  const byClass = {};
  sets.forEach(s => {
    byExpansion[s.expansion] = (byExpansion[s.expansion] || 0) + 1;
    s.classes.forEach(c => { byClass[c] = (byClass[c] || 0) + 1; });
  });

  console.log(`\nFinal dataset:`);
  console.log(`  Total sets: ${sets.length}`);
  console.log(`  Total pieces: ${sets.reduce((sum, s) => sum + s.pieces.length, 0)}`);
  console.log(`  API requests: ${requestCount}`);
  console.log(`\n  By expansion:`);
  expansionOrder.forEach(e => { if (byExpansion[e]) console.log(`    ${e}: ${byExpansion[e]}`); });
  console.log(`\n  By class:`);
  Object.entries(byClass).sort((a, b) => b[1] - a[1]).forEach(([k, v]) => console.log(`    ${k}: ${v}`));

  const output = { generated: new Date().toISOString(), totalSets: sets.length, sets };
  const outputPath = path.join(__dirname, '..', 'data', 'transmog-sets.json');
  fs.writeFileSync(outputPath, JSON.stringify(output));
  const sizeMB = (fs.statSync(outputPath).size / 1024 / 1024).toFixed(1);
  console.log(`\nWritten to ${outputPath} (${sizeMB}MB)`);
}

main().catch(console.error);
