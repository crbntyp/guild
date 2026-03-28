// My Crafters Page — Cross-character profession overview
import PageInitializer from './utils/page-initializer.js';
import authService from './services/auth.js';
import accountService from './services/account-service.js';
import battlenetClient from './api/battlenet-client.js';
import config from './config.js';
import { getClassColor, getClassName } from './utils/wow-constants.js';
import { getClassIconUrl } from './utils/wow-icons.js';
import PageHeader from './components/page-header.js';

console.log('⚡ My Crafters Page initialized');

// Profession icons from Wowhead CDN
const PROFESSION_ICONS = {
  171: 'trade_alchemy', // Alchemy
  164: 'trade_blacksmithing', // Blacksmithing
  333: 'trade_engraving', // Enchanting
  202: 'trade_engineering', // Engineering
  773: 'inv_inscription_tradeskill01', // Inscription
  755: 'inv_misc_gem_01', // Jewelcrafting
  165: 'trade_leatherworking', // Leatherworking
  186: 'trade_mining', // Mining
  393: 'inv_misc_pelt_wolf_01', // Skinning
  197: 'trade_tailoring', // Tailoring
  182: 'spell_nature_naturetouchgrow', // Herbalism
  185: 'inv_misc_food_15', // Cooking
  356: 'trade_fishing', // Fishing
  794: 'archaeology_5_0_changkiboard' // Archaeology
};

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      window.addEventListener('auth-state-changed', () => window.location.reload());

      const container = document.getElementById('crafters-container');

      if (!authService.isAuthenticated()) {
        container.innerHTML = `
          <div class="auth-required-view">
            <h2>Authentication Required</h2>
            <p>Log in with your Battle.net account to view this page.</p>
            <button class="btn-login-auth" id="btn-login-crafters">
              <i class="las la-user"></i>
              Login with Battle.net
            </button>
          </div>
        `;
        document.getElementById('btn-login-crafters')?.addEventListener('click', () => authService.login());
        return;
      }

      // Show header + loading
      container.innerHTML = `
        ${PageHeader.render({
          className: 'crafters',
          title: 'Crafters',
          description: 'See which characters have the highest profession skills across your account.'
        })}
        <div id="crafters-content">
          <div class="loading-spinner">
            <i class="las la-circle-notch la-spin la-4x"></i>
            <p>Loading professions across your characters...</p>
          </div>
        </div>
      `;

      try {
        const characters = await accountService.getAccountCharacters();

        // Filter to max level characters
        const eligible = characters
          .filter(c => c.level >= 70)
          .sort((a, b) => b.level - a.level);

        // Fetch professions for each character (batched)
        const professionData = [];
        const batchSize = 5;

        for (let i = 0; i < eligible.length; i += batchSize) {
          const batch = eligible.slice(i, i + batchSize);

          const results = await Promise.all(batch.map(async (char) => {
            const realmSlug = char.realm?.slug || '';
            const name = char.name.toLowerCase();
            try {
              const data = await battlenetClient.request(
                `/profile/wow/character/${realmSlug}/${encodeURIComponent(name)}/professions`,
                { params: { namespace: config.api.namespace.profile } }
              );
              return {
                name: char.name,
                realm: char.realm?.name || realmSlug,
                realmSlug,
                classId: char.playable_class?.id,
                level: char.level,
                primaries: data.primaries || [],
                secondaries: data.secondaries || []
              };
            } catch (e) {
              return null;
            }
          }));

          professionData.push(...results.filter(r => r));
        }

        // Group by profession
        const professionMap = {};

        professionData.forEach(char => {
          [...char.primaries, ...char.secondaries].forEach(prof => {
            const profName = prof.profession?.name;
            const profId = prof.profession?.id;
            if (!profName) return;

            if (!professionMap[profName]) {
              professionMap[profName] = { id: profId, characters: [] };
            }

            // Expansion tier priority (newest first)
            const expansionOrder = ['Midnight', 'Khaz Algar', 'Dragon Isles', 'Shadowlands', 'Kul Tiran', 'Zandalari', 'Legion', 'Draenor', 'Pandaria', 'Cataclysm', 'Northrend', 'Outland', 'Classic'];
            const tiers = (prof.tiers || []).slice().sort((a, b) => {
              const nameA = a.tier?.name || '';
              const nameB = b.tier?.name || '';
              const idxA = expansionOrder.findIndex(e => nameA.includes(e));
              const idxB = expansionOrder.findIndex(e => nameB.includes(e));
              return (idxA === -1 ? 99 : idxA) - (idxB === -1 ? 99 : idxB);
            });
            const latestTier = tiers.length > 0 ? tiers[0] : null;

            professionMap[profName].characters.push({
              name: char.name,
              realm: char.realm,
              realmSlug: char.realmSlug,
              classId: char.classId,
              level: char.level,
              latestTier: latestTier ? {
                name: latestTier.tier?.name || '?',
                skill: latestTier.skill_points || 0,
                max: latestTier.max_skill_points || 0
              } : null,
              allTiers: tiers.map(t => ({  // Already reversed (newest first)
                name: t.tier?.name || '?',
                skill: t.skill_points || 0,
                max: t.max_skill_points || 0
              }))
            });
          });
        });

        // Sort characters within each profession by latest tier skill (descending)
        Object.values(professionMap).forEach(prof => {
          prof.characters.sort((a, b) => (b.latestTier?.skill || 0) - (a.latestTier?.skill || 0));
        });

        // Render
        const content = document.getElementById('crafters-content');

        if (Object.keys(professionMap).length === 0) {
          content.innerHTML = `
            <div class="no-raids">
              <p>No profession data found</p>
            </div>
          `;
          return;
        }

        // Split into primary and secondary
        const primaryIds = [171, 164, 333, 202, 773, 755, 165, 186, 393, 197, 182];
        const primaryProfs = Object.entries(professionMap).filter(([, v]) => primaryIds.includes(v.id));
        const secondaryProfs = Object.entries(professionMap).filter(([, v]) => !primaryIds.includes(v.id));

        const renderProfSection = (profs) => profs.map(([name, data]) => {
          const iconName = PROFESSION_ICONS[data.id] || 'inv_misc_questionmark';
          const iconUrl = `https://wow.zamimg.com/images/wow/icons/large/${iconName}.jpg`;

          return `
            <div class="crafter-profession">
              <div class="crafter-prof-header">
                <img src="${iconUrl}" class="crafter-prof-icon" />
                <h3>${name}</h3>
                <span class="crafter-prof-count">${data.characters.length} character${data.characters.length !== 1 ? 's' : ''}</span>
              </div>
              <div class="crafter-char-list">
                ${data.characters.map(c => {
                  const classColor = getClassColor(c.classId);
                  const classIconUrl = getClassIconUrl(c.classId);

                  const avatarUrl = `https://render.worldofwarcraft.com/eu/character/${c.realmSlug}/${c.name.toLowerCase()}-avatar.jpg`;

                  return `
                    <div class="crafter-char-row">
                      <div class="crafter-char-info">
                        <img src="${avatarUrl}" class="crafter-char-avatar" onerror="this.style.display='none'" />
                        ${classIconUrl ? `<img src="${classIconUrl}" class="crafter-class-icon" />` : ''}
                        <span class="crafter-char-name" style="color: ${classColor}">${c.name}</span>
                      </div>
                      <div class="crafter-tiers-list">
                        ${c.allTiers.map(t => {
                          const progress = Math.round((t.skill / t.max) * 100);
                          const maxed = t.skill >= t.max;
                          return `
                            <div class="crafter-tier-row ${maxed ? 'maxed' : ''}">
                              <span class="crafter-tier-name">${t.name}</span>
                              <div class="crafter-skill-bar">
                                <div class="crafter-skill-fill" style="width: ${progress}%"></div>
                              </div>
                              <span class="crafter-skill-text">${t.skill}/${t.max}</span>
                            </div>
                          `;
                        }).join('')}
                      </div>
                    </div>
                  `;
                }).join('')}
              </div>
            </div>
          `;
        }).join('');

        content.innerHTML = `
          <div class="crafters-grid">
            ${primaryProfs.length ? `<h2 class="home-section-title">Primary Professions</h2>${renderProfSection(primaryProfs)}` : ''}
            ${secondaryProfs.length ? `<h2 class="home-section-title" style="margin-top: 32px;">Secondary Professions</h2>${renderProfSection(secondaryProfs)}` : ''}
          </div>
        `;

      } catch (error) {
        console.error('Error loading professions:', error);
        document.getElementById('crafters-content').innerHTML = `
          <div class="no-raids">
            <p>Failed to load profession data</p>
          </div>
        `;
      }
    }
  });
});
