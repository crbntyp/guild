/**
 * Journal Raid Dumper
 *
 * Walks the Blizzard journal API from expansion → raid → encounter and
 * writes every raid + its bosses to a JSON file we can use as a custom
 * slug/portrait map.
 *
 * Usage:
 *   node scripts/dump-journal-raids.js              # latest expansion only
 *   node scripts/dump-journal-raids.js --all        # every expansion
 *   node scripts/dump-journal-raids.js --name=Midnight
 *
 * Output: data/journal-raids.json
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
const NAMESPACE = 'static-eu';
const OUTPUT = path.join(__dirname, '..', 'data', 'journal-raids.json');

const RATE_DELAY = 50;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function getAccessToken() {
  if (!CLIENT_ID || !CLIENT_SECRET) {
    throw new Error('Missing BNET_CLIENT_ID / BNET_CLIENT_SECRET in .env');
  }
  const credentials = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64');
  const res = await fetch(`https://${REGION}.battle.net/oauth/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${credentials}`,
      'Content-Type': 'application/x-www-form-urlencoded'
    },
    body: 'grant_type=client_credentials'
  });
  const data = await res.json();
  return data.access_token;
}

async function apiGet(pathname, token) {
  const sep = pathname.includes('?') ? '&' : '?';
  const url = `https://${REGION}.api.blizzard.com${pathname}${sep}namespace=${NAMESPACE}&locale=${LOCALE}`;
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  if (!res.ok) throw new Error(`${res.status} ${res.statusText} for ${url}`);
  return res.json();
}

function slugifyName(name) {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/[,.!?:;()]/g, '')
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

async function run() {
  const args = process.argv.slice(2);
  const dumpAll = args.includes('--all');
  const nameArg = args.find((a) => a.startsWith('--name='))?.split('=')[1];

  console.log('⚡ Authenticating with Battle.net…');
  const token = await getAccessToken();

  console.log('⚡ Fetching expansion index…');
  const index = await apiGet('/data/wow/journal-expansion/index', token);
  let expansions = index.tiers || [];

  if (nameArg) {
    const filtered = expansions.filter((e) =>
      e.name?.toLowerCase().includes(nameArg.toLowerCase())
    );
    if (!filtered.length) {
      console.error(`No expansion matched "${nameArg}". Available:`);
      expansions.forEach((e) => console.error(`  - ${e.name} (id: ${e.id})`));
      process.exit(1);
    }
    expansions = filtered;
  } else if (!dumpAll) {
    // Default: the most recent real expansion.
    // The index array isn't sorted — sort by numeric id descending and skip
    // the "Current Season" meta entry which tracks whatever's live.
    const sorted = [...expansions]
      .filter((e) => !/current season/i.test(e.name || ''))
      .sort((a, b) => (b.id || 0) - (a.id || 0));
    expansions = sorted.length ? [sorted[0]] : [expansions[expansions.length - 1]];
  }

  const result = [];

  for (const exp of expansions) {
    console.log(`\n── ${exp.name} (id ${exp.id}) ──`);
    await sleep(RATE_DELAY);
    const full = await apiGet(`/data/wow/journal-expansion/${exp.id}`, token);
    const raids = full.raids || [];
    const expOut = { id: exp.id, name: exp.name, raids: [] };

    for (const raidRef of raids) {
      await sleep(RATE_DELAY);
      try {
        const inst = await apiGet(`/data/wow/journal-instance/${raidRef.id}`, token);
        const encounters = (inst.encounters || []).map((e) => ({
          id: e.id,
          name: e.name,
          slug: slugifyName(e.name),
          wowheadSlug: null  // ← fill in manually for portrait URLs
        }));
        expOut.raids.push({
          id: inst.id,
          name: inst.name,
          slug: slugifyName(inst.name),
          encounters
        });
        console.log(`  ${inst.name.padEnd(36)} ${encounters.length} bosses`);
      } catch (err) {
        console.warn(`  ! failed ${raidRef.name}: ${err.message}`);
      }
    }

    result.push(expOut);
  }

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, JSON.stringify(result, null, 2));
  console.log(`\n✅ Wrote ${OUTPUT}`);
}

run().catch((err) => {
  console.error('❌', err);
  process.exit(1);
});
