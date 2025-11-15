/**
 * Mount Data Generator
 *
 * This script fetches all mount data from the Battle.net API and generates
 * a complete mount database with icons, names, and expansion data.
 *
 * Run once per patch/expansion to update the mount database.
 *
 * Usage: node scripts/generate-mount-data.js
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_ID = process.env.BNET_CLIENT_ID;
const CLIENT_SECRET = process.env.BNET_CLIENT_SECRET;
const REGION = 'eu';
const LOCALE = 'en_US';
const NAMESPACE_STATIC = 'static-eu';

// Output file
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'mounts-generated.json');

// Rate limiting
const RATE_LIMIT_DELAY = 50; // ms between requests
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Get OAuth access token
 */
async function getAccessToken() {
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');

  const response = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  const data = await response.json();
  return data.access_token;
}

/**
 * Fetch mount index (list of all mount IDs)
 */
async function fetchMountIndex(accessToken) {
  const url = `https://${REGION}.api.blizzard.com/data/wow/mount/index?namespace=${NAMESPACE_STATIC}&locale=${LOCALE}`;

  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${accessToken}` }
  });

  const data = await response.json();
  return data.mounts || [];
}

/**
 * Fetch individual mount data
 */
async function fetchMountData(mountId, accessToken) {
  const url = `https://${REGION}.api.blizzard.com/data/wow/mount/${mountId}?namespace=${NAMESPACE_STATIC}&locale=${LOCALE}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      console.warn(`Failed to fetch mount ${mountId}: ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.error(`Error fetching mount ${mountId}:`, error.message);
    return null;
  }
}

/**
 * Fetch creature display image
 */
async function fetchCreatureDisplayImage(creatureDisplayId, accessToken) {
  const url = `https://${REGION}.api.blizzard.com/data/wow/media/creature-display/${creatureDisplayId}?namespace=${NAMESPACE_STATIC}&locale=${LOCALE}`;

  try {
    const response = await fetch(url, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });

    if (!response.ok) {
      return null;
    }

    const data = await response.json();
    // Find the zoom asset
    const zoomAsset = data.assets?.find(asset => asset.key === 'zoom');
    return zoomAsset?.value || null;
  } catch (error) {
    console.error(`Error fetching creature display ${creatureDisplayId}:`, error.message);
    return null;
  }
}

/**
 * Determine expansion based on mount ID ranges
 * This is a heuristic fallback for when API doesn't provide expansion data
 */
function getExpansionFromId(mountId) {
  // The War Within (11.x) - IDs 1750+
  if (mountId >= 1750) return 10;

  // Dragonflight (10.x) - IDs 1500-1749
  if (mountId >= 1500) return 9;

  // Shadowlands (9.x) - IDs 1400-1499
  if (mountId >= 1400) return 8;

  // Battle for Azeroth (8.x) - IDs 1000-1399
  if (mountId >= 1000) return 7;

  // Legion (7.x) - IDs 750-999
  if (mountId >= 750) return 6;

  // Warlords of Draenor (6.x) - IDs 550-749
  if (mountId >= 550) return 5;

  // Mists of Pandaria (5.x) - IDs 450-549
  if (mountId >= 450) return 4;

  // Cataclysm (4.x) - IDs 370-449
  if (mountId >= 370) return 3;

  // Wrath of the Lich King (3.x) - IDs 250-369
  if (mountId >= 250) return 2;

  // The Burning Crusade (2.x) - IDs 100-249
  if (mountId >= 100) return 1;

  // Classic (1.x) - IDs < 100
  return 0;
}

/**
 * Main generation function
 */
async function generateMountData() {
  console.log('🐎 Starting mount data generation...\n');

  // Step 1: Get access token
  console.log('🔑 Getting Battle.net OAuth token...');
  const accessToken = await getAccessToken();
  console.log('✅ Token acquired\n');

  // Step 2: Fetch mount index
  console.log('📋 Fetching mount index...');
  const mountIndex = await fetchMountIndex(accessToken);
  console.log(`✅ Found ${mountIndex.length} mounts\n`);

  // Step 4: Fetch individual mount data
  console.log('🔄 Fetching individual mount data...');
  const mounts = [];
  let processed = 0;
  let failed = 0;

  for (const mountRef of mountIndex) {
    const mountId = mountRef.id;

    // Rate limiting
    await sleep(RATE_LIMIT_DELAY);

    const mountData = await fetchMountData(mountId, accessToken);

    if (mountData) {
      // Fetch creature display image
      let imageUrl = null;
      if (mountData.creature_displays && mountData.creature_displays.length > 0) {
        const creatureDisplayId = mountData.creature_displays[0].id;

        // Rate limiting for creature display fetch
        await sleep(RATE_LIMIT_DELAY);

        imageUrl = await fetchCreatureDisplayImage(creatureDisplayId, accessToken);
      }

      // Determine expansion based on mount ID (heuristic)
      const expansion = getExpansionFromId(mountId);

      mounts.push({
        id: mountData.id,
        name: mountData.name,
        description: mountData.description || '',
        image: imageUrl, // Store image URL instead of icon
        source: mountData.source?.name || 'Unknown',
        faction: mountData.faction?.type || 'BOTH',
        expansion: expansion // Heuristic-based expansion (fallback)
      });

      processed++;
      if (processed % 50 === 0) {
        console.log(`  Processed ${processed}/${mountIndex.length}...`);
      }
    } else {
      failed++;
    }
  }

  console.log(`\n✅ Processed ${processed} mounts`);
  if (failed > 0) {
    console.log(`⚠️  Failed to fetch ${failed} mounts`);
  }

  // Step 5: Save to file
  console.log('\n💾 Saving to file...');

  const output = {
    generatedAt: new Date().toISOString(),
    version: '1.0.0',
    totalMounts: mounts.length,
    mounts: mounts.reduce((acc, mount) => {
      acc[mount.id] = mount;
      return acc;
    }, {})
  };

  await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2));
  console.log(`✅ Saved ${mounts.length} mounts to ${OUTPUT_FILE}`);

  console.log('\n✨ Mount data generation complete!');
}

// Run the generator
generateMountData().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
