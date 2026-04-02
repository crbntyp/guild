// Mythic+ Leaderboards Page
import PageInitializer from './utils/page-initializer.js';
import wowApi from './api/wow-api.js';
import config from './config.js';
import { getFactionIconUrl, getSpecIconUrl, getClassIconUrl } from './utils/wow-icons.js';
import { getClassColor } from './utils/wow-constants.js';
import CustomDropdown from './components/custom-dropdown.js';
import PageHeader from './components/page-header.js';

console.log('⚡ Mythic+ Leaderboards Page initialized');

// Helper to format duration from milliseconds
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Check if local season data exists and load it
 * @param {number} seasonId - The season ID to check for
 * @returns {Promise<Object|null>} - The local season data or null if not found
 */
async function loadLocalSeasonData(seasonId) {
  try {
    const response = await fetch(`/data/seasons/season-${seasonId}.json`);
    if (response.ok) {
      const data = await response.json();
      console.log(`📦 Loaded local data for Season ${seasonId} (captured ${new Date(data.capturedAt).toLocaleDateString()})`);
      return data;
    }
  } catch (error) {
    // File doesn't exist, that's fine
  }
  return null;
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    onInit: async () => {
      const container = document.getElementById('mythic-plus-container');
      const leaderboardContent = document.getElementById('leaderboard-content');

      try {
        // Render header
        container.insertAdjacentHTML('afterbegin', `
          ${PageHeader.render({
            className: 'mplus',
            badge: 'gld__ mythic+',
            title: 'Mythic+ Leaderboards',
            description: 'Top keystone runs, meta compositions, and spec distribution across the EU region.'
          })}
        `);
        // Add season info strip inside the hero
        const heroEl = container.querySelector('.page-header-hero');
        if (heroEl) heroEl.insertAdjacentHTML('beforeend', '<div class="mplus-season-info" id="mplus-season-info"></div>');

        leaderboardContent.innerHTML = `
          <div class="loading-spinner">
            <i class="las la-circle-notch la-spin la-6x"></i>
            <p>Loading Mythic+ data...</p>
          </div>
        `;

        // Fetch current season
        const seasonsData = await wowApi.getMythicKeystoneSeasons();

        // Get the current season (last in the list)
        if (seasonsData && seasonsData.seasons && seasonsData.seasons.length > 0) {
          const currentSeasonRef = seasonsData.seasons[seasonsData.seasons.length - 1];
          const currentSeasonId = currentSeasonRef.id;

          // Check for local season data first
          const localData = await loadLocalSeasonData(currentSeasonId);
          let isHistoricalData = false;

          // Fetch current season details (or use local data)
          const seasonDetails = localData ?
            {
              id: localData.seasonId,
              season_name: localData.seasonName,
              start_timestamp: localData.startTimestamp,
              end_timestamp: localData.endTimestamp,
              periods: [] // Not needed for local data
            } :
            await wowApi.getMythicKeystoneSeasonDetails(currentSeasonId);

          if (localData) {
            isHistoricalData = true;
          }

          // Render season info strip below header
          const startDate = new Date(seasonDetails.start_timestamp).toLocaleDateString('en-GB', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
          });
          const isActive = !seasonDetails.end_timestamp;

          const seasonInfo = document.getElementById('mplus-season-info');
          if (seasonInfo) {
            seasonInfo.innerHTML = `
              <span class="mplus-season-dot ${isActive ? 'active' : 'ended'}"></span>
              <span class="mplus-season-text">Season ${seasonDetails.id} ${isActive ? 'Active' : 'Ended'} — ${startDate}</span>
            `;
          }

          let html = ``;
          let allLeaderboards = [];
          let periodId = null;

          // Fetch playable specializations for lookup (needed for both local and API data)
          let specLookup = {};

          // Role mapping for spec IDs
          const specRoles = {
            // Tanks
            250: 'tank', // Blood DK
            581: 'tank', // Vengeance DH
            104: 'tank', // Guardian Druid
            1473: 'tank', // Augmentation Evoker (can tank in some contexts, but treat as DPS)
            268: 'tank', // Brewmaster Monk
            66: 'tank', // Protection Paladin
            73: 'tank', // Protection Warrior
            // Healers
            105: 'healer', // Restoration Druid
            1468: 'healer', // Preservation Evoker
            270: 'healer', // Mistweaver Monk
            65: 'healer', // Holy Paladin
            256: 'healer', // Discipline Priest
            257: 'healer', // Holy Priest
            264: 'healer', // Restoration Shaman
            // DPS (all others default to DPS)
          };

          // Augmentation Evoker is actually DPS
          specRoles[1473] = 'dps';

          // Static spec lookup — no API calls needed
          const specData = {
            // Death Knight
            250: { name: 'Blood', className: 'Death Knight', classId: 6 },
            251: { name: 'Frost', className: 'Death Knight', classId: 6 },
            252: { name: 'Unholy', className: 'Death Knight', classId: 6 },
            // Demon Hunter
            577: { name: 'Havoc', className: 'Demon Hunter', classId: 12 },
            581: { name: 'Vengeance', className: 'Demon Hunter', classId: 12 },
            1480: { name: 'Devourer', className: 'Demon Hunter', classId: 12 },
            // Druid
            102: { name: 'Balance', className: 'Druid', classId: 11 },
            103: { name: 'Feral', className: 'Druid', classId: 11 },
            104: { name: 'Guardian', className: 'Druid', classId: 11 },
            105: { name: 'Restoration', className: 'Druid', classId: 11 },
            // Evoker
            1467: { name: 'Devastation', className: 'Evoker', classId: 13 },
            1468: { name: 'Preservation', className: 'Evoker', classId: 13 },
            1473: { name: 'Augmentation', className: 'Evoker', classId: 13 },
            // Hunter
            253: { name: 'Beast Mastery', className: 'Hunter', classId: 3 },
            254: { name: 'Marksmanship', className: 'Hunter', classId: 3 },
            255: { name: 'Survival', className: 'Hunter', classId: 3 },
            // Mage
            62: { name: 'Arcane', className: 'Mage', classId: 8 },
            63: { name: 'Fire', className: 'Mage', classId: 8 },
            64: { name: 'Frost', className: 'Mage', classId: 8 },
            // Monk
            268: { name: 'Brewmaster', className: 'Monk', classId: 10 },
            270: { name: 'Mistweaver', className: 'Monk', classId: 10 },
            269: { name: 'Windwalker', className: 'Monk', classId: 10 },
            // Paladin
            65: { name: 'Holy', className: 'Paladin', classId: 2 },
            66: { name: 'Protection', className: 'Paladin', classId: 2 },
            70: { name: 'Retribution', className: 'Paladin', classId: 2 },
            // Priest
            256: { name: 'Discipline', className: 'Priest', classId: 5 },
            257: { name: 'Holy', className: 'Priest', classId: 5 },
            258: { name: 'Shadow', className: 'Priest', classId: 5 },
            // Rogue
            259: { name: 'Assassination', className: 'Rogue', classId: 4 },
            260: { name: 'Outlaw', className: 'Rogue', classId: 4 },
            261: { name: 'Subtlety', className: 'Rogue', classId: 4 },
            // Shaman
            262: { name: 'Elemental', className: 'Shaman', classId: 7 },
            263: { name: 'Enhancement', className: 'Shaman', classId: 7 },
            264: { name: 'Restoration', className: 'Shaman', classId: 7 },
            // Warlock
            265: { name: 'Affliction', className: 'Warlock', classId: 9 },
            266: { name: 'Demonology', className: 'Warlock', classId: 9 },
            267: { name: 'Destruction', className: 'Warlock', classId: 9 },
            // Warrior
            71: { name: 'Arms', className: 'Warrior', classId: 1 },
            72: { name: 'Fury', className: 'Warrior', classId: 1 },
            73: { name: 'Protection', className: 'Warrior', classId: 1 }
          };

          Object.entries(specData).forEach(([id, data]) => {
            specLookup[id] = {
              name: data.name,
              className: data.className,
              classId: data.classId,
              role: specRoles[id] || 'dps'
            };
          });

          // Helper function to sort members by role: tank, healer, dps
          function sortMembersByRole(members, specLookup) {
            const roleOrder = { 'tank': 0, 'healer': 1, 'dps': 2 };
            return members.slice().sort((a, b) => {
              const roleA = specLookup[a.specialization?.id]?.role || 'dps';
              const roleB = specLookup[b.specialization?.id]?.role || 'dps';
              return roleOrder[roleA] - roleOrder[roleB];
            });
          }

          // If we have local data, use it instead of fetching from API
          if (isHistoricalData && localData) {
            console.log('📦 Using local season data');
            periodId = localData.periodId;

            // Transform local data to match the expected format
            allLeaderboards = localData.dungeons.map(dungeon => ({
              id: dungeon.dungeonId,
              name: dungeon.dungeonName,
              data: dungeon.leaderboard,
              backgroundUrl: null // We'll fetch backgrounds later if needed
            }));

          } else if (seasonDetails.periods && seasonDetails.periods.length > 0) {
            // Check sessionStorage cache first
            const cacheKey = `mplus_cache_s${currentSeasonId}`;
            const cached = sessionStorage.getItem(cacheKey);
            if (cached) {
              try {
                const cachedData = JSON.parse(cached);
                // Cache valid for 30 minutes
                if (cachedData.timestamp && (Date.now() - cachedData.timestamp) < 30 * 60 * 1000) {
                  console.log('⚡ Using cached M+ data');
                  allLeaderboards = cachedData.leaderboards;
                  periodId = cachedData.periodId;
                }
              } catch (e) {
                sessionStorage.removeItem(cacheKey);
              }
            }

            if (allLeaderboards.length === 0) {
              // Fetch dungeons index and find valid period in parallel
              const recentPeriods = seasonDetails.periods.slice(-3).map(p => p.id).reverse();

              // Fetch dungeons index (just need IDs, not individual details)
              const dungeonsPromise = wowApi.getMythicKeystoneDungeons().catch(() => null);

              // Probe periods — try most recent first
              let foundPeriodWithData = false;
              for (const testPeriodId of recentPeriods) {
                try {
                  const testLeaderboard = await wowApi.getMythicKeystoneLeaderboard(557, testPeriodId);
                  if (testLeaderboard && testLeaderboard.leading_groups && testLeaderboard.leading_groups.length > 0) {
                    periodId = testPeriodId;
                    foundPeriodWithData = true;
                    break;
                  }
                } catch (error) {
                  // Period not available, try next
                }
              }

              if (!foundPeriodWithData) {
                html += `
                  <div style="margin: 20px; padding: 20px; background: rgba(255,165,0,0.2); border-radius: 8px;">
                    <h3>⚠️ No Leaderboard Data Available</h3>
                    <p>No recent leaderboard data found for Season ${seasonDetails.id}.</p>
                    <p>This likely means the season just started and no keys have been completed yet.</p>
                  </div>
                `;
                leaderboardContent.innerHTML = html;
                return;
              }

              // Get dungeon IDs from index (no individual detail fetches needed)
              let dungeonIds = [];
              const dungeonsData = await dungeonsPromise;
              if (dungeonsData && dungeonsData.dungeons) {
                dungeonIds = dungeonsData.dungeons.map(d => d.id);
              }

              // Dungeon-to-journal mapping for background images (loaded async after render)
              const dungeonToJournalMap = {
                161: 476, 239: 945, 402: 1201, 556: 278,
                557: 1299, 558: 1300, 559: 1316, 560: 1315
              };

              // Fetch all leaderboards in parallel — no background fetching here
              const results = await Promise.allSettled(
                dungeonIds.map(async (dungeonId) => {
                  try {
                    const leaderboard = await wowApi.getMythicKeystoneLeaderboard(dungeonId, periodId);
                    if (leaderboard && leaderboard.leading_groups && leaderboard.leading_groups.length > 0) {
                      return {
                        id: dungeonId,
                        name: leaderboard.map?.name || leaderboard.name || `Dungeon ${dungeonId}`,
                        data: leaderboard,
                        backgroundUrl: null,
                        journalInstanceId: dungeonToJournalMap[dungeonId] || null
                      };
                    }
                  } catch (error) {
                    return null;
                  }
                  return null;
                })
              );

              allLeaderboards = results
                .filter(r => r.status === 'fulfilled' && r.value !== null)
                .map(r => r.value);

              // Cache the results
              if (allLeaderboards.length > 0) {
                try {
                  sessionStorage.setItem(cacheKey, JSON.stringify({
                    timestamp: Date.now(),
                    periodId,
                    leaderboards: allLeaderboards
                  }));
                } catch (e) { /* storage full, no problem */ }
              }
            }

            if (allLeaderboards.length === 0) {
              html += `
                <div style="margin: 20px; padding: 20px; background: rgba(255,165,0,0.2); border-radius: 8px;">
                  <h3>⚠️ No Leaderboard Data Found</h3>
                  <p>Could not find leaderboard data for any dungeon in period ${periodId}.</p>
                </div>
              `;
              leaderboardContent.innerHTML = html;
              return;
            }

            if (allLeaderboards.length < 6 && !isHistoricalData) {
              console.warn(`⚠️ Only found ${allLeaderboards.length} dungeons with leaderboard data.`);
              html += `
                <div style="margin: 20px; padding: 15px; background: rgba(255,165,0,0.15); border-radius: 8px; border-left: 3px solid #FFA500;">
                  <p style="margin: 0; font-size: 14px;"><strong>⚠️ Note:</strong> Only ${allLeaderboards.length} of 8 season dungeons loaded. If not all dungeons are showing, please refresh the browser as there may have been a latency issue loading the stats.</p>
                </div>
              `;
            }
          }

          // Sort leaderboards by highest keystone level (difficulty) - works for both local and API data
          if (allLeaderboards.length > 0) {
            allLeaderboards.sort((a, b) => {
              const levelA = a.data.leading_groups[0]?.keystone_level || 0;
              const levelB = b.data.leading_groups[0]?.keystone_level || 0;
              return levelB - levelA; // Descending order (highest first)
            });

            // Calculate spec statistics from all leaderboard data, grouped by role
            const roleStats = {
              tank: {},
              healer: {},
              dps: {}
            };
            const roleTotals = { tank: 0, healer: 0, dps: 0 };
            let totalPlayers = 0;

            // Analyze all runs from all dungeons (top 8 runs per dungeon)
            allLeaderboards.forEach(lb => {
              const runsToAnalyze = lb.data.leading_groups.slice(0, 8); // Analyze top 8 runs per dungeon
              runsToAnalyze.forEach(run => {
                run.members.forEach(member => {
                  const specId = member.specialization?.id;
                  const specData = specLookup[specId];
                  const specName = specData?.name || 'Unknown';
                  const className = specData?.className || 'Unknown';
                  const classId = specData?.classId;
                  const role = specData?.role || 'dps';

                  if (specName !== 'Unknown') {
                    // Use spec name + class name as key (e.g., "Unholy Death Knight")
                    const specKey = `${specName} ${className}`;

                    if (!roleStats[role][specKey]) {
                      roleStats[role][specKey] = {
                        count: 0,
                        specName: specName,
                        className: className,
                        specId: specId,
                        classId: classId,
                        color: getClassColor(classId)
                      };
                    }
                    roleStats[role][specKey].count++;
                    roleTotals[role]++;
                    totalPlayers++;
                  }
                });
              });
            });

            // Convert role stats to arrays and sort by count
            const tankStatsArray = Object.entries(roleStats.tank)
              .map(([name, data]) => ({
                name,
                className: data.className,
                count: data.count,
                specId: data.specId,
                classId: data.classId,
                color: data.color,
                percentage: Math.ceil((data.count / roleTotals.tank) * 100)
              }))
              .sort((a, b) => b.count - a.count);

            const healerStatsArray = Object.entries(roleStats.healer)
              .map(([name, data]) => ({
                name,
                className: data.className,
                count: data.count,
                specId: data.specId,
                classId: data.classId,
                color: data.color,
                percentage: Math.ceil((data.count / roleTotals.healer) * 100)
              }))
              .sort((a, b) => b.count - a.count);

            const dpsStatsArray = Object.entries(roleStats.dps)
              .map(([name, data]) => ({
                name,
                className: data.className,
                count: data.count,
                specId: data.specId,
                classId: data.classId,
                color: data.color,
                percentage: Math.ceil((data.count / roleTotals.dps) * 100)
              }))
              .sort((a, b) => b.count - a.count);

            // Format period timestamp for display
            let lastUpdatedText = '';

            if (isHistoricalData && localData) {
              // For historical data, show when it was captured
              const capturedDate = new Date(localData.capturedAt);
              lastUpdatedText = `Historical data captured: ${capturedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
            } else {
              // Check if leaderboard has a last_modified_timestamp or completed_timestamp
              const sampleLeaderboard = allLeaderboards[0]?.data;
              const topRun = sampleLeaderboard?.leading_groups?.[0];

              if (topRun && topRun.completed_timestamp) {
                const completedDate = new Date(topRun.completed_timestamp);
                const now = new Date();
                const hoursDiff = Math.floor((now - completedDate) / (1000 * 60 * 60));
                const minutesDiff = Math.floor((now - completedDate) / (1000 * 60));

                if (minutesDiff < 60) {
                  lastUpdatedText = `Updated: ${minutesDiff} minute${minutesDiff !== 1 ? 's' : ''} ago`;
                } else if (hoursDiff < 24) {
                  lastUpdatedText = `Updated: ${hoursDiff} hour${hoursDiff !== 1 ? 's' : ''} ago`;
                } else {
                  lastUpdatedText = `Updated: ${completedDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} at ${completedDate.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
                }
              }
            }

            // Helper function to generate role section HTML
            const generateRoleSection = (roleTitle, roleIcon, statsArray, total) => {
              if (statsArray.length === 0) return '';
              return `
                <div class="role-stats-section">
                  <h4 class="role-stats-title">
                    <i class="${roleIcon}"></i>
                    ${roleTitle} <span class="role-total">(${total} players)</span>
                  </h4>
                  <div class="class-stats-grid">
                    ${statsArray.map(spec => {
                      const specIconUrl = getSpecIconUrl(spec.specId);
                      const classIconUrl = getClassIconUrl(spec.classId);
                      const specIconHtml = specIconUrl ? `<img src="${specIconUrl}" alt="${spec.name}" class="class-stat-icon" />` : '';
                      const classIconHtml = classIconUrl ? `<img src="${classIconUrl}" alt="${spec.className}" class="class-stat-icon" />` : '';
                      return `
                        <div class="class-stat-item">
                          <div class="class-stat-bar" style="width: ${spec.percentage}%; background: linear-gradient(90deg, ${spec.color}88, ${spec.color}44);"></div>
                          <div class="class-stat-info">
                            <span class="class-stat-name" style="color: ${spec.color};">
                              ${specIconHtml}
                              ${classIconHtml}
                              ${spec.className}
                            </span>
                            <span class="class-stat-value">${spec.percentage}% <span class="class-stat-count">(${spec.count})</span></span>
                          </div>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `;
            };

            // Build meta composition showcase (top tank, healer, 3 DPS)
            const topTank = tankStatsArray[0];
            const topHealer = healerStatsArray[0];
            const topDPS = dpsStatsArray.slice(0, 3);

            const metaShowcaseHtml = `
              <div class="meta-showcase">
                <h3 class="meta-showcase-title">Current Meta Composition</h3>
                <div class="meta-showcase-icons">
                  ${topTank ? `
                    <div class="meta-icon-wrapper">
                      <span class="meta-percentage">${topTank.percentage}%</span>
                      <img src="${getClassIconUrl(topTank.classId)}" alt="${topTank.className}" class="meta-class-icon" />
                      <img src="${getSpecIconUrl(topTank.specId)}" alt="${topTank.name}" class="meta-spec-badge" />
                    </div>
                  ` : ''}
                  ${topHealer ? `
                    <div class="meta-icon-wrapper">
                      <span class="meta-percentage">${topHealer.percentage}%</span>
                      <img src="${getClassIconUrl(topHealer.classId)}" alt="${topHealer.className}" class="meta-class-icon" />
                      <img src="${getSpecIconUrl(topHealer.specId)}" alt="${topHealer.name}" class="meta-spec-badge" />
                    </div>
                  ` : ''}
                  ${topDPS.map(dps => `
                    <div class="meta-icon-wrapper">
                      <span class="meta-percentage">${dps.percentage}%</span>
                      <img src="${getClassIconUrl(dps.classId)}" alt="${dps.className}" class="meta-class-icon" />
                      <img src="${getSpecIconUrl(dps.specId)}" alt="${dps.name}" class="meta-spec-badge" />
                    </div>
                  `).join('')}
                </div>
                <a href="#class-stats-section" class="meta-view-all">
                  All class stats <i class="las la-angle-down"></i>
                </a>
              </div>
            `;

            // Build class statistics section with role breakdown
            const classStatsHtml = `
              <div id="class-stats-section" class="class-stats-section">
                <h3>Specialisation Distribution by Role <span class="meta-subtitle">(Top ${allLeaderboards.length * 8} Runs)</span></h3>
                <div class="role-stats-container">
                  ${generateRoleSection('Tanks', 'las la-shield-alt', tankStatsArray, roleTotals.tank)}
                  ${generateRoleSection('Healers', 'las la-plus-circle', healerStatsArray, roleTotals.healer)}
                  ${generateRoleSection('DPS', 'las la-crosshairs', dpsStatsArray, roleTotals.dps)}
                </div>
              </div>
            `;

            // Build summary section with top run from each dungeon
            html += `
              ${metaShowcaseHtml}
              <div class="leaderboard-summary">
                <div class="roster-controls">
                  ${lastUpdatedText ? `<div class="leaderboard-status">${lastUpdatedText}</div>` : ''}
                  <div class="affix-icons-strip" id="affix-icons-strip"></div>
                  <div id="dungeon-dropdown-container"></div>
                </div>

                <div id="detailed-leaderboard"></div>

                <div class="dungeon-grid">
                ${allLeaderboards.map(lb => {
                  const topRun = lb.data.leading_groups[0];

                  return `
                    <div class="dungeon-card" data-journal-id="${lb.journalInstanceId || ''}">
                      <div class="dungeon-background-overlay"></div>
                      <div class="dungeon-card-header">
                        <strong class="dungeon-name">${lb.name} +${topRun.keystone_level}</strong>
                        <div class="dungeon-stats">
                          <span class="duration">${formatDuration(topRun.duration)}</span>
                        </div>
                      </div>
                      <div class="dungeon-team">
                        ${sortMembersByRole(topRun.members, specLookup).map(m => {
                          const specData = specLookup[m.specialization?.id];
                          const spec = specData?.name || 'Unknown';
                          const className = specData?.className || 'Unknown';
                          const specId = m.specialization?.id;
                          const classId = specData?.classId;

                          // Determine faction
                          const isAlliance = m.faction?.type === 'ALLIANCE';
                          const factionClass = isAlliance ? 'alliance' : 'horde';

                          // Get realm
                          const realmSlug = m.profile?.realm?.slug || '';
                          const realm = realmSlug ? realmSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown Realm';

                          // Get spec and class icon URLs
                          const specIconUrl = getSpecIconUrl(specId);
                          const classIconUrl = getClassIconUrl(classId);
                          const specIconHtml = specIconUrl ? `<img src="${specIconUrl}" alt="${spec}" class="member-icon" />` : '';
                          const classIconHtml = classIconUrl ? `<img src="${classIconUrl}" alt="${className}" class="member-icon" />` : '';

                          // Build armory URL
                          const region = m.profile?.region || 'eu';
                          const characterName = m.profile?.name?.toLowerCase() || '';
                          const armoryUrl = `https://worldofwarcraft.blizzard.com/en-gb/character/${region}/${realmSlug}/${characterName}`;

                          // Get class color
                          const classColor = getClassColor(classId);

                          return `<a href="${armoryUrl}" target="_blank" class="team-member ${factionClass}">${specIconHtml}${classIconHtml}<span class="member-info"><span class="member-name" style="color: ${classColor}">${m.profile.name}</span><span class="member-realm">${realm}</span></span><i class="las la-angle-right"></i></a>`;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
                </div>
              </div>
              ${classStatsHtml}
            `;

            leaderboardContent.innerHTML = html;

            // Load current affixes from Raider.IO (non-blocking)
            fetch('https://raider.io/api/v1/mythic-plus/affixes?region=eu&locale=en')
              .then(r => r.json())
              .then(affixData => {
                const strip = document.getElementById('affix-icons-strip');
                if (strip && affixData.affix_details) {
                  strip.innerHTML = affixData.affix_details.map(a =>
                    `<div class="affix-icon-wrapper"><img src="https://wow.zamimg.com/images/wow/icons/large/${a.icon}.jpg" class="affix-icon-circle" /><span class="affix-tooltip">${a.name}</span></div>`
                  ).join('');
                }
              }).catch(() => {});

            // Load dungeon background images (non-blocking, after render)
            document.querySelectorAll('.dungeon-card[data-journal-id]').forEach(async (card) => {
              const journalId = card.dataset.journalId;
              if (!journalId) return;
              try {
                const mediaData = await wowApi.getJournalInstanceMedia(parseInt(journalId));
                const tileAsset = mediaData?.assets?.find(a => a.key === 'tile');
                if (tileAsset?.value) {
                  card.style.backgroundImage = `url('${tileAsset.value}')`;
                  card.classList.add('has-background');
                }
              } catch (e) { /* background not available */ }
            });

            // Store leaderboards and spec lookup for dropdown handler
            window.allLeaderboards = allLeaderboards;
            window.specLookup = specLookup;

            // Initialize custom dropdown for dungeon selection
            const dungeonDropdownContainer = document.getElementById('dungeon-dropdown-container');
            const dungeonOptions = [
              { value: '', label: 'All Dungeons' },
              ...allLeaderboards.map(lb => ({
                value: lb.id,
                label: lb.name
              }))
            ];

            const dungeonDropdown = new CustomDropdown({
              id: 'dungeon-dropdown',
              label: 'Select Dungeon',
              options: dungeonOptions,
              selectedValue: '',
              onChange: (selectedDungeonId) => {
                const detailedContent = document.getElementById('detailed-leaderboard');
                const summaryGrid = document.querySelector('.leaderboard-summary .dungeon-grid');

                if (!selectedDungeonId) {
                  detailedContent.innerHTML = '';
                  if (summaryGrid) summaryGrid.style.display = 'grid';
                  return;
                }

                // Hide summary grid when showing detailed view
                if (summaryGrid) summaryGrid.style.display = 'none';

                const selectedLeaderboard = window.allLeaderboards.find(lb => lb.id === selectedDungeonId);
                if (!selectedLeaderboard) return;

                const lb = selectedLeaderboard.data;
                const specLookup = window.specLookup;
                const journalId = selectedLeaderboard.journalInstanceId;

                detailedContent.innerHTML = `
                  <div class="dungeon-grid">
                    ${lb.leading_groups.slice(0, 8).map((group) => `
                      <div class="dungeon-card" data-journal-id="${journalId || ''}">
                        <div class="dungeon-background-overlay"></div>
                        <div class="dungeon-card-header">
                          <strong class="dungeon-name"><span class="dungeon-ranking">#${group.ranking}</span> ${selectedLeaderboard.name} +${group.keystone_level}</strong>
                          <div class="dungeon-stats">
                            <span class="duration">${formatDuration(group.duration)}</span>
                          </div>
                        </div>
                        <div class="dungeon-team">
                          ${sortMembersByRole(group.members, specLookup).map(member => {
                            const specData = specLookup[member.specialization?.id];
                            const spec = specData?.name || 'Unknown';
                            const className = specData?.className || 'Unknown';
                            const specId = member.specialization?.id;
                            const classId = specData?.classId;

                            // Determine faction
                            const isAlliance = member.faction?.type === 'ALLIANCE';
                            const factionClass = isAlliance ? 'alliance' : 'horde';

                            // Get realm
                            const realmSlug = member.profile?.realm?.slug || '';
                            const realm = realmSlug ? realmSlug.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') : 'Unknown Realm';

                            // Get spec and class icon URLs
                            const specIconUrl = getSpecIconUrl(specId);
                            const classIconUrl = getClassIconUrl(classId);
                            const specIconHtml = specIconUrl ? `<img src="${specIconUrl}" alt="${spec}" class="member-icon" />` : '';
                            const classIconHtml = classIconUrl ? `<img src="${classIconUrl}" alt="${className}" class="member-icon" />` : '';

                            // Build armory URL
                            const region = member.profile?.region || 'eu';
                            const characterName = member.profile?.name?.toLowerCase() || '';
                            const armoryUrl = `https://worldofwarcraft.blizzard.com/en-gb/character/${region}/${realmSlug}/${characterName}`;

                            // Get class color
                            const classColor = getClassColor(classId);

                            return `<a href="${armoryUrl}" target="_blank" class="team-member ${factionClass}">${specIconHtml}${classIconHtml}<span class="member-info"><span class="member-name" style="color: ${classColor}">${member.profile.name}</span><span class="member-realm">${realm}</span></span><i class="las la-angle-right"></i></a>`;
                          }).join('')}
                        </div>
                      </div>
                    `).join('')}
                  </div>
                `;

                // Load backgrounds for detailed view cards
                detailedContent.querySelectorAll('.dungeon-card[data-journal-id]').forEach(async (card) => {
                  const jId = card.dataset.journalId;
                  if (!jId) return;
                  try {
                    const mediaData = await wowApi.getJournalInstanceMedia(parseInt(jId));
                    const tileAsset = mediaData?.assets?.find(a => a.key === 'tile');
                    if (tileAsset?.value) {
                      card.style.backgroundImage = `url('${tileAsset.value}')`;
                      card.classList.add('has-background');
                    }
                  } catch (e) {}
                });
              }
            });

            // Attach dropdown to container
            dungeonDropdown.attachToElement(dungeonDropdownContainer);

            // Add smooth scroll handler for "all class stats" link
            const metaViewAllLink = document.querySelector('.meta-view-all');
            if (metaViewAllLink) {
              metaViewAllLink.addEventListener('click', (e) => {
                e.preventDefault();
                const statsSection = document.getElementById('class-stats-section');
                if (statsSection) {
                  statsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
              });
            }
          }
        } else {
          leaderboardContent.innerHTML = '<p>No season data available</p>';
        }

      } catch (error) {
        console.error('Error loading Mythic+ data:', error);
        leaderboardContent.innerHTML = `
          <div style="margin: 20px; padding: 20px; background: rgba(255,0,0,0.2); border-radius: 8px;">
            <p>Error loading Mythic+ data: ${error.message}</p>
            <pre style="color: #fff; overflow: auto;">${error.stack}</pre>
          </div>
        `;
      }
    }
  });
});
