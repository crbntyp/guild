// Weekly Rewards Page — Shows which characters have vault rewards
import PageInitializer from './utils/page-initializer.js';
import authService from './services/auth.js';
import accountService from './services/account-service.js';
import battlenetClient from './api/battlenet-client.js';
import config from './config.js';
import { getClassColor } from './utils/wow-constants.js';
import { getClassIconUrl } from './utils/wow-icons.js';
import PageHeader from './components/page-header.js';
import raidService from './services/raid-service.js';

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
          description: 'Characters with vault rewards available this week.'
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

              const avatar = mediaData?.assets?.find(a => a.key === 'avatar')?.value || '';

              // M+ runs this week
              const weeklyRuns = mplusData?.current_period?.best_runs || [];
              const mplusCount = weeklyRuns.length;

              // Parse achievement stats for delves and raids
              let currentDelveCount = 0;
              let delveTimestamp = 0;
              let raidTimestamp = 0;

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
                  // Check raid boss kills (any recent timestamp)
                  if (cat.name === 'Dungeons & Raids') {
                    for (const sub of (cat.sub_categories || [])) {
                      if (sub.name === 'Midnight' || sub.name === 'The War Within') {
                        for (const stat of (sub.statistics || [])) {
                          if ((stat.last_updated_timestamp || 0) > raidTimestamp) {
                            raidTimestamp = stat.last_updated_timestamp || 0;
                          }
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

              // Calculate weekly reset start (Monday 07:00 UTC for EU)
              const now = new Date();
              const dayOfWeek = now.getUTCDay(); // 0=Sun
              const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
              const resetStart = new Date(now);
              resetStart.setUTCDate(now.getUTCDate() + mondayOffset);
              resetStart.setUTCHours(7, 0, 0, 0);
              if (resetStart > now) resetStart.setUTCDate(resetStart.getUTCDate() - 7);
              const resetMs = resetStart.getTime();

              // Determine vault status
              const hasMplus = mplusCount > 0;

              // Delves: compare with DB snapshot
              const prev = prevSnapshots[key];
              const prevDelveCount = prev ? parseInt(prev.delve_count) : 0;
              const delvesDoneThisWeek = currentDelveCount - prevDelveCount;
              const hasDelves = delvesDoneThisWeek >= 2 || (delveTimestamp > resetMs && !prev);

              // Raids: check if any current-expansion boss was killed this week
              const hasRaids = raidTimestamp > resetMs;

              if (hasMplus || hasDelves || hasRaids) {
                results.push({
                  name: char.name,
                  realm: char.realm?.name || realmSlug,
                  classId: char.playable_class?.id,
                  level: char.level,
                  avatar,
                  mplus: hasMplus ? mplusCount : 0,
                  delves: hasDelves,
                  raids: hasRaids
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

        content.innerHTML = `
          <div class="vault-grid">
            ${results.map(c => {
              const classColor = getClassColor(c.classId);
              const classIconUrl = getClassIconUrl(c.classId);

              return `
                <div class="vault-card">
                  <div class="vault-char-info">
                    ${c.avatar ? `<img src="${c.avatar}" class="vault-avatar" />` : ''}
                    ${classIconUrl ? `<img src="${classIconUrl}" class="vault-class-icon" />` : ''}
                    <span class="vault-char-name" style="color: ${classColor}">${c.name}</span>
                  </div>
                  <div class="vault-rewards">
                    ${c.mplus ? `<span class="vault-badge vault-mplus" title="M+ dungeons completed this week"><i class="las la-key"></i> ${c.mplus}</span>` : ''}
                    ${c.delves ? `<span class="vault-badge vault-delves" title="Delves completed this week"><i class="las la-dungeon"></i> Delves</span>` : ''}
                    ${c.raids ? `<span class="vault-badge vault-raids" title="Raid boss killed this week"><i class="las la-skull-crossbones"></i> Raid</span>` : ''}
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
