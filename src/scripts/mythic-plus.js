// Mythic+ Leaderboards Page
import PageInitializer from './utils/page-initializer.js';
import wowApi from './api/wow-api.js';

console.log('⚡ Mythic+ Leaderboards Page initialized');

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

          let html = `
            <div style="margin: 20px; padding: 20px; background: rgba(0,0,0,0.5); border-radius: 8px;">
              <h2>Season ${seasonDetails.id}</h2>
              <p>Start: ${new Date(seasonDetails.start_timestamp).toLocaleDateString()}</p>
              ${seasonDetails.end_timestamp ? `<p>End: ${new Date(seasonDetails.end_timestamp).toLocaleDateString()}</p>` : '<p>Status: Active</p>'}
            </div>
          `;

          // Try to fetch leaderboard data
          if (seasonDetails.periods && seasonDetails.periods.length > 0) {
            const currentPeriod = seasonDetails.periods[seasonDetails.periods.length - 1];
            const periodId = currentPeriod.id;

            console.log('Current Period:', currentPeriod);
            console.log('Period ID:', periodId);

            // Fetch period details to see if it has dungeon info
            try {
              const periodDetails = await wowApi.getMythicKeystonePeriod(periodId);
              console.log('Period Details:', periodDetails);
            } catch (periodError) {
              console.error('Error fetching period details:', periodError);
            }

            // Fetch the dungeons index to get actual dungeon IDs
            let dungeonIds = [];
            try {
              const dungeonsData = await wowApi.getMythicKeystoneDungeons();
              console.log('Mythic Keystone Dungeons:', dungeonsData);

              if (dungeonsData && dungeonsData.dungeons) {
                dungeonIds = dungeonsData.dungeons.map(d => d.id);
                console.log('Found dungeon IDs:', dungeonIds);
              }
            } catch (dungeonsError) {
              console.error('Error fetching dungeons:', dungeonsError);
            }

            // Fallback to trying common IDs if we couldn't get the list
            if (dungeonIds.length === 0) {
              dungeonIds = [
                670, 671, 672, 673, 674, 675, 676, 677, 678, 679, 680,
                507, 508, 509, 510, 511, 512, 513, 514,
                375, 376, 377, 378, 379, 380, 381, 382
              ];
            }

            html += `
              <div style="margin: 20px; padding: 20px; background: rgba(0,0,0,0.5); border-radius: 8px;">
                <h3>Current Period: ${periodId}</h3>
                <p>Found ${dungeonIds.length} dungeons to check. Fetching leaderboards...</p>
              </div>
            `;

            let foundLeaderboard = false;

            for (const dungeonId of dungeonIds) {
              try {
                console.log(`Trying dungeon ${dungeonId}...`);
                const leaderboard = await wowApi.getMythicKeystoneLeaderboard(dungeonId, periodId);
                console.log(`✓ Leaderboard for dungeon ${dungeonId}:`, leaderboard);

                if (leaderboard && leaderboard.leading_groups && leaderboard.leading_groups.length > 0) {
                  foundLeaderboard = true;
                  html += `
                    <div style="margin: 20px; padding: 20px; background: rgba(0,0,0,0.5); border-radius: 8px;">
                      <h3>${leaderboard.map?.name || `Dungeon ${dungeonId}`}</h3>
                      <p>Showing top ${Math.min(10, leaderboard.leading_groups.length)} runs</p>

                      ${leaderboard.leading_groups.slice(0, 10).map((group, index) => `
                        <div style="margin: 15px 0; padding: 15px; background: rgba(255,255,255,0.05); border-radius: 4px; border-left: 3px solid #ffd100;">
                          <div style="margin-bottom: 10px;">
                            <strong style="color: #ffd100;">#${group.ranking}</strong> -
                            <strong>+${group.keystone_level}</strong> -
                            ${formatDuration(group.duration)} -
                            ${new Date(group.completed_timestamp).toLocaleDateString()}
                          </div>
                          <div style="margin-left: 20px;">
                            <strong>Team:</strong>
                            <ul style="list-style: none; padding-left: 0; margin: 5px 0;">
                              ${group.members.map(member => `
                                <li style="padding: 3px 0;">
                                  ${member.profile.name} -
                                  ${member.profile.realm.name} -
                                  ${member.specialization.name} -
                                  ilvl ${member.equipped_item_level}
                                </li>
                              `).join('')}
                            </ul>
                          </div>
                        </div>
                      `).join('')}
                    </div>
                  `;

                  break; // Found a working dungeon, stop trying others
                }
              } catch (dungeonError) {
                console.log(`✗ Dungeon ${dungeonId} not available:`, dungeonError.message);
              }
            }

            if (!foundLeaderboard) {
              html += `
                <div style="margin: 20px; padding: 20px; background: rgba(255,165,0,0.2); border-radius: 8px;">
                  <h3>⚠️ No Leaderboard Data Found</h3>
                  <p>Could not find leaderboard data for any dungeon in period ${periodId}.</p>
                  <p>This could mean:</p>
                  <ul>
                    <li>The season is too new and data isn't available yet</li>
                    <li>The dungeon IDs have changed for this season</li>
                    <li>Check the console for detailed error messages</li>
                  </ul>
                  <p><strong>Season Details:</strong></p>
                  <pre style="color: #fff; overflow: auto; background: rgba(0,0,0,0.5); padding: 10px; border-radius: 4px;">${JSON.stringify(seasonDetails, null, 2)}</pre>
                </div>
              `;
            }
          }

          leaderboardContent.innerHTML = html;
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
