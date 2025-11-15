/**
 * Build Mount ID → Spell ID Mapping from Wowhead
 *
 * This script scrapes Wowhead to build a mapping of mount IDs to spell IDs
 * for Wowhead tooltip integration.
 *
 * Usage: node scripts/build-spell-id-mapping.js
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'mount-spell-ids.json');
const MOUNTS_FILE = path.join(__dirname, '..', 'data', 'mounts-generated.json');

// Rate limiting
const RATE_LIMIT_DELAY = 1000; // 1 second between requests (be nice to Wowhead)
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Scrape Wowhead for spell ID and icon by mount name with timeout
 */
async function getSpellDataFromWowhead(mountName) {
  const searchUrl = `https://www.wowhead.com/?search=${encodeURIComponent(mountName)}`;

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
      },
      signal: controller.signal
    });

    clearTimeout(timeoutId);

    const html = await response.text();

    // Look for spell link in format: /spell=123456
    const spellMatch = html.match(/\/spell=(\d+)/);

    // Look for icon in format: icon: "ability_mount_whatever" or Icon.create('ability_mount_whatever'
    const iconMatch = html.match(/(?:icon:\s*["']|Icon\.create\(["'])([a-z0-9_]+)/i);

    if (spellMatch) {
      return {
        spellId: parseInt(spellMatch[1]),
        icon: iconMatch ? iconMatch[1] : null
      };
    }

    return null;
  } catch (error) {
    if (error.name === 'AbortError') {
      console.error(`⏱️  Timeout fetching ${mountName}`);
    } else {
      console.error(`❌ Error fetching ${mountName}:`, error.message);
    }
    return null;
  }
}

/**
 * Main function
 */
async function buildSpellIdMapping() {
  console.log('🔍 Building Mount ID → Spell ID mapping from Wowhead...\n');

  // Load mounts data
  const mountsData = JSON.parse(await fs.readFile(MOUNTS_FILE, 'utf-8'));
  const mounts = Object.values(mountsData.mounts);

  console.log(`📦 Found ${mounts.length} mounts to process\n`);

  // Load existing mapping if it exists
  let mapping = {};
  try {
    const existingMapping = await fs.readFile(OUTPUT_FILE, 'utf-8');
    mapping = JSON.parse(existingMapping);
    console.log(`✅ Loaded ${Object.keys(mapping).length} existing mappings\n`);
  } catch (error) {
    console.log('📝 Starting fresh mapping\n');
  }

  let processed = 0;
  let found = 0;
  let foundWithIcon = 0;
  let notFound = 0;
  let skipped = 0;

  for (const mount of mounts) {
    // Skip if already processed
    if (mapping[mount.id]) {
      skipped++;
      continue;
    }

    // Rate limiting
    if (processed > 0) {
      await sleep(RATE_LIMIT_DELAY);
    }

    console.log(`Processing ${processed + 1 + skipped}/${mounts.length}: ${mount.name}...`);

    const spellData = await getSpellDataFromWowhead(mount.name);

    if (spellData) {
      mapping[mount.id] = {
        spellId: spellData.spellId,
        icon: spellData.icon
      };
      found++;
      if (spellData.icon) {
        foundWithIcon++;
        console.log(`  ✅ Found spell ID: ${spellData.spellId}, icon: ${spellData.icon}`);
      } else {
        console.log(`  ✅ Found spell ID: ${spellData.spellId} (no icon)`);
      }
    } else {
      // Fallback: assume mount ID = spell ID
      mapping[mount.id] = {
        spellId: mount.id,
        icon: null
      };
      notFound++;
      console.log(`  ⚠️  No data found, using mount ID as fallback`);
    }

    processed++;

    // Save progress every 50 mounts
    if (processed % 50 === 0) {
      await fs.writeFile(OUTPUT_FILE, JSON.stringify(mapping, null, 2));
      console.log(`\n💾 Progress saved (${processed}/${mounts.length})\n`);
    }
  }

  // Save final result
  await fs.writeFile(OUTPUT_FILE, JSON.stringify(mapping, null, 2));

  console.log(`\n✅ Mapping complete!`);
  console.log(`📊 Found: ${found} (${foundWithIcon} with icons), Not found: ${notFound}, Skipped: ${skipped}, Processed: ${processed}, Total: ${mounts.length}`);
  console.log(`💾 Saved to: ${OUTPUT_FILE}`);
}

// Run
buildSpellIdMapping().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
