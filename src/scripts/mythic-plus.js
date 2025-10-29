// Mythic+ Leaderboards Page
import PageInitializer from './utils/page-initializer.js';
import wowApi from './api/wow-api.js';
import config from './config.js';
import { getFactionIconUrl, getSpecIconUrl, getClassIconUrl } from './utils/wow-icons.js';
import { getClassColor } from './utils/wow-constants.js';
import CustomDropdown from './components/custom-dropdown.js';

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
      const leaderboardContent = document.getElementById('leaderboard-content');

      try {
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

          // Update the header info-description with season data
          const infoDescription = document.querySelector('.mythic-plus-header .info-description');
          if (infoDescription) {
            const startDate = new Date(seasonDetails.start_timestamp).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            });
            const isActive = !seasonDetails.end_timestamp;
            const statusClass = isActive ? 'status-success' : 'status-danger';
            const statusText = isActive ? 'Active' : 'Ended';

            // Add historical data badge if using local data
            const historicalBadge = isHistoricalData ?
              `<span class="status-info" style="margin-left: 8px;">Historical Data</span>` : '';

            infoDescription.innerHTML = `
              <div class="season-status-wrapper">
                <div style="display: flex; gap: 8px; align-items: center;">
                  <span class="${statusClass}">Season ${seasonDetails.id} is ${statusText}</span>
                  ${historicalBadge}
                </div>
                <div class="season-date">
                  <i class="las la-fire"></i>
                  ${startDate}
                </div>
              </div>
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

          try {
            // Common spec IDs
            const commonSpecIds = [
              250, 251, 252, // Death Knight
              577, 581, // Demon Hunter
              102, 103, 104, 105, // Druid
              1467, 1468, 1473, // Evoker
              253, 254, 255, // Hunter
              62, 63, 64, // Mage
              268, 270, 269, // Monk
              65, 66, 70, // Paladin
              256, 257, 258, // Priest
              259, 260, 261, // Rogue
              262, 263, 264, // Shaman
              265, 266, 267, // Warlock
              71, 72, 73 // Warrior
            ];

            const specPromises = commonSpecIds.map(async (specId) => {
              try {
                const spec = await wowApi.getPlayableSpecialization(specId);
                return {
                  id: specId,
                  name: spec.name,
                  className: spec.playable_class?.name,
                  classId: spec.playable_class?.id,
                  role: specRoles[specId] || 'dps'
                };
              } catch (error) {
                return null;
              }
            });

            const specs = await Promise.all(specPromises);
            specs.filter(s => s).forEach(spec => {
              specLookup[spec.id] = {
                name: spec.name,
                className: spec.className,
                classId: spec.classId,
                role: spec.role
              };
            });
          } catch (error) {
            console.error('Failed to load spec data:', error);
          }

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
            // Fetch from API (existing logic)
            // Try all periods starting from most recent to find one with data
            const periodsToTry = seasonDetails.periods.map(p => p.id).reverse(); // Start with most recent

            let foundPeriodWithData = false;

            // Try each period until we find one with leaderboard data
            for (const testPeriodId of periodsToTry) {
              // Try first Season 3 dungeon (Halls of Atonement, ID 378) to see if this period has data
              try {
                const testLeaderboard = await wowApi.getMythicKeystoneLeaderboard(378, testPeriodId);
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
                  <p>None of the ${periodsToTry.length} periods in Season 3 have leaderboard data yet.</p>
                  <p>This likely means the season just started and no keys have been completed.</p>
                </div>
              `;
              leaderboardContent.innerHTML = html;
              return;
            }

            // Fetch current season dungeons from the Mythic Keystone Dungeons API
            let dungeonIds = [];

            try {
              const dungeonsData = await wowApi.getMythicKeystoneDungeons();

              if (dungeonsData && dungeonsData.dungeons) {
                // Fetch details for each dungeon to get names and IDs
                const dungeonDetailsPromises = dungeonsData.dungeons.map(async (d) => {
                  try {
                    const details = await wowApi.getMythicKeystoneDungeon(d.id);
                    return { id: d.id, name: details.name };
                  } catch (error) {
                    return null;
                  }
                });

                const dungeonDetails = await Promise.all(dungeonDetailsPromises);
                const validDungeons = dungeonDetails.filter(d => d !== null);

                // Use all valid dungeon IDs - the API should only return current season dungeons
                dungeonIds = validDungeons.map(d => d.id);
              }
            } catch (dungeonsError) {
              console.error('Error fetching dungeons:', dungeonsError);
            }

            // Fetch all dungeon leaderboards
            // Manual mapping of dungeon IDs to journal instance IDs for backgrounds
            // Add mappings here as needed for current season dungeons
            const dungeonToJournalMap = {
              // TWW Season 3 (Jan 2025+)
              378: 1185, // Halls of Atonement
              391: 1194, // Tazavesh: Streets of Wonder (part of Tazavesh, the Veiled Market)
              392: 1194, // Tazavesh: So'leah's Gambit (part of Tazavesh, the Veiled Market)
              499: 1267, // Priory of the Sacred Flame
              503: 1271, // Ara-Kara, City of Echoes
              505: 1270, // The Dawnbreaker
              525: 1298, // Operation: Floodgate
              542: 1303  // Eco-Dome Al'dani
            };

            // Manual name overrides for dungeons with incorrect API names
            // Add overrides here as needed
            const dungeonNameOverrides = {
              391: "Tazavesh: Streets of Wonder",
              392: "Tazavesh: So'leah's Gambit"
            };

            // Helper function to fetch a single dungeon with retry logic
            async function fetchDungeonLeaderboard(dungeonId, periodId, retries = 3) {
              for (let attempt = 0; attempt < retries; attempt++) {
                try {
                  const leaderboard = await wowApi.getMythicKeystoneLeaderboard(dungeonId, periodId);
                  if (leaderboard && leaderboard.leading_groups && leaderboard.leading_groups.length > 0) {
                    // Fetch dungeon background image
                    let backgroundUrl = null;
                    const journalInstanceId = dungeonToJournalMap[dungeonId];
                    if (journalInstanceId) {
                      try {
                        const mediaData = await wowApi.getJournalInstanceMedia(journalInstanceId);
                        const tileAsset = mediaData.assets?.find(asset => asset.key === 'tile');
                        backgroundUrl = tileAsset?.value || null;
                      } catch (bgError) {
                        // Background not available
                      }
                    }

                    // Use override name if available, otherwise use API name
                    const dungeonName = dungeonNameOverrides[dungeonId] || leaderboard.map?.name || leaderboard.name || `Dungeon ${dungeonId}`;

                    return {
                      id: dungeonId,
                      name: dungeonName,
                      data: leaderboard,
                      backgroundUrl: backgroundUrl
                    };
                  }
                  return null;
                } catch (error) {
                  if (attempt < retries - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
                  } else {
                    return null;
                  }
                }
              }
              return null;
            }

            // Fetch all dungeons in parallel with Promise.allSettled to ensure all complete
            const leaderboardPromises = dungeonIds.map(dungeonId =>
              fetchDungeonLeaderboard(dungeonId, periodId)
            );

            const results = await Promise.allSettled(leaderboardPromises);

            // Filter out failed/null results
            allLeaderboards = results
              .filter(result => result.status === 'fulfilled' && result.value !== null)
              .map(result => result.value);

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

            // Only show warning if we got suspiciously few dungeons (less than 6, since a season typically has 8)
            if (allLeaderboards.length < 6 && !isHistoricalData) {
              console.warn(`⚠️ Only found ${allLeaderboards.length} dungeons with leaderboard data. Expected around 8 for a typical season.`);
              html += `
                <div style="margin: 20px; padding: 15px; background: rgba(255,165,0,0.15); border-radius: 8px; border-left: 3px solid #FFA500;">
                  <p style="margin: 0; font-size: 14px;"><strong>⚠️ Note:</strong> Only ${allLeaderboards.length} dungeon${allLeaderboards.length !== 1 ? 's' : ''} loaded. Some dungeons may be unavailable or the season may have just started.</p>
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

            // Build summary section with top run from each dungeon
            html += `
              <div class="leaderboard-summary">
                <div class="roster-controls">
                  ${lastUpdatedText ? `<div class="leaderboard-status">${lastUpdatedText}</div>` : ''}
                  <div id="dungeon-dropdown-container"></div>
                </div>

                <div id="detailed-leaderboard"></div>

                <div class="dungeon-grid">
                ${allLeaderboards.map(lb => {
                  const topRun = lb.data.leading_groups[0];
                  const hasBackground = !!lb.backgroundUrl;
                  const bgStyle = hasBackground
                    ? `background-image: url('${lb.backgroundUrl}');`
                    : '';

                  return `
                    <div class="dungeon-card ${hasBackground ? 'has-background' : ''}" style="${bgStyle}">
                      ${hasBackground ? '<div class="dungeon-background-overlay"></div>' : ''}
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
            `;

            leaderboardContent.innerHTML = html;

            // Store leaderboards and spec lookup for dropdown handler
            window.allLeaderboards = allLeaderboards;
            window.specLookup = specLookup;

            // Initialize custom dropdown for dungeon selection
            const dungeonDropdownContainer = document.getElementById('dungeon-dropdown-container');
            const dungeonOptions = [
              { value: '', label: 'Dungeon leaderboard' },
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
                const backgroundUrl = selectedLeaderboard.backgroundUrl;
                const hasBackground = !!backgroundUrl;
                const bgStyle = hasBackground ? `background-image: url('${backgroundUrl}');` : '';

                detailedContent.innerHTML = `
                  <div class="dungeon-grid">
                    ${lb.leading_groups.slice(0, 8).map((group) => `
                      <div class="dungeon-card ${hasBackground ? 'has-background' : ''}" style="${bgStyle}">
                        ${hasBackground ? '<div class="dungeon-background-overlay"></div>' : ''}
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
              }
            });

            // Attach dropdown to container
            dungeonDropdown.attachToElement(dungeonDropdownContainer);
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
