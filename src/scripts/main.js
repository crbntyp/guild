// Drowsy Dragons — dedicated guild landing page
import PageInitializer from './utils/page-initializer.js';
import characterModal from './components/character-modal.js';
import wowAPI from './api/wow-api.js';
import config from './config.js';
import authService from './services/auth.js';
import { getClassColor } from './utils/wow-constants.js';
import { getClassIconUrl, getSpecIconUrl } from './utils/wow-icons.js';

console.log('⚡ Drowsy Dragons home initialized');

const CLASS_NAMES = {
  1: 'Warrior', 2: 'Paladin', 3: 'Hunter', 4: 'Rogue', 5: 'Priest',
  6: 'Death Knight', 7: 'Shaman', 8: 'Mage', 9: 'Warlock', 10: 'Monk',
  11: 'Druid', 12: 'Demon Hunter', 13: 'Evoker'
};

function classIcon(classId) {
  const name = (CLASS_NAMES[classId] || 'warrior').toLowerCase().replace(' ', '');
  return `https://wow.zamimg.com/images/wow/icons/large/classicon_${name}.jpg`;
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

// render.worldofwarcraft.com zone tile URL — works for current raids/dungeons
function zoneBannerUrl(instanceName) {
  const slug = slugifyName(instanceName);
  return slug ? `https://render.worldofwarcraft.com/us/zones/${slug}-small.jpg` : null;
}

// Instances to exclude from the Recent Kills feed — these are world-boss
// style instances that don't represent a proper raid event.
const EXCLUDED_INSTANCE_IDS = new Set([1312]); // "Midnight" world bosses

// Custom journal map — loaded once, used to look up each encounter by id and
// return { instanceName, wowheadSlug } so we can render boss portraits from
// Wowhead's CDN where we've hand-mapped a slug.
let journalMapPromise = null;
async function getJournalMap() {
  if (!journalMapPromise) {
    journalMapPromise = fetch('data/journal-raids.json')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const map = new Map();
        for (const exp of data) {
          for (const raid of (exp.raids || [])) {
            for (const enc of (raid.encounters || [])) {
              map.set(enc.id, {
                bossName: enc.name,
                bossSlug: enc.slug,
                wowheadSlug: enc.wowheadSlug,
                instanceId: raid.id,
                instanceName: raid.name,
                instanceSlug: raid.slug
              });
            }
          }
        }
        return map;
      })
      .catch(() => new Map());
  }
  return journalMapPromise;
}

function bossPortraitUrl(wowheadSlug) {
  return wowheadSlug
    ? `https://wow.zamimg.com/images/wow/journal/ui-ej-boss-${wowheadSlug}.png`
    : null;
}

