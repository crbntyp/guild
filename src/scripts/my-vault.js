// Weekly Rewards Page — Shows which characters have vault rewards
import PageInitializer from './utils/page-initializer.js';
import authService from './services/auth.js';
import accountService from './services/account-service.js';
import battlenetClient from './api/battlenet-client.js';
import config from './config.js';
import { getClassColor } from './utils/wow-constants.js';
import PageHeader from './components/page-header.js';

console.log('⚡ Weekly Rewards Page initialized');

const VAULT_API = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? 'https://crbntyp.com/gld/api'
  : '/gld/api';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      window.addEventListener('auth-state-changed', () => window.location.reload());

      const container = document.getElementById('vault-container');

      if (!authService.isAuthenticated()) {
        container.innerHTML = `
          <div class="auth-required-view">
            <h2>Authentication Required</h2>
            <p>Log in with your Battle.net account to view this page.</p>
            <button class="btn-login-auth" id="btn-login-vault">
              <i class="las la-user"></i>
              Login with Battle.net
            </button>
          </div>
        `;
        document.getElementById('btn-login-vault')?.addEventListener('click', () => authService.login());
        return;
      }

      container.innerHTML = `
        ${PageHeader.render({
          className: 'vault',
          title: 'Weekly Rewards',
          description: 'Characters with vault rewards available this week. If you see a colored dot, this means you are close to a reward eg. 1/2 delves...'
        })}
        <div id="vault-content">
          <div class="loading-spinner">
            <i class="las la-circle-notch la-spin la-4x"></i>
            <p>Scanning characters for vault activity...</p>
          </div>
        </div>
      `;

      try {
        const characters = await accountService.getAccountCharacters();
        const eligible = characters.filter(c => c.level >= 90).sort((a, b) => b.level - a.level);

        // Get previous snapshots from DB
        let prevSnapshots = {};
        try {
          const token = authService.getAccessToken();
          const res = await fetch(`${VAULT_API}/vault.php`, {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          const data = await res.json();
          (data.snapshots || []).forEach(s => {
            prevSnapshots[`${s.character_name}-${s.realm_slug}`] = s;
          });
        } catch (e) {}

        // Scan each character
        const results = [];
        const newSnapshots = [];
        const batchSize = 3;

        for (let i = 0; i < eligible.length; i += batchSize) {
          const batch = eligible.slice(i, i + batchSize);

          await Promise.all(batch.map(async (char) => {
            const realmSlug = char.realm?.slug || '';
            const name = char.name.toLowerCase();
            const key = `${char.name}-${realmSlug}`;

            try {
              // Fetch M+ current period and achievement stats in parallel
              const [mplusData, statsData, mediaData] = await Promise.all([
                battlenetClient.request(
                  `/profile/wow/character/${realmSlug}/${encodeURIComponent(name)}/mythic-keystone-profile`,
                  { params: { namespace: config.api.namespace.profile } }
                ).catch(() => null),
                battlenetClient.request(
                  `/profile/wow/character/${realmSlug}/${encodeURIComponent(name)}/achievements/statistics`,
                  { params: { namespace: config.api.namespace.profile } }
                ).catch(() => null),
                battlenetClient.request(
                  `/profile/wow/character/${realmSlug}/${encodeURIComponent(name)}/character-media`,
                  { params: { namespace: config.api.namespace.profile } }
                ).catch(() => null)
              ]);

              const avatar = mediaData?.assets?.find(a => a.key === 'inset')?.value || '';

              // M+ runs this week
              const weeklyRuns = mplusData?.current_period?.best_runs || [];
              const mplusCount = weeklyRuns.length;
              const highestKey = weeklyRuns.reduce((max, r) => Math.max(max, r.keystone_level || 0), 0);

              // Parse achievement stats for delves and raids
              let currentDelveCount = 0;
              let delveTimestamp = 0;
              let raidTimestamp = 0;
              let raidBossKills = 0;

              if (statsData?.categories) {
                for (const cat of statsData.categories) {
                  // Check delves
                  for (const sub of (cat.sub_categories || [])) {
                    for (const stat of (sub.statistics || [])) {
                      if (stat.name === 'Total delves completed') {
                        currentDelveCount = stat.quantity || 0;
                        delveTimestamp = stat.last_updated_timestamp || 0;
                      }
                    }
                  }
                  // Check raid boss kills (Midnight only)
                  if (cat.name === 'Dungeons & Raids') {
                    for (const sub of (cat.sub_categories || [])) {
                      if (sub.name === 'Midnight') {
                        for (const stat of (sub.statistics || [])) {
                          const ts = stat.last_updated_timestamp || 0;
                          if (ts > raidTimestamp) raidTimestamp = ts;
                        }
                      }
                    }
                  }
                  // Also check top-level delve stats
                  for (const stat of (cat.statistics || [])) {
                    if (stat.name === 'Total delves completed') {
                      currentDelveCount = stat.quantity || 0;
                      delveTimestamp = stat.last_updated_timestamp || 0;
                    }
                  }
                }
              }

              // Save current counts for snapshot
              newSnapshots.push({
                name: char.name,
                realm: realmSlug,
                delve_count: currentDelveCount,
                dungeon_count: mplusCount,
                raid_boss_count: 0
              });

              // Calculate weekly reset start (Wednesday 05:00 UTC for EU)
              const now = new Date();
              const dayOfWeek = now.getUTCDay(); // 0=Sun
              // Wednesday = 3
              let daysToWed = dayOfWeek - 3;
              if (daysToWed < 0) daysToWed += 7;
              const resetStart = new Date(now);
              resetStart.setUTCDate(now.getUTCDate() - daysToWed);
              resetStart.setUTCHours(5, 0, 0, 0);
              if (resetStart > now) resetStart.setUTCDate(resetStart.getUTCDate() - 7);
              const resetMs = resetStart.getTime();

              // Delves: compare with DB snapshot
              const prev = prevSnapshots[key];
              const prevDelveCount = prev ? parseInt(prev.delve_count) : 0;
              const delvesDoneThisWeek = currentDelveCount - prevDelveCount;

              // Raids: count bosses killed this week
              if (raidTimestamp > resetMs && statsData?.categories) {
                for (const cat of statsData.categories) {
                  if (cat.name === 'Dungeons & Raids') {
                    for (const sub of (cat.sub_categories || [])) {
                      if (sub.name === 'Midnight') {
                        for (const stat of (sub.statistics || [])) {
                          if ((stat.last_updated_timestamp || 0) > resetMs) raidBossKills++;
                        }
                      }
                    }
                  }
                }
              }

              // Activity detection (any progress at all)
              const hasMplus = mplusCount > 0;
              const hasDelves = delvesDoneThisWeek >= 1 || (delveTimestamp > resetMs && !prev);
              const hasRaids = raidBossKills > 0;

              // Vault slot thresholds: Raids 2/4/6, M+ Keys 1/4/8, Delves 2/4/8
              const mplusSlots = mplusCount >= 8 ? 3 : mplusCount >= 4 ? 2 : mplusCount >= 1 ? 1 : 0;
              const delveSlots = delvesDoneThisWeek >= 8 ? 3 : delvesDoneThisWeek >= 4 ? 2 : delvesDoneThisWeek >= 2 ? 1 : 0;
              const raidSlots = raidBossKills >= 6 ? 3 : raidBossKills >= 4 ? 2 : raidBossKills >= 2 ? 1 : 0;

              if (hasMplus || hasDelves || hasRaids) {
                results.push({
                  name: char.name,
                  realm: char.realm?.name || realmSlug,
                  classId: char.playable_class?.id,
                  level: char.level,
                  avatar,
                  mplus: hasMplus ? mplusCount : 0,
                  highestKey,
                  delves: hasDelves,
                  delveCount: delvesDoneThisWeek,
                  raids: hasRaids,
                  raidBossKills,
                  mplusSlots,
                  delveSlots,
                  raidSlots,
                  totalSlots: mplusSlots + delveSlots + raidSlots,
                  activeCount: (hasMplus ? 1 : 0) + (hasDelves ? 1 : 0) + (hasRaids ? 1 : 0)
                });
              }
            } catch (e) {
              // Character scan failed, skip
            }
          }));
        }

        // Save snapshots to DB
        try {
          const token = authService.getAccessToken();
          await fetch(`${VAULT_API}/vault.php`, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({ characters: newSnapshots })
          });
        } catch (e) {}

        // Render results
        const content = document.getElementById('vault-content');

        if (results.length === 0) {
          const header = container.querySelector('.page-header-panel');
          if (header) header.style.display = 'none';
          content.innerHTML = `
            <div class="no-raids">
              <p>No characters have vault rewards this week</p>
              <p class="no-raids-sub">Run M+ dungeons, delves, or raid bosses to unlock vault slots</p>
            </div>
          `;
          return;
        }

        // Sort by total vault slots (most active first), then by level
        results.sort((a, b) => b.totalSlots - a.totalSlots || b.level - a.level);

        content.innerHTML = `
          <div class="roster-grid vault-roster">
            ${results.map(c => {
              const classColor = getClassColor(c.classId);

              return `
                <div class="member-card vault-member-card">
                  <div class="character-avatar-placeholder" style="height: 120px;">
                    ${c.avatar ? `<img src="${c.avatar}" style="width:100%;height:100%;object-fit:cover;object-position:top" />` : ''}
                  </div>

                  <div class="member-header">
                    <div class="member-name" style="color: ${classColor}">${c.name}</div>
                  </div>

                  <div class="vault-rewards">
                    <div class="vault-badges">
                      <span class="vault-badge vault-raids${c.raidSlots > 0 ? '' : ' vault-inactive'}${c.raids && c.raidSlots === 0 ? ' vault-has-progress' : ''}">Raids${c.raids && c.raidSlots === 0 ? '<span class="vault-dot vault-dot-raids"></span>' : ''}</span>
                      <span class="vault-badge vault-mplus${c.mplusSlots > 0 ? '' : ' vault-inactive'}${c.mplus && c.mplusSlots === 0 ? ' vault-has-progress' : ''}">${c.mplusSlots > 0 ? `M+ Keys ${c.highestKey ? `+${c.highestKey}` : c.mplus}` : 'M+ Keys'}${c.mplus && c.mplusSlots === 0 ? '<span class="vault-dot vault-dot-mplus"></span>' : ''}</span>
                      <span class="vault-badge vault-delves${c.delveSlots > 0 ? '' : ' vault-inactive'}${c.delves && c.delveSlots === 0 ? ' vault-has-progress' : ''}">Delves${c.delves && c.delveSlots === 0 ? '<span class="vault-dot vault-dot-delves"></span>' : ''}</span>
                    </div>
                    <div class="vault-progress">
                      <div class="vault-progress-track">
                        <div class="vault-progress-fill" style="width: ${(c.totalSlots / 9) * 100}%"></div>
                      </div>
                      <span class="vault-progress-text">${Math.round((c.totalSlots / 9) * 100)}%</span>
                    </div>
                  </div>
                </div>
              `;
            }).join('')}
          </div>
        `;

      } catch (error) {
        console.error('Error loading vault data:', error);
        document.getElementById('vault-content').innerHTML = `
          <div class="no-raids">
            <p>Failed to load vault data</p>
            <p class="no-raids-sub">${error.message || ''}</p>
          </div>
        `;
      }
    }
  });
});
