// Mythic+ Leaderboards Page
import PageInitializer from './utils/page-initializer.js';
import wowApi from './api/wow-api.js';
import config from './config.js';
import { getFactionIconUrl, getSpecIconUrl, getClassIconUrl } from './utils/wow-icons.js';
import CustomDropdown from './components/custom-dropdown.js';

console.log('⚡ Mythic+ Leaderboards Page initialized');

// Debug: Check connected realm ID
async function checkConnectedRealmId() {
  try {
    const realmInfo = await wowApi.getRealmInfo(config.guild.realmSlug);
    console.log('🔍 Realm Info:', realmInfo);
    console.log('🔍 Connected Realm ID from API:', realmInfo.connected_realm?.href);
    console.log('🔍 Config connected realm ID:', config.guild.connectedRealmId);
  } catch (error) {
    console.error('Failed to fetch realm info:', error);
  }
}
checkConnectedRealmId();

// Helper to format duration from milliseconds
function formatDuration(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    onInit: async () => {
      const leaderboardContent = document.getElementById('leaderboard-content');

      try {
        leaderboardContent.innerHTML = '<p>Loading Mythic+ data...</p>';

        // Fetch current season
        const seasonsData = await wowApi.getMythicKeystoneSeasons();
        console.log('Mythic Keystone Seasons:', seasonsData);

        // Get the current season (last in the list)
        if (seasonsData && seasonsData.seasons && seasonsData.seasons.length > 0) {
          const currentSeasonRef = seasonsData.seasons[seasonsData.seasons.length - 1];
          const currentSeasonId = currentSeasonRef.id;

          // Fetch current season details
          const seasonDetails = await wowApi.getMythicKeystoneSeasonDetails(currentSeasonId);
          console.log('Current Season Details:', seasonDetails);

          // Update the header info-description with season data
          const infoDescription = document.querySelector('.mythic-plus-header .info-description');
          if (infoDescription) {
            const startDate = new Date(seasonDetails.start_timestamp).toLocaleDateString();
            const status = seasonDetails.end_timestamp ? 'Ended' : 'Active';
            infoDescription.textContent = `Season ${seasonDetails.id} • Start: ${startDate} • Status: ${status}`;
          }

          let html = ``;

          // Try to fetch leaderboard data
          console.log('🚀 STARTING LEADERBOARD FETCH SECTION');

          if (seasonDetails.periods && seasonDetails.periods.length > 0) {
            console.log('✅ All periods in season:', seasonDetails.periods.map(p => p.id));

            // Try all periods starting from most recent to find one with data
            const periodsToTry = seasonDetails.periods.map(p => p.id).reverse(); // Start with most recent

            console.log('✅ Will try periods in this order:', periodsToTry);

            let periodId = null;
            let foundPeriodWithData = false;

            // Try each period until we find one with leaderboard data
            for (const testPeriodId of periodsToTry) {
              console.log(`🔍 Testing period ${testPeriodId} for data...`);

              // Try first Season 3 dungeon (Halls of Atonement, ID 378) to see if this period has data
              try {
                const testLeaderboard = await wowApi.getMythicKeystoneLeaderboard(378, testPeriodId);
                if (testLeaderboard && testLeaderboard.leading_groups && testLeaderboard.leading_groups.length > 0) {
                  console.log(`✅ Period ${testPeriodId} has data! (${testLeaderboard.leading_groups.length} runs)`);
                  periodId = testPeriodId;
                  foundPeriodWithData = true;
                  break;
                } else {
                  console.log(`⚠️ Period ${testPeriodId} has no run data yet`);
                }
              } catch (error) {
                console.log(`❌ Period ${testPeriodId} not available`);
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

            const currentPeriod = seasonDetails.periods.find(p => p.id === periodId);
            console.log('✅ Using Period:', currentPeriod);
            console.log('✅ Period ID:', periodId);

            // Fetch period details to see if it has dungeon info
            console.log('📡 Fetching period details...');
            try {
              const periodDetails = await wowApi.getMythicKeystonePeriod(periodId);
              console.log('✅ Period Details:', periodDetails);
            } catch (periodError) {
              console.error('❌ Error fetching period details:', periodError);
            }

            // Try fetching journal instances to find season dungeons
            let dungeonIds = [];

            console.log('🔍 Attempting to fetch journal instances...');
            try {
              const journalData = await wowApi.getJournalInstances();
              console.log('✅ Journal Instances received:', journalData);
              console.log('📊 Number of instances:', journalData?.instances?.length);

              if (journalData && journalData.instances) {
                // The last entries are typically the current season
                const last10 = journalData.instances.slice(-10);
                console.log('Last 10 journal instances:', last10);

                // Log each instance to see the structure
                last10.forEach((inst, idx) => {
                  console.log(`Instance ${idx}:`, inst.name, 'ID:', inst.id, 'Expansion:', inst.expansion);
                });

                // Extract dungeon IDs from War Within dungeons (expansion ID 514)
                const twwDungeons = last10.filter(inst => {
                  const expansionId = inst.expansion?.id;
                  console.log(`Checking ${inst.name}: expansion ID = ${expansionId}`);
                  return expansionId === 514;
                });
                console.log('The War Within dungeons:', twwDungeons);

                // If no TWW dungeons found, just use all from last 10
                if (twwDungeons.length > 0) {
                  dungeonIds = twwDungeons.map(d => d.id);
                  console.log('Found TWW dungeon IDs from journal:', dungeonIds);
                } else {
                  // Fallback: use all IDs from last 10
                  dungeonIds = last10.map(d => d.id);
                  console.log('Using all IDs from last 10 instances:', dungeonIds);
                }

                // Get the last instance details (should be current season)
                const lastInstance = journalData.instances[journalData.instances.length - 1];
                console.log('Last journal instance:', lastInstance);

                if (lastInstance && lastInstance.id) {
                  const instanceDetails = await wowApi.getJournalInstance(lastInstance.id);
                  console.log('Last Instance Details:', instanceDetails);
                }
              } else {
                console.log('❌ Journal data structure unexpected:', journalData);
              }
            } catch (journalError) {
              console.error('❌ Error fetching journal:', journalError);
              console.error('Error details:', journalError.message, journalError.status);
            }

            // Also try the dungeons endpoint and filter for Season 3 dungeons
            try {
              const dungeonsData = await wowApi.getMythicKeystoneDungeons();
              console.log('Mythic Keystone Dungeons:', dungeonsData);

              if (dungeonsData && dungeonsData.dungeons) {
                console.log('Fetching dungeon names to match Season 3 rotation...');

                // TWW Season 3 dungeon names
                const season3Dungeons = [
                  'Eco-Dome Al\'dani',
                  'Ara-Kara, City of Echoes',
                  'The Dawnbreaker',
                  'Operation: Floodgate',
                  'Priory of the Sacred Flame',
                  'Halls of Atonement',
                  'Tazavesh: Streets of Wonder',
                  'Tazavesh: So\'leah\'s Gambit'
                ];

                // Fetch details for each dungeon to get names
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

                console.log('All dungeon names:', validDungeons);

                // Filter for Season 3 dungeons
                dungeonIds = validDungeons
                  .filter(d => season3Dungeons.includes(d.name))
                  .map(d => d.id);

                console.log('Found Season 3 dungeon IDs:', dungeonIds);
              }
            } catch (dungeonsError) {
              console.error('Error fetching dungeons:', dungeonsError);
            }

            // Fallback if we couldn't find Season 3 dungeons
            if (dungeonIds.length === 0) {
              console.log('Could not identify Season 3 dungeons, trying all available IDs...');
              try {
                const dungeonsData = await wowApi.getMythicKeystoneDungeons();
                if (dungeonsData && dungeonsData.dungeons) {
                  dungeonIds = dungeonsData.dungeons.map(d => d.id);
                }
              } catch (error) {
                console.error('Failed to get fallback dungeon IDs:', error);
              }
            }

            // Fetch playable specializations for lookup
            console.log('📥 Fetching specialization data...');
            let specLookup = {};
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
                    classId: spec.playable_class?.id
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
                  classId: spec.classId
                };
              });

              console.log('✓ Loaded spec lookup data:', Object.keys(specLookup).length, 'specs');
            } catch (error) {
              console.error('Failed to load spec data:', error);
            }

            // Fetch all dungeon leaderboards
            console.log('📥 Fetching all dungeon leaderboards...');
            const allLeaderboards = [];

            // Manual mapping of dungeon IDs to journal instance IDs for backgrounds
            // All Season 3 dungeons now have correct backgrounds!
            const dungeonToJournalMap = {
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
            const dungeonNameOverrides = {
              391: "Tazavesh: Streets of Wonder",
              392: "Tazavesh: So'leah's Gambit"
            };

            for (const dungeonId of dungeonIds) {
              try {
                const leaderboard = await wowApi.getMythicKeystoneLeaderboard(dungeonId, periodId);
                if (leaderboard && leaderboard.leading_groups && leaderboard.leading_groups.length > 0) {
                  // Debug: Log first member structure
                  if (dungeonId === dungeonIds[0] && leaderboard.leading_groups[0]?.members?.[0]) {
                    console.log('📊 Member data structure:', leaderboard.leading_groups[0].members[0]);
                  }

                  // Fetch dungeon background image
                  let backgroundUrl = null;
                  const journalInstanceId = dungeonToJournalMap[dungeonId];
                  if (journalInstanceId) {
                    try {
                      const mediaData = await wowApi.getJournalInstanceMedia(journalInstanceId);
                      const tileAsset = mediaData.assets?.find(asset => asset.key === 'tile');
                      backgroundUrl = tileAsset?.value || null;
                      console.log(`  Background for ${leaderboard.map?.name}: ${backgroundUrl ? '✓' : '✗'}`);
                    } catch (bgError) {
                      console.warn(`  Could not load background for dungeon ${dungeonId}`);
                    }
                  }

                  // Use override name if available, otherwise use API name
                  const dungeonName = dungeonNameOverrides[dungeonId] || leaderboard.map?.name || leaderboard.name || `Dungeon ${dungeonId}`;

                  allLeaderboards.push({
                    id: dungeonId,
                    name: dungeonName,
                    data: leaderboard,
                    backgroundUrl: backgroundUrl
                  });
                  console.log(`✓ ${leaderboard.map?.name}: ${leaderboard.leading_groups.length} runs`);
                }
              } catch (error) {
                console.log(`✗ Dungeon ${dungeonId} not available`);
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

            // Build summary section with top run from each dungeon
            html += `
              <div class="leaderboard-summary">
                <div class="roster-controls">
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
                        ${topRun.members.map(m => {
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

                          return `<span class="team-member ${factionClass}">${specIconHtml}${classIconHtml}<span class="member-info"><span class="member-name">${m.profile.name}</span><span class="member-realm">${realm}</span></span></span>`;
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
              { value: '', label: 'Top runs, all dungeons' },
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
                          ${group.members.map(member => {
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

                            return `<span class="team-member ${factionClass}">${specIconHtml}${classIconHtml}<span class="member-info"><span class="member-name">${member.profile.name}</span><span class="member-realm">${realm}</span></span></span>`;
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