function timeAgo(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.floor(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.floor(day / 30);
  return `${mo}mo ago`;
}

// Long-form relative time: "1 day ago", "3 hours ago", "2 months ago"
function timeAgoLong(ts) {
  if (!ts) return '';
  const diff = Date.now() - ts;
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return 'just now';
  const plural = (n, w) => `${n} ${w}${n === 1 ? '' : 's'} ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return plural(min, 'minute');
  const hr = Math.floor(min / 60);
  if (hr < 24) return plural(hr, 'hour');
  const day = Math.floor(hr / 24);
  if (day < 30) return plural(day, 'day');
  const mo = Math.floor(day / 30);
  if (mo < 12) return plural(mo, 'month');
  const yr = Math.floor(mo / 12);
  return plural(yr, 'year');
}

const HERO_BANNERS = [
  'https://render.worldofwarcraft.com/us/zones/the-waking-shores.jpg',
  'https://render.worldofwarcraft.com/us/zones/valdrakken.jpg',
  'https://render.worldofwarcraft.com/us/zones/thaldraszus.jpg',
  'https://render.worldofwarcraft.com/us/zones/the-azure-span.jpg'
];

const DIFFICULTY_LETTER = {
  'Normal': 'N',
  'Heroic': 'H',
  'Mythic': 'M',
  'Raid Finder': 'RF'
};
const DIFFICULTY_RANK = { 'Normal': 1, 'Heroic': 2, 'Mythic': 3, 'Raid Finder': 0 };

// Walk the activity feed + journal map, build per-instance progression:
// { kills: Set<encounterId>, total, difficulty, name }
async function buildRaidProgression(activity) {
  if (!activity?.activities) return [];
  const journalMap = await getJournalMap();

  const byInstance = new Map();
  for (const a of activity.activities) {
    if (a.activity?.type !== 'ENCOUNTER' || !a.encounter_completed) continue;
    const encId = a.encounter_completed.encounter?.id;
    const entry = journalMap.get(encId);
    if (!entry || EXCLUDED_INSTANCE_IDS.has(entry.instanceId)) continue;

    let inst = byInstance.get(entry.instanceId);
    if (!inst) {
      // Count total bosses in this instance from the journal map
      let total = 0;
      for (const e of journalMap.values()) {
        if (e.instanceId === entry.instanceId) total++;
      }
      inst = {
        id: entry.instanceId,
        name: entry.instanceName,
        total,
        kills: new Set(),
        difficulty: null
      };
      byInstance.set(entry.instanceId, inst);
    }
    inst.kills.add(encId);
    const mode = a.encounter_completed.mode?.name;
    if (mode && (inst.difficulty == null || (DIFFICULTY_RANK[mode] || 0) > (DIFFICULTY_RANK[inst.difficulty] || 0))) {
      inst.difficulty = mode;
    }
  }

  return Array.from(byInstance.values())
    .map(i => ({ ...i, kills: i.kills.size }))
    .sort((a, b) => b.kills - a.kills);
}

function buildGuildGlance(roster) {
  if (!roster?.members) return null;
  const classCounts = {};
  let alliance = 0, horde = 0;
  for (const m of roster.members) {
    const cid = m.character?.playable_class?.id;
    if (cid) classCounts[cid] = (classCounts[cid] || 0) + 1;
    const faction = m.character?.faction?.type;
    if (faction === 'ALLIANCE') alliance++;
    else if (faction === 'HORDE') horde++;
  }
  const total = roster.members.length;
  return { classCounts, alliance, horde, total };
}

function renderGuildGlance(data) {
  if (!data) return '';
  const { classCounts, alliance, horde, total } = data;
  if (!total) return '';

  const sorted = Object.entries(classCounts)
    .map(([id, count]) => ({
      id: Number(id),
      count,
      pct: (count / total) * 100,
      name: CLASS_NAMES[Number(id)] || 'Unknown',
      color: getClassColor ? getClassColor(Number(id)) : '#fff'
    }))
    .sort((a, b) => b.count - a.count);

  const legend = sorted.map(c => `
    <span class="dd-glance-legend-item">
      <span class="dd-glance-legend-dot" style="background:${c.color}"></span>
      <span class="dd-glance-legend-name">${c.name}</span>
      <span class="dd-glance-legend-count">${c.count}</span>
    </span>
  `).join('');

  return `
    <div class="dd-glance">
      <div class="dd-glance-footer">
        <div class="dd-glance-legend">${legend}</div>
        <div class="dd-glance-factions">
          <span class="dd-glance-faction dd-glance-alliance"><strong>${alliance}</strong> Alliance</span>
          <span class="dd-glance-faction dd-glance-horde"><strong>${horde}</strong> Horde</span>
        </div>
      </div>
    </div>
  `;
}

async function renderHero(guildInfo, activity) {
  const memberCount = guildInfo?.member_count || 0;
  const banner = HERO_BANNERS[0];
  const name = guildInfo?.name || config.guild.name;
  const progression = await buildRaidProgression(activity);
  const progressionHtml = progression.map(p => {
    const letter = DIFFICULTY_LETTER[p.difficulty] || '';
    const diffClass = p.difficulty ? `dd-diff-${p.difficulty.toLowerCase().replace(/\s+/g, '-')}` : '';
    return `<span class="dd-hero-prog"><strong>${p.kills}/${p.total}</strong> ${p.name}${letter ? ` <em class="${diffClass}">${letter}</em>` : ''}</span>`;
  }).join('<span class="dd-hero-stat-sep">·</span>');

  return `
    <section class="dd-hero">
      <div class="dd-hero-banner" style="background-image:url('${banner}')">
        <div class="dd-hero-scrim"></div>
      </div>
      <div class="dd-hero-content">
        <p class="dd-hero-tagline">"A restful hoard of heroes, slumbering between conquests."</p>
        <h1 class="dd-hero-name">
          <span class="dd-hero-name-word">${name.split(' ')[0] || name}</span>
          <span class="dd-hero-name-word dd-hero-name-word-alt">${name.split(' ').slice(1).join(' ') || ''}</span>
        </h1>
        <div class="dd-hero-stats">
          <span class="dd-hero-stat"><strong>${memberCount}</strong> Dragons and counting</span>
          ${progression.length ? `<span class="dd-hero-stat-sep">·</span>${progressionHtml}` : ''}
        </div>
        <div id="dd-champions-pills-slot">
          <div class="dd-champ-pills dd-champ-pills-loading">
            <div class="dd-champ-pill-skeleton"></div>
            <div class="dd-champ-pill-skeleton"></div>
            <div class="dd-champ-pill-skeleton"></div>
            <div class="dd-champ-pill-skeleton"></div>
          </div>
        </div>
      </div>
    </section>
  `;
}

const RANK_LABELS = {
  0: 'Guild Master',
  1: 'Officer',
  2: 'Officer',
  3: 'Veteran',
  4: 'Raider',
  5: 'Member'
};

function renderMembers(roster) {
  if (!roster || !roster.members) return '';

  // Level-90 characters sorted by guild rank (lowest rank first = officers/mains).
  const MAX_LEVEL = 90;
  const latest = [...roster.members]
    .filter(m => m.character?.level >= MAX_LEVEL)
    .sort((a, b) => (a.rank ?? 99) - (b.rank ?? 99))
    .slice(0, 12);

  if (!latest.length) return '';

  return `
    <section class="dd-section dd-section-members">
      <header class="dd-section-header">
        <h2 class="dd-section-title">The Flight</h2>
        <p class="dd-section-sub">Twelve of the dragons leading the charge</p>
      </header>
      <div class="dd-members-grid">
        ${latest.map((m, i) => {
          const c = m.character;
          const classId = c.playable_class?.id;
          const color = getClassColor ? getClassColor(classId) : '#fff';
          const className = CLASS_NAMES[classId] || '';
          const rankLabel = RANK_LABELS[m.rank] || `Rank ${m.rank}`;
          return `
            <article class="dd-member-card" style="--class-color:${color}; --delay:${i * 0.04}s">
              <div class="dd-member-rank">#${String(i + 1).padStart(2, '0')}</div>
              <div class="dd-member-inner">
                <div class="dd-member-icon">
                  <img src="${classIcon(classId)}" alt="${className}" />
                </div>
                <div class="dd-member-info">
                  <h3 class="dd-member-name">${c.name}</h3>
                  <div class="dd-member-meta">
                    <span>Lvl ${c.level || '?'}</span>
                    <span class="dd-member-sep">·</span>
                    <span>${className}</span>
                  </div>
                  <div class="dd-member-ago">${rankLabel}</div>
                </div>
              </div>
            </article>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

// Pull cached guild-clears synchronously from localStorage so kill cards can
// stamp AOTC/CE badges without waiting for the ledger fetch.
function getCachedGuildClears() {
  try {
    const cached = localStorage.getItem(LEDGER_CACHE_KEY);
    if (!cached) return {};
    const parsed = JSON.parse(cached);
    if (parsed.expires < Date.now()) return {};
    return parsed.data?.guildClears || {};
  } catch (e) {
    return {};
  }
}

async function renderActivity(activity) {
  if (!activity || !activity.activities) return '';

  // Look everything up in the locally-dumped journal map first so we can
  // filter out excluded instances (world bosses) before slicing.
  const journalMap = await getJournalMap();

  const kills = activity.activities
    .filter(a => a.activity?.type === 'ENCOUNTER' && a.encounter_completed)
    .filter(a => {
      const encId = a.encounter_completed?.encounter?.id;
      const entry = encId ? journalMap.get(encId) : null;
      return !entry || !EXCLUDED_INSTANCE_IDS.has(entry.instanceId);
    })
    .slice(0, 10);

  if (!kills.length) return '';

  const guildClears = getCachedGuildClears();
  const enriched = kills.map((item) => {
    const encId = item.encounter_completed?.encounter?.id;
    const entry = encId ? journalMap.get(encId) : null;
    const instanceName = entry?.instanceName || null;
    const portrait = bossPortraitUrl(entry?.wowheadSlug);
    const banner = zoneBannerUrl(instanceName);
    const clear = instanceName ? guildClears[instanceName] : null;
    return { item, banner, portrait, instanceName, clear };
  });

  return `
    <section class="dd-section dd-section-activity">
      <header class="dd-section-header">
        <h2 class="dd-section-title">Recent Progression</h2>
        <p class="dd-section-sub">The last ten bosses to fall at the feet of the dragons</p>
      </header>
      <div class="dd-kill-scroll">
        <div class="dd-kill-track">
          ${enriched.map(({ item, banner, portrait, instanceName, clear }, i) => {
            const ts = item.timestamp;
            const enc = item.encounter_completed.encounter?.name || 'Unknown Boss';
            const mode = item.encounter_completed.mode?.name || '';
            const modeSlug = mode.toLowerCase().replace(/\s+/g, '-');
            const bannerUrl = typeof banner === 'string' ? banner : null;
            const portraitUrl = typeof portrait === 'string' ? portrait : null;
            const style = bannerUrl ? `background-image:url('${bannerUrl}')` : '';
            // Portrait pill — always rendered so the layout stays consistent.
            // Shows real image if we've mapped a wowheadSlug, otherwise shows a
            // placeholder icon until the map is filled in.
            const portraitMarkup = portraitUrl
              ? `<div class="dd-kill-portrait"><img src="${portraitUrl}" alt="${enc}" onerror="this.parentNode.classList.add('is-placeholder');this.remove()" /></div>`
              : `<div class="dd-kill-portrait is-placeholder"><i class="las la-skull"></i></div>`;
            return `
              <article class="dd-kill-card" style="--delay:${i * 0.05}s">
                <div class="void-cinders"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
                <div class="dd-kill-art ${bannerUrl ? '' : 'dd-kill-art-fallback'}" style="${style}">
                  ${!bannerUrl ? '<i class="las la-dungeon"></i>' : ''}
                  <div class="dd-kill-art-scrim"></div>
                  ${mode ? `<span class="raid-difficulty-badge difficulty-${modeSlug}">${mode}</span>` : ''}
                  <div class="dd-kill-art-title">
                    ${portraitMarkup}
                    <div class="dd-kill-art-text">
                      <h3 class="dd-kill-name">${enc}</h3>
                      ${instanceName ? `<div class="dd-kill-instance">${instanceName}${clear?.ce ? ' <span class="dd-clear-badge dd-clear-ce">CE</span>' : clear?.aotc ? ' <span class="dd-clear-badge dd-clear-aotc">AOTC</span>' : ''}</div>` : ''}
                    </div>
                  </div>
                </div>
                <div class="dd-kill-body">
                  <div class="dd-kill-meta">
                    <span class="dd-kill-ago">Downed ${timeAgoLong(ts)}</span>
                  </div>
                </div>
              </article>
            `;
          }).join('')}
        </div>
      </div>
    </section>
  `;
}

function renderError(message) {
  return `
    <div class="dd-error">
      <i class="las la-exclamation-triangle"></i>
      <h2>Couldn't load guild data</h2>
      <p>${message || 'Please try again later.'}</p>
    </div>
  `;
}

function renderLoading() {
  return `
    <div class="dd-loading">
      <i class="las la-circle-notch la-spin la-3x"></i>
      <p>Loading Drowsy Dragons...</p>
    </div>
  `;
}

async function loadCritterTracker() {
  if (!authService.isAuthenticated()) return;
  const tracker = document.getElementById('critter-tracker');
  if (!tracker) return;

  try {
    const accountService = (await import('./services/account-service.js')).default;
    const battlenetClient = (await import('./api/battlenet-client.js')).default;
    const characters = await accountService.getAccountCharacters();

    const CRITTER_STAT_ID = 108;
    const TARGET = 50000;

    const statPromises = characters.map(async (char) => {
      try {
        const realm = char.realm?.slug;
        const name = encodeURIComponent(char.name.toLowerCase());
        if (!realm || !name) return 0;
        const data = await battlenetClient.request(
          `/profile/wow/character/${realm}/${name}/achievements/statistics`,
          { params: { namespace: config.api.namespace.profile } }
        );
        for (const cat of (data.categories || [])) {
          for (const sub of (cat.sub_categories || [])) {
            for (const stat of (sub.statistics || [])) {
              if (stat.id === CRITTER_STAT_ID) return stat.quantity || 0;
            }
          }
        }
        return 0;
      } catch (e) { return 0; }
    });

    const counts = await Promise.all(statPromises);
    const total = counts.reduce((a, b) => a + b, 0);
    const percent = Math.min(100, (total / TARGET) * 100);
    const remaining = Math.max(0, TARGET - total);

    tracker.innerHTML = `
      <div class="critter-header">
        <span class="critter-label">Critter Kills</span>
        <span class="critter-count">${total.toLocaleString()} / ${TARGET.toLocaleString()}</span>
      </div>
      <div class="critter-bar">
        <div class="critter-bar-fill" style="width: ${percent}%"></div>
      </div>
      <div class="critter-bar-remaining">${remaining > 0 ? `${remaining.toLocaleString()} to go` : 'Complete!'}</div>
    `;
  } catch (e) {
    console.error('Critter tracker error:', e);
  }
}

// ============================================================
// The Dragons' Ledger — live stats from character endpoints
// ============================================================
const LEDGER_CACHE_KEY = 'dd:guild-ledger:v10';
const LEDGER_TTL = 60 * 60 * 1000; // 1 hour

async function fetchGuildLedger(roster) {
  // Cache temporarily disabled for debugging
  console.log('[ledger] starting fresh fetch (cache bypassed)');

  if (!roster?.members) {
    console.log('[ledger] no roster members, aborting');
    return { topGear: [], topMplus: [], topProgression: [] };
  }
  console.log('[ledger] total roster members:', roster.members.length);

  // Filter to current max level (90). last_login_timestamp isn't on the roster
  // endpoint — that's per-character profile. We sort by rank (low rank = officer
  // / main) as a proxy for "active raider" and cap at 60.
  const MAX_LEVEL = 90;
  const active = roster.members
    .filter(m => m.character?.level >= MAX_LEVEL)
    .sort((a, b) => (a.rank || 0) - (b.rank || 0));
  console.log('[ledger] level 90 members:', active.length);

  // Cap at the top 60 by rank. Each fires 3 endpoints, so ~180 requests total.
  const targets = active.slice(0, 60);

  const journalMap = await getJournalMap();

  // Resolve the current season id once
  let currentSeasonId = null;
  try {
    const seasons = await wowAPI.getMythicKeystoneSeasons();
    currentSeasonId = seasons?.current_season?.id
      || seasons?.seasons?.[seasons.seasons.length - 1]?.id
      || null;
    console.log('[ledger] current season id:', currentSeasonId);
  } catch (e) {
    console.warn('[ledger] could not resolve current season id', e);
  }

  const BATCH = 10;
  const BATCH_DELAY = 500;
  const results = [];

  for (let i = 0; i < targets.length; i += BATCH) {
    const batch = targets.slice(i, i + BATCH);
    const batchResults = await Promise.all(batch.map(async (m) => {
      const realm = m.character?.realm?.slug;
      const name = m.character?.name;
      if (!realm || !name) return null;
      try {
        const [profile, mplus, raids, mplusSeason, achievements, professions] = await Promise.all([
          wowAPI.getCharacterProfile(realm, name).catch(() => null),
          wowAPI.getCharacterMythicKeystoneProfile(realm, name).catch(() => null),
          wowAPI.getCharacterRaidEncounters(realm, name),
          currentSeasonId
            ? wowAPI.getCharacterMythicKeystoneSeasonDetails(realm, name, currentSeasonId).catch(() => null)
            : null,
          wowAPI.getCharacterAchievements(realm, name),
          wowAPI.getCharacterProfessions(realm, name)
        ]);
        return { character: m.character, profile, mplus, raids, mplusSeason, achievements, professions };
      } catch (e) { return null; }
    }));
    results.push(...batchResults.filter(Boolean));
    if (i + BATCH < targets.length) await new Promise(r => setTimeout(r, BATCH_DELAY));
  }

  console.log('[ledger] fetched results:', results.length);
  console.log('[ledger] results with profile:', results.filter(r => r.profile).length);
  console.log('[ledger] results with mplus:', results.filter(r => r.mplus).length);
  console.log('[ledger] results with raids:', results.filter(r => r.raids).length);
  const firstWithProfile = results.find(r => r.profile);
  if (firstWithProfile) {
    console.log('[ledger] sample profile equipped_item_level:', firstWithProfile.profile.equipped_item_level);
    console.log('[ledger] sample profile average_item_level:', firstWithProfile.profile.average_item_level);
  }

  // Debug raid parsing: show what midnight encounter ids look like
  const midnightIds = new Set();
  const journalMapDebug = await getJournalMap();
  for (const e of journalMapDebug.values()) midnightIds.add(e.id);
  console.log('[ledger] journalMap encounter ids:', Array.from(midnightIds));

  // Scan first result's raids for any matching ids
  const firstWithRaids = results.find(r => r.raids?.expansions?.length);
  if (firstWithRaids) {
    const allEncIds = new Set();
    for (const exp of firstWithRaids.raids.expansions) {
      for (const inst of (exp.instances || [])) {
        for (const mode of (inst.modes || [])) {
          for (const prog of (mode.progress?.encounters || [])) {
            if (prog.encounter?.id) allEncIds.add(prog.encounter.id);
          }
        }
      }
    }
    console.log('[ledger] sample char encounter ids (first 20):', Array.from(allEncIds).slice(0, 20));
    console.log('[ledger] overlap with journal:', Array.from(allEncIds).filter(id => midnightIds.has(id)));
  }

  // Top geared — use profile.equipped_item_level
  const topGear = results
    .filter(r => r.profile?.equipped_item_level)
    .sort((a, b) => b.profile.equipped_item_level - a.profile.equipped_item_level)
    .slice(0, 5)
    .map(r => ({
      name: r.character.name,
      classId: r.character.playable_class?.id,
      specId: r.profile?.active_spec?.id,
      ilvl: r.profile.equipped_item_level,
      realm: r.character.realm?.slug
    }));

  // Top M+ — by current_mythic_rating.rating
  const topMplus = results
    .filter(r => r.mplus?.current_mythic_rating?.rating)
    .sort((a, b) => b.mplus.current_mythic_rating.rating - a.mplus.current_mythic_rating.rating)
    .slice(0, 5)
    .map(r => ({
      name: r.character.name,
      classId: r.character.playable_class?.id,
      specId: r.profile?.active_spec?.id,
      rating: Math.round(r.mplus.current_mythic_rating.rating),
      color: r.mplus.current_mythic_rating.color,
      realm: r.character.realm?.slug
    }));

  // Per-character raid progression — count unique current-expansion boss
  // kills per difficulty for each member, then rank the top raiders.
  const topProgression = results
    .map(r => {
      const killsByDiff = { mythic: new Set(), heroic: new Set(), normal: new Set() };
      const expansions = r.raids?.expansions || [];
      for (const exp of expansions) {
        for (const inst of (exp.instances || [])) {
          for (const mode of (inst.modes || [])) {
            const diffName = mode.difficulty?.name;
            let bucket = null;
            if (diffName === 'Mythic') bucket = killsByDiff.mythic;
            else if (diffName === 'Heroic') bucket = killsByDiff.heroic;
            else if (diffName === 'Normal') bucket = killsByDiff.normal;
            if (!bucket) continue;
            for (const prog of (mode.progress?.encounters || [])) {
              const encId = prog.encounter?.id;
              if (!encId || (prog.completed_count || 0) < 1) continue;
              // Only count current-expansion bosses (in the journal map)
              const entry = journalMap.get(encId);
              if (!entry || EXCLUDED_INSTANCE_IDS.has(entry.instanceId)) continue;
              bucket.add(encId);
            }
          }
        }
      }
      return {
        name: r.character.name,
        classId: r.character.playable_class?.id,
        specId: r.profile?.active_spec?.id,
        realm: r.character.realm?.slug,
        mythic: killsByDiff.mythic.size,
        heroic: killsByDiff.heroic.size,
        normal: killsByDiff.normal.size
      };
    })
    .filter(p => p.mythic + p.heroic + p.normal > 0)
    .sort((a, b) => b.mythic - a.mythic || b.heroic - a.heroic || b.normal - a.normal)
    .slice(0, 5);

  // Dungeon highs — for each M+ dungeon in the current season, find the
  // highest keystone_level (timed) achieved by any member, breaking ties by
  // rating then time. Capture the per-run rating for display.
  const dungeonMap = new Map();
  for (const r of results) {
    const runs = r.mplusSeason?.best_runs || [];
    for (const run of runs) {
      if (!run.is_completed_within_time) continue;
      const d = run.dungeon;
      if (!d?.id) continue;
      const rating = run.mythic_rating?.rating || 0;
      const existing = dungeonMap.get(d.id);
      const isBetter = !existing
        || run.keystone_level > existing.level
        || (run.keystone_level === existing.level && rating > existing.rating)
        || (run.keystone_level === existing.level && rating === existing.rating && run.duration < existing.duration);
      if (isBetter) {
        dungeonMap.set(d.id, {
          id: d.id,
          name: d.name,
          level: run.keystone_level,
          duration: run.duration,
          rating,
          ratingColor: run.mythic_rating?.color || null,
          characterName: r.character.name,
          classId: r.character.playable_class?.id,
          specId: r.profile?.active_spec?.id
        });
      }
    }
  }
  const dungeonHighs = Array.from(dungeonMap.values())
    .sort((a, b) => b.level - a.level || b.rating - a.rating || a.duration - b.duration);

  console.log('[ledger] dungeon highs:', dungeonHighs.length);

  // Hall of Champions — auto-pick the standout in each category
  const slayerChamp = topProgression[0] || null;
  const gearChamp = topGear[0] || null;
  const scalerChamp = topMplus[0] || null;

  // Pumper = player with most top-dungeon records across dungeonHighs
  const pumperCounts = new Map();
  for (const d of dungeonHighs) {
    const existing = pumperCounts.get(d.characterName) || { count: 0, classId: d.classId, specId: d.specId };
    existing.count++;
    pumperCounts.set(d.characterName, existing);
  }
  let pumperChamp = null;
  let maxCount = 0;
  for (const [name, info] of pumperCounts) {
    if (info.count > maxCount) {
      maxCount = info.count;
      pumperChamp = { name, classId: info.classId, specId: info.specId, count: info.count, total: dungeonHighs.length };
    }
  }

  const champions = {
    slayer: slayerChamp ? {
      title: 'Slayer King',
      subtitle: 'Most bosses slain',
      name: slayerChamp.name,
      classId: slayerChamp.classId,
      specId: slayerChamp.specId,
      stat: `${slayerChamp.mythic}M · ${slayerChamp.heroic}H · ${slayerChamp.normal}N`
    } : null,
    gear: gearChamp ? {
      title: 'Golden Dragon',
      subtitle: 'Highest item level',
      name: gearChamp.name,
      classId: gearChamp.classId,
      specId: gearChamp.specId,
      stat: `${gearChamp.ilvl} ilvl`
    } : null,
    scaler: scalerChamp ? {
      title: 'Keymaster',
      subtitle: 'Highest M+ rating',
      name: scalerChamp.name,
      classId: scalerChamp.classId,
      specId: scalerChamp.specId,
      stat: `${scalerChamp.rating} rating`
    } : null,
    pumper: pumperChamp ? {
      title: 'Pumper King',
      subtitle: 'Most top dungeon records',
      name: pumperChamp.name,
      classId: pumperChamp.classId,
      specId: pumperChamp.specId,
      stat: `Highest rating in ${pumperChamp.count}/${pumperChamp.total} dungeons`
    } : null
  };

  // Guild Clears — scan every character's achievements for AOTC/CE stamps
  // targeting current-expansion raids (via the journalMap instance names).
  const expansionRaidNames = new Set(Array.from(journalMap.values()).map(e => e.instanceName));
  const clearsByRaid = new Map(); // raidName → { aotc, ce }
  for (const r of results) {
    const achs = r.achievements?.achievements || [];
    for (const a of achs) {
      const name = a.achievement?.name || '';
      const aotcMatch = name.match(/^Ahead of the Curve:\s*(.+)$/i);
      const ceMatch = name.match(/^Cutting Edge:\s*(.+)$/i);
      const matched = aotcMatch || ceMatch;
      if (!matched) continue;
      // Some AOTC achievements use boss name; prefer a direct instance-name match.
      let raidName = null;
      for (const inst of expansionRaidNames) {
        if (matched[1].includes(inst) || inst.includes(matched[1])) {
          raidName = inst;
          break;
        }
      }
      if (!raidName) continue;
      const entry = clearsByRaid.get(raidName) || { aotc: false, ce: false };
      if (aotcMatch) entry.aotc = true;
      if (ceMatch) entry.ce = true;
      clearsByRaid.set(raidName, entry);
    }
  }
  const guildClears = {};
  for (const [name, v] of clearsByRaid) guildClears[name] = v;

  // Dragon Crafters — only current-expansion (Midnight) tier at max skill
  const craftersByProfession = new Map(); // profName → { id, list }
  for (const r of results) {
    const primaries = r.professions?.primaries || [];
    for (const p of primaries) {
      const profName = p.profession?.name;
      const profId = p.profession?.id;
      if (!profName) continue;
      // Find the Midnight tier specifically
      const midnightTier = (p.tiers || []).find(t =>
        /midnight/i.test(t.tier?.name || '')
      );
      if (!midnightTier) continue;
      const skill = midnightTier.skill_points || 0;
      const maxSkill = midnightTier.max_skill_points || 0;
      // Only include characters who have maxed the tier
      if (!maxSkill || skill < maxSkill) continue;

      const entry = craftersByProfession.get(profName) || { id: profId, list: [] };
      entry.list.push({
        name: r.character.name,
        classId: r.character.playable_class?.id,
        specId: r.profile?.active_spec?.id,
        tier: midnightTier.tier?.name || '',
        skill,
        maxSkill
      });
      craftersByProfession.set(profName, entry);
    }
  }

  // Fetch profession icon media in parallel (max 1 per unique profession)
  const profEntries = Array.from(craftersByProfession.entries());
  const profIconResults = await Promise.all(profEntries.map(async ([, e]) => {
    if (!e.id) return null;
    try { return await wowAPI.getProfessionMedia(e.id); } catch { return null; }
  }));

  const crafters = {};
  profEntries.forEach(([prof, entry], idx) => {
    const media = profIconResults[idx] || {};
    crafters[prof] = {
      id: entry.id,
      icon: media.icon || null,
      banner: media.banner || null,
      list: entry.list.sort((a, b) => b.skill - a.skill).slice(0, 10)
    };
  });

  // Random seasonal background picks for ledger columns (persist in cache)
  const raidNameSet = new Set();
  for (const e of journalMap.values()) {
    if (!EXCLUDED_INSTANCE_IDS.has(e.instanceId)) raidNameSet.add(e.instanceName);
  }
  const raidNames = Array.from(raidNameSet);
  const slayerBg = raidNames.length
    ? zoneBannerUrl(raidNames[Math.floor(Math.random() * raidNames.length)])
    : null;

  const data = { topGear, topMplus, topProgression, dungeonHighs, champions, guildClears, crafters, slayerBg };
  try {
    localStorage.setItem(LEDGER_CACHE_KEY, JSON.stringify({ data, expires: Date.now() + LEDGER_TTL }));
  } catch (e) { /* ignore */ }
  return data;
}

const CINDERS_HTML = '<div class="void-cinders"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>';

function renderCraftersSection(crafters) {
  if (!crafters || !Object.keys(crafters).length) return '';
  const profOrder = [
    'Blacksmithing', 'Leatherworking', 'Tailoring', 'Enchanting',
    'Engineering', 'Jewelcrafting', 'Alchemy', 'Inscription'
  ];

  // Flatten: one card per maxed (character, profession) combo
  const cards = [];
  for (const prof of profOrder) {
    const entry = crafters[prof];
    if (!entry?.list?.length) continue;
    for (const c of entry.list) {
      cards.push({ ...c, prof, profIcon: entry.icon });
    }
  }
  if (!cards.length) return '';

  return `
    <section class="dd-section dd-section-crafters">
      <header class="dd-section-header">
        <h2 class="dd-section-title">Dragon Crafters</h2>
        <p class="dd-section-sub">Maxed Midnight professions — whisper these dragons</p>
      </header>
      <div class="dd-crafters-grid">
        ${cards.map(c => {
          const color = getClassColor ? getClassColor(c.classId) : '#fff';
          const classUrl = c.classId ? getClassIconUrl(c.classId) : null;
          return `
            <div class="dd-crafter-card">
              <div class="dd-crafter-card-top">
                ${classUrl ? `<img src="${classUrl}" alt="" class="dd-crafter-icon" />` : ''}
                <span class="dd-crafter-name" style="color:${color}">${c.name}</span>
              </div>
              <div class="dd-crafter-card-bottom">
                ${c.profIcon ? `<img src="${c.profIcon}" alt="" class="dd-crafter-prof-icon-sm" />` : ''}
                <span class="dd-crafter-prof-name">${c.prof}</span>
                <span class="dd-crafter-skill">${c.skill}<span class="dd-crafter-skill-max">/${c.maxSkill}</span></span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    </section>
  `;
}

function renderLedgerPlaceholder() {
  const placeholderCol = (title) => `
    <div class="dd-ledger-col">
      ${CINDERS_HTML}
      <h3 class="dd-ledger-col-title">${title}</h3>
      <div class="dd-ledger-col-body">
        <div class="dd-ledger-loading"><i class="las la-circle-notch la-spin"></i> Counting the hoard…</div>
      </div>
    </div>
  `;
  return `
    <section class="dd-section dd-section-ledger" id="dd-ledger-section">
      <header class="dd-section-header">
        <h2 class="dd-section-title">The Dragons' Ledger</h2>
        <p class="dd-section-sub">A tally of the flight's finest</p>
      </header>
      <div class="dd-ledger-grid">
        ${placeholderCol('Dragon Slayers')}
        ${placeholderCol('Dragon Grinders')}
        ${placeholderCol('Dragon Scalers')}
        ${placeholderCol('Dragon Pumpers')}
      </div>
    </section>
  `;
}

function ledgerIcons(classId, specId) {
  const classUrl = classId ? getClassIconUrl(classId) : null;
  const specUrl = specId ? getSpecIconUrl(specId) : null;
  return `
    <span class="dd-ledger-icons">
      ${classUrl ? `<img src="${classUrl}" alt="" class="dd-ledger-icon dd-ledger-icon-class" />` : ''}
      ${specUrl ? `<img src="${specUrl}" alt="" class="dd-ledger-icon dd-ledger-icon-spec" />` : ''}
    </span>
  `;
}

function formatKeystoneDuration(ms) {
  if (!ms || ms <= 0) return '';
  const totalSec = Math.floor(ms / 1000);
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

function renderChampionPill(champ) {
  if (!champ) return '';
  const classColor = getClassColor ? getClassColor(champ.classId) : '#fff';
  const classUrl = champ.classId ? getClassIconUrl(champ.classId) : null;
  return `
    <div class="dd-champ-pill" style="--champ-color:${classColor}" title="${champ.subtitle}">
      <i class="las la-crown dd-champ-pill-crown"></i>
      <span class="dd-champ-pill-title">${champ.title}</span>
      ${classUrl ? `<img src="${classUrl}" alt="" class="dd-champ-pill-icon" />` : ''}
      <span class="dd-champ-pill-name">${champ.name}</span>
      <span class="dd-champ-pill-stat">${champ.stat}</span>
    </div>
  `;
}

function renderChampionPills(champions) {
  if (!champions) return '';
  const items = [champions.slayer, champions.gear, champions.scaler, champions.pumper].filter(Boolean);
  if (!items.length) return '';
  return `<div class="dd-champ-pills">${items.map(renderChampionPill).join('')}</div>`;
}

function pickRandomDungeonBanners(dungeonHighs, count) {
  if (!dungeonHighs?.length) return [];
  const pool = [...dungeonHighs];
  const picks = [];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    const [chosen] = pool.splice(idx, 1);
    picks.push(zoneBannerUrl(chosen.name));
  }
  return picks;
}

function renderLedger(ledger) {
  if (!ledger) return '';
  const { topGear = [], topMplus = [], topProgression = [], dungeonHighs = [], champions = {}, slayerBg = null } = ledger;
  const [grindersBg, scalersBg] = pickRandomDungeonBanners(dungeonHighs, 2);

  const progHtml = topProgression.length ? topProgression.map((p, i) => {
    const color = getClassColor ? getClassColor(p.classId) : '#fff';
    return `
      <div class="dd-ledger-row">
        <div class="dd-ledger-rank">#${i + 1}</div>
        ${ledgerIcons(p.classId, p.specId)}
        <div class="dd-ledger-row-name" style="color:${color}">${p.name}</div>
        <div class="dd-ledger-row-bars">
          ${p.mythic ? `<span class="dd-ledger-bar dd-diff-mythic">${p.mythic}M</span>` : ''}
          ${p.heroic ? `<span class="dd-ledger-bar dd-diff-heroic">${p.heroic}H</span>` : ''}
          ${p.normal ? `<span class="dd-ledger-bar dd-diff-normal">${p.normal}N</span>` : ''}
        </div>
      </div>
    `;
  }).join('') : '<div class="dd-ledger-empty">No raid data yet</div>';

  const gearHtml = topGear.length ? topGear.map((g, i) => {
    const color = getClassColor ? getClassColor(g.classId) : '#fff';
    return `
      <div class="dd-ledger-row">
        <div class="dd-ledger-rank">#${i + 1}</div>
        ${ledgerIcons(g.classId, g.specId)}
        <div class="dd-ledger-row-name" style="color:${color}">${g.name}</div>
        <div class="dd-ledger-row-value"><strong>${g.ilvl}</strong></div>
      </div>
    `;
  }).join('') : '<div class="dd-ledger-empty">No gear data yet</div>';

  const mplusHtml = topMplus.length ? topMplus.map((m, i) => {
    const color = getClassColor ? getClassColor(m.classId) : '#fff';
    const ratingColor = m.color ? `rgba(${m.color.r}, ${m.color.g}, ${m.color.b}, 1)` : '#fff';
    return `
      <div class="dd-ledger-row">
        <div class="dd-ledger-rank">#${i + 1}</div>
        ${ledgerIcons(m.classId, m.specId)}
        <div class="dd-ledger-row-name" style="color:${color}">${m.name}</div>
        <div class="dd-ledger-row-value" style="color:${ratingColor}"><strong>${m.rating}</strong></div>
      </div>
    `;
  }).join('') : '<div class="dd-ledger-empty">No M+ data yet</div>';

  const dungeonHtml = dungeonHighs.length ? dungeonHighs.map(d => {
    const classColor = getClassColor ? getClassColor(d.classId) : '#fff';
    const time = formatKeystoneDuration(d.duration);
    const ratingColor = d.ratingColor ? `rgba(${d.ratingColor.r}, ${d.ratingColor.g}, ${d.ratingColor.b}, 1)` : 'rgba(255,255,255,0.6)';
    const ratingInt = Math.round(d.rating);
    const bg = zoneBannerUrl(d.name);
    const bgStyle = bg ? `background-image:url('${bg}')` : '';
    return `
      <div class="dd-ledger-dungeon-row" style="${bgStyle}">
        <div class="dd-ledger-dungeon-scrim"></div>
        <div class="dd-ledger-dungeon-inner">
          <div class="dd-ledger-dungeon-top">
            ${ledgerIcons(d.classId, d.specId)}
            <span class="dd-ledger-dungeon-char" style="color:${classColor}">${d.characterName}</span>
          </div>
          <div class="dd-ledger-dungeon-bottom">
            <span class="dd-ledger-dungeon-name">${d.name}</span>
            <span class="dd-ledger-dungeon-level">+${d.level}</span>
            ${time ? `<span class="dd-ledger-dungeon-time">${time}</span>` : ''}
            ${ratingInt ? `<span class="dd-ledger-dungeon-rating" style="color:${ratingColor}">${ratingInt}</span>` : ''}
          </div>
        </div>
      </div>
    `;
  }).join('') : '<div class="dd-ledger-empty">No dungeon data yet</div>';

  return `
    <section class="dd-section dd-section-ledger">
      <header class="dd-section-header">
        <h2 class="dd-section-title">The Dragons' Ledger</h2>
        <p class="dd-section-sub">A tally of the flight's finest</p>
      </header>
      <div class="dd-ledger-grid">
        <div class="dd-ledger-col ${slayerBg ? 'dd-ledger-col-banner' : ''}"${slayerBg ? ` style="--col-bg:url('${slayerBg}')"` : ''}>
          ${CINDERS_HTML}
          <h3 class="dd-ledger-col-title">Dragon Slayers</h3>
          <div class="dd-ledger-col-body">${progHtml}</div>
        </div>
        <div class="dd-ledger-col ${grindersBg ? 'dd-ledger-col-banner' : ''}"${grindersBg ? ` style="--col-bg:url('${grindersBg}')"` : ''}>
          ${CINDERS_HTML}
          <h3 class="dd-ledger-col-title">Dragon Grinders</h3>
          <div class="dd-ledger-col-body">${gearHtml}</div>
        </div>
        <div class="dd-ledger-col ${scalersBg ? 'dd-ledger-col-banner' : ''}"${scalersBg ? ` style="--col-bg:url('${scalersBg}')"` : ''}>
          ${CINDERS_HTML}
          <h3 class="dd-ledger-col-title">Dragon Scalers</h3>
          <div class="dd-ledger-col-body">${mplusHtml}</div>
        </div>
        <div class="dd-ledger-col">
          ${CINDERS_HTML}
          <h3 class="dd-ledger-col-title">Dragon Pumpers</h3>
          <div class="dd-ledger-col-body">${dungeonHtml}</div>
        </div>
      </div>
    </section>
  `;
}

async function renderHome() {
  const container = document.getElementById('guild-roster-container');
  if (!container) return;

  container.innerHTML = renderLoading();

  try {
    const [guildInfo, roster, activity] = await Promise.all([
      wowAPI.getGuildInfo().catch(() => null),
      wowAPI.getGuildRoster().catch(() => null),
      wowAPI.getGuildActivity().catch(() => null)
    ]);

    if (!guildInfo && !roster) {
      container.innerHTML = renderError('Guild data is unavailable right now.');
      return;
    }

    const [heroHtml, activityHtml] = await Promise.all([
      renderHero(guildInfo, activity),
      renderActivity(activity)
    ]);

    const glance = buildGuildGlance(roster);
    const glanceHtml = glance ? `
      <section class="dd-section dd-section-glance">
        <header class="dd-section-header">
          <h2 class="dd-section-title">The Flight at a Glance</h2>
          <p class="dd-section-sub">Class makeup and faction split across all ${glance.total} dragons</p>
        </header>
        ${renderGuildGlance(glance)}
      </section>
    ` : '';

    container.innerHTML = `
      <div class="dd-home">
        ${heroHtml}
        ${activityHtml}
        ${renderLedgerPlaceholder()}
        <div id="dd-crafters-slot"></div>
        ${glanceHtml}
      </div>
    `;

    // Fill in the ledger + champion pills + crafters without blocking the render
    fetchGuildLedger(roster)
      .then(ledger => {
        const section = document.getElementById('dd-ledger-section');
        if (section) section.outerHTML = renderLedger(ledger);
        const pillsSlot = document.getElementById('dd-champions-pills-slot');
        if (pillsSlot) pillsSlot.innerHTML = renderChampionPills(ledger?.champions);
        const craftersSlot = document.getElementById('dd-crafters-slot');
        if (craftersSlot) craftersSlot.innerHTML = renderCraftersSection(ledger?.crafters);
        // Re-render the progression row so AOTC/CE badges pop in from the cache
        const activitySection = document.querySelector('.dd-section-activity');
        if (activitySection) {
          renderActivity(activity).then(html => {
            if (html) activitySection.outerHTML = html;
          });
        }
      })
      .catch(err => console.error('Ledger fetch failed:', err));
  } catch (error) {
    console.error('Home render error:', error);
    container.innerHTML = renderError(error.message);
  }
}

function mountScrollHint() {
  if (document.getElementById('dd-scroll-hint')) return;
  const hint = document.createElement('div');
  hint.id = 'dd-scroll-hint';
  hint.className = 'dd-scroll-hint';
  hint.innerHTML = '<i class="las la-angle-down"></i>';
  document.body.appendChild(hint);

  const onScroll = () => {
    if (window.scrollY > 80) hint.classList.add('is-hidden');
    else hint.classList.remove('is-hidden');
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    onInit: async () => {
      characterModal.init();
      await renderHome();
      await loadCritterTracker();
      mountScrollHint();
    }
  });
});
