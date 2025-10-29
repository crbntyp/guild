#!/usr/bin/env node

/**
 * Mythic+ Season Data Capture Script
 *
 * This script checks if the current WoW Mythic+ season has ended,
 * and if so, captures all leaderboard data before it becomes unavailable.
 *
 * Usage:
 *   node scripts/capture-season-data.js
 *
 * Environment Variables Required:
 *   BNET_CLIENT_ID - Battle.net OAuth Client ID
 *   BNET_CLIENT_SECRET - Battle.net OAuth Client Secret
 */

import dotenv from 'dotenv';
import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

// Load environment variables
dotenv.config();

// Configuration
const CONFIG = {
  region: 'eu',
  locale: 'en_GB',
  connectedRealmId: 1084, // Tarren Mill EU
  clientId: process.env.BNET_CLIENT_ID,
  clientSecret: process.env.BNET_CLIENT_SECRET,
  apiUrl: 'https://eu.api.blizzard.com',
  oauthUrl: 'https://oauth.battle.net',
  namespace: {
    dynamic: 'dynamic-eu',
    static: 'static-eu'
  }
};

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.join(__dirname, '..');

// Global access token
let accessToken = null;

/**
 * Get OAuth access token using client credentials flow
 */
async function getAccessToken() {
  if (accessToken) return accessToken;

  console.log('🔑 Getting OAuth access token...');

  const credentials = Buffer.from(`${CONFIG.clientId}:${CONFIG.clientSecret}`).toString('base64');

  const response = await fetch(`${CONFIG.oauthUrl}/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });

  if (!response.ok) {
    throw new Error(`Failed to get access token: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  accessToken = data.access_token;
  console.log('✅ Access token acquired');
  return accessToken;
}

/**
 * Make a request to the Blizzard API
 */
async function makeApiRequest(endpoint, params = {}) {
  const token = await getAccessToken();

  const url = new URL(`${CONFIG.apiUrl}${endpoint}`);
  url.searchParams.append('locale', CONFIG.locale);

  // Add any additional params
  Object.entries(params).forEach(([key, value]) => {
    url.searchParams.append(key, value);
  });

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });

  if (!response.ok) {
    throw new Error(`API request failed: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

/**
 * Get current season information
 */
async function getCurrentSeason() {
  console.log('📡 Fetching current season information...');

  const seasonsData = await makeApiRequest(
    `/data/wow/mythic-keystone/season/index`,
    { namespace: CONFIG.namespace.dynamic }
  );

  if (!seasonsData.seasons || seasonsData.seasons.length === 0) {
    throw new Error('No seasons found');
  }

  // Get the last season (current/most recent)
  const currentSeasonRef = seasonsData.seasons[seasonsData.seasons.length - 1];
  const seasonId = currentSeasonRef.id;

  // Fetch full season details
  const seasonDetails = await makeApiRequest(
    `/data/wow/mythic-keystone/season/${seasonId}`,
    { namespace: CONFIG.namespace.dynamic }
  );

  console.log(`✅ Found Season ${seasonId}: ${seasonDetails.season_name}`);
  console.log(`   Start: ${new Date(seasonDetails.start_timestamp).toLocaleDateString()}`);

  if (seasonDetails.end_timestamp) {
    console.log(`   End: ${new Date(seasonDetails.end_timestamp).toLocaleDateString()}`);
  } else {
    console.log(`   End: Not yet announced`);
  }

  return seasonDetails;
}

/**
 * Get all dungeons for current season
 */
async function getCurrentSeasonDungeons() {
  console.log('📡 Fetching current season dungeons...');

  const dungeonsData = await makeApiRequest(
    `/data/wow/mythic-keystone/dungeon/index`,
    { namespace: CONFIG.namespace.dynamic }
  );

  const dungeonPromises = dungeonsData.dungeons.map(async (d) => {
    try {
      const details = await makeApiRequest(
        `/data/wow/mythic-keystone/dungeon/${d.id}`,
        { namespace: CONFIG.namespace.dynamic }
      );
      return { id: d.id, name: details.name };
    } catch (error) {
      console.warn(`   ⚠️ Could not fetch dungeon ${d.id}`);
      return null;
    }
  });

  const dungeons = (await Promise.all(dungeonPromises)).filter(d => d !== null);
  console.log(`✅ Found ${dungeons.length} dungeons`);
  dungeons.forEach(d => console.log(`   - ${d.name} (ID: ${d.id})`));

  return dungeons;
}

/**
 * Get leaderboard for a specific dungeon and period
 */
async function getDungeonLeaderboard(dungeonId, periodId, retries = 3) {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const leaderboard = await makeApiRequest(
        `/data/wow/connected-realm/${CONFIG.connectedRealmId}/mythic-leaderboard/${dungeonId}/period/${periodId}`,
        { namespace: CONFIG.namespace.dynamic }
      );

      if (leaderboard && leaderboard.leading_groups && leaderboard.leading_groups.length > 0) {
        return leaderboard;
      }
      return null;
    } catch (error) {
      if (attempt < retries - 1) {
        await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
      } else {
        console.warn(`   ⚠️ Failed to fetch dungeon ${dungeonId} after ${retries} attempts`);
        return null;
      }
    }
  }
  return null;
}

/**
 * Find the most recent period with data
 */
async function findActivePeriod(seasonDetails, dungeonId) {
  if (!seasonDetails.periods || seasonDetails.periods.length === 0) {
    throw new Error('No periods found in season');
  }

  // Try periods from most recent to oldest
  const periodsToTry = seasonDetails.periods.map(p => p.id).reverse();

  for (const periodId of periodsToTry) {
    try {
      const testLeaderboard = await makeApiRequest(
        `/data/wow/connected-realm/${CONFIG.connectedRealmId}/mythic-leaderboard/${dungeonId}/period/${periodId}`,
        { namespace: CONFIG.namespace.dynamic }
      );

      if (testLeaderboard && testLeaderboard.leading_groups && testLeaderboard.leading_groups.length > 0) {
        return periodId;
      }
    } catch (error) {
      // Period not available, continue
    }
  }

  throw new Error('No period with data found');
}

/**
 * Capture all leaderboard data for a season
 */
async function captureSeasonData(seasonDetails) {
  console.log(`\n📥 Capturing data for Season ${seasonDetails.id}...`);

  // Get all dungeons
  const dungeons = await getCurrentSeasonDungeons();

  // Find a period with data
  console.log('\n🔍 Finding most recent period with data...');
  const periodId = await findActivePeriod(seasonDetails, dungeons[0].id);
  console.log(`✅ Using period ${periodId}`);

  // Fetch all dungeon leaderboards
  console.log('\n📥 Fetching leaderboards for all dungeons...');
  const leaderboardPromises = dungeons.map(async (dungeon) => {
    console.log(`   Fetching ${dungeon.name}...`);
    const leaderboard = await getDungeonLeaderboard(dungeon.id, periodId);

    if (leaderboard) {
      console.log(`   ✅ ${dungeon.name}: ${leaderboard.leading_groups.length} runs`);
      return {
        dungeonId: dungeon.id,
        dungeonName: dungeon.name,
        leaderboard: leaderboard
      };
    } else {
      console.log(`   ❌ ${dungeon.name}: No data`);
      return null;
    }
  });

  const leaderboards = (await Promise.allSettled(leaderboardPromises))
    .filter(result => result.status === 'fulfilled' && result.value !== null)
    .map(result => result.value);

  console.log(`\n✅ Captured ${leaderboards.length} dungeon leaderboards`);

  // Prepare data structure
  const captureData = {
    seasonId: seasonDetails.id,
    seasonName: seasonDetails.season_name,
    startTimestamp: seasonDetails.start_timestamp,
    endTimestamp: seasonDetails.end_timestamp,
    periodId: periodId,
    capturedAt: Date.now(),
    dungeonCount: leaderboards.length,
    dungeons: leaderboards
  };

  return captureData;
}

/**
 * Save captured data to file
 */
async function saveSeasonData(data) {
  const dataDir = path.join(PROJECT_ROOT, 'data', 'seasons');
  await fs.mkdir(dataDir, { recursive: true });

  const filename = `season-${data.seasonId}.json`;
  const filepath = path.join(dataDir, filename);

  await fs.writeFile(filepath, JSON.stringify(data, null, 2), 'utf-8');

  console.log(`\n💾 Data saved to: data/seasons/${filename}`);
  console.log(`   File size: ${(JSON.stringify(data).length / 1024).toFixed(2)} KB`);
}

/**
 * Check if season data already exists
 */
async function seasonDataExists(seasonId) {
  const filepath = path.join(PROJECT_ROOT, 'data', 'seasons', `season-${seasonId}.json`);
  try {
    await fs.access(filepath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Main execution
 */
async function main() {
  console.log('🚀 Mythic+ Season Data Capture Script');
  console.log('=====================================\n');

  try {
    // Get current season info
    const season = await getCurrentSeason();

    // Check if season has ended
    const hasEnded = season.end_timestamp && Date.now() > season.end_timestamp;
    const isAboutToEnd = season.end_timestamp && (season.end_timestamp - Date.now()) < (7 * 24 * 60 * 60 * 1000); // Within 7 days

    if (!hasEnded && !isAboutToEnd) {
      console.log('\n✅ Season is still active and not ending soon');
      console.log('   No action needed - data will be captured when season ends');
      return;
    }

    if (isAboutToEnd && !hasEnded) {
      console.log('\n⚠️ Season is ending within 7 days!');
      console.log('   Consider capturing data soon');
    }

    // Check if we already have this season's data
    const exists = await seasonDataExists(season.id);
    if (exists) {
      console.log(`\n✅ Season ${season.id} data already captured`);
      console.log('   No action needed');
      return;
    }

    // Capture the data
    if (hasEnded) {
      console.log('\n🎯 Season has ended - capturing data now!');
    } else {
      console.log('\n🎯 Capturing season data (season ending soon)');
    }

    const data = await captureSeasonData(season);
    await saveSeasonData(data);

    console.log('\n✅ Season data capture complete!');

  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Run the script
main();
