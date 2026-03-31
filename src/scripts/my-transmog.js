import PageInitializer from './utils/page-initializer.js';
import authService from './services/auth.js';
import accountService from './services/account-service.js';
import battlenetClient from './api/battlenet-client.js';
import config from './config.js';
import PageHeader from './components/page-header.js';
import CustomDropdown from './components/custom-dropdown.js';
import { getClassIconUrl } from './utils/wow-icons.js';
import { getClassColor } from './utils/wow-constants.js';

const EXPANSIONS = ['All Expansions', 'Midnight', 'The War Within', 'Dragonflight', 'Shadowlands', 'Battle for Azeroth', 'Legion', 'Warlords of Draenor', 'Mists of Pandaria', 'Cataclysm', 'Wrath of the Lich King', 'The Burning Crusade', 'Classic'];

const CLASSES = [
  { id: 1, name: 'Warrior' },
  { id: 2, name: 'Paladin' },
  { id: 3, name: 'Hunter' },
  { id: 4, name: 'Rogue' },
  { id: 5, name: 'Priest' },
  { id: 6, name: 'Death Knight' },
  { id: 7, name: 'Shaman' },
  { id: 8, name: 'Mage' },
  { id: 9, name: 'Warlock' },
  { id: 10, name: 'Monk' },
  { id: 11, name: 'Druid' },
  { id: 12, name: 'Demon Hunter' },
  { id: 13, name: 'Evoker' },
];

const CLASS_IDS = {};
CLASSES.forEach(c => { CLASS_IDS[c.name] = c.id; });

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init({
    requireAuth: false,
    onInit: async () => {
      const container = document.getElementById('transmog-container');

      if (!authService.isAuthenticated()) {
        container.innerHTML = `
          <div class="auth-required-view">
            <h2>Authentication Required</h2>
            <p>Log in with your Battle.net account to track your transmog collection.</p>
            <button class="btn-login-auth" id="btn-login-tmog">
              <i class="las la-user"></i>
              Login with Battle.net
            </button>
          </div>
        `;
        document.getElementById('btn-login-tmog')?.addEventListener('click', () => authService.login());
        return;
      }

      container.innerHTML = `
        ${PageHeader.render({
          className: 'transmog',
          title: 'Transmog Sets',
          description: 'Track your class tier sets. See what you own, what you\'re missing, and where to farm it.'
        })}
        <div id="transmog-content">
          <div class="tmog-loading">
            <i class="las la-circle-notch la-spin la-3x"></i>
            <p>Loading your transmog collection...</p>
            <p class="tmog-loading-sub">Fetching set data and comparing with your appearances</p>
          </div>
        </div>
      `;

      try {
        const [setsResponse, characters] = await Promise.all([
          fetch('data/transmog-sets.json').then(r => r.json()),
          accountService.getAccountCharacters()
        ]);

        const PVP_FILTER = ['gladiator', 'combatant', 'aspirant', 'warmonger'];
        const allSets = (setsResponse.sets || []).filter(s => {
          const l = s.name.toLowerCase();
          return !PVP_FILTER.some(k => l.includes(k));
        });

        // Fetch transmog collection from one character per armor type
        // The API only returns appearances for armor types the character can wear
        const ARMOR_CLASS_MAP = {
          'Cloth': [5, 8, 9],       // Priest, Mage, Warlock
          'Leather': [4, 10, 11, 12], // Rogue, Monk, Druid, DH
          'Mail': [3, 7, 13],       // Hunter, Shaman, Evoker
          'Plate': [1, 2, 6]        // Warrior, Paladin, DK
        };

        // Find one character per armor type (highest level)
        const charsByArmor = {};
        characters.sort((a, b) => b.level - a.level).forEach(c => {
          const classId = c.playable_class?.id;
          for (const [armor, classIds] of Object.entries(ARMOR_CLASS_MAP)) {
            if (classIds.includes(classId) && !charsByArmor[armor]) {
              charsByArmor[armor] = c;
            }
          }
        });

        // Fetch collection from each armor type character in parallel
        // Fill missing source data — if any piece in the set has a source, use that raid for pieces without
        const TIER_SLOTS = ['HEAD', 'SHOULDER', 'CHEST', 'HAND', 'LEGS'];
        allSets.forEach(set => {
          const knownInstances = new Set();
          set.pieces.forEach(p => { if (p.source?.instance) knownInstances.add(p.source.instance); });
          if (knownInstances.size > 0) {
            const raidName = [...knownInstances][0];
            set.pieces.forEach(p => {
              if (!p.source) {
                const isTierSlot = TIER_SLOTS.includes(p.slotType);
                p.source = { boss: isTierSlot ? 'Raid Token' : 'Zone Drop / World Drop / Crafted', instance: raidName };
              }
            });
          }
        });

        const collectedAppearances = new Set();
        const fetchPromises = Object.entries(charsByArmor).map(async ([armor, char]) => {
          try {
            const data = await battlenetClient.request(
              `/profile/wow/character/${char.realm?.slug}/${encodeURIComponent(char.name.toLowerCase())}/collections/transmogs`,
              { params: { namespace: config.api.namespace.profile } }
            );
            if (data?.slots) {
              data.slots.forEach(slot => {
                (slot.appearances || []).forEach(app => collectedAppearances.add(app.id));
              });
            }
            console.log(`Transmog: ${armor} from ${char.name} (${char.playable_class?.name})`);
          } catch (e) {
            console.warn(`Failed to fetch ${armor} collection from ${char.name}:`, e.message);
          }
        });

        await Promise.all(fetchPromises);
        console.log(`Transmog: ${collectedAppearances.size} total appearances from ${Object.keys(charsByArmor).length} characters`);

        // Deduplicate pieces per slot, enrich, and group by set name
        const DISPLAY_ORDER = ['LFR', 'Normal', 'Heroic', 'Mythic'];
        const nameCounts = {};
        allSets.forEach(s => { nameCounts[s.name] = (nameCounts[s.name] || 0) + 1; });

        const groupedByName = {};

        allSets.forEach(set => {
          // Deduplicate pieces per slot
          const seen = new Set();
          const pieces = set.pieces.filter(p => {
            if (seen.has(p.slotType)) return false;
            seen.add(p.slotType);
            return true;
          });

          const collected = pieces.filter(p => collectedAppearances.has(p.appearanceId));
          const missing = pieces.filter(p => !collectedAppearances.has(p.appearanceId));
          const complete = missing.length === 0;
          const progress = pieces.length > 0 ? Math.round((collected.length / pieces.length) * 100) : 0;

          const enriched = { ...set, pieces, collected, missing, complete, progress, difficulty: set.difficulty || null };

          // Group by base name + classes + expansion for tab cards
          const groupKey = `${set.name}|${(set.classes || []).join(',')}|${set.expansion}`;
          if (!groupedByName[groupKey]) {
            groupedByName[groupKey] = {
              name: set.name,
              classes: set.classes,
              expansion: set.expansion,
              armorType: set.armorType,
              variants: []
            };
          }
          groupedByName[groupKey].variants.push(enriched);
        });

        // Sort variants by set ID (deterministic) and assign per-expansion difficulty labels
        const setGroups = Object.values(groupedByName);
        setGroups.forEach(g => {
          if (g.variants.length > 1) {
            // Assign fallback labels for any without difficulty from generator
            g.variants.forEach((v, i) => {
              if (!v.difficulty) v.difficulty = `Variant ${i + 1}`;
            });
            // Sort tabs: LFR first, then Normal, Heroic, Mythic
            g.variants.sort((a, b) => {
              const ai = DISPLAY_ORDER.indexOf(a.difficulty);
              const bi = DISPLAY_ORDER.indexOf(b.difficulty);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            });
          }
        });

        // Determine which classes the user has characters for
        const userClassIds = new Set();
        characters.forEach(c => {
          if (c.playable_class?.id) userClassIds.add(c.playable_class.id);
        });

        // State — default to user's first class, or Warrior
        let activeClass = 'All Classes';
        let activeExpansion = 'All Expansions';
        let showCompletedOnly = false;

        const content = document.getElementById('transmog-content');

        function renderTransmog() {
          let filtered = activeClass === 'All Classes'
            ? setGroups
            : setGroups.filter(g => g.classes && g.classes.includes(activeClass));
          if (activeExpansion !== 'All Expansions') {
            filtered = filtered.filter(g => g.expansion === activeExpansion);
          }
          if (showCompletedOnly) {
            filtered = filtered.filter(g => g.variants.some(v => v.complete));
          }

          // Sort by expansion first, then by progress
          const EXP_ORDER = ['Midnight', 'The War Within', 'Dragonflight', 'Shadowlands', 'Battle for Azeroth', 'Legion', 'Warlords of Draenor', 'Mists of Pandaria', 'Cataclysm', 'Wrath of the Lich King', 'The Burning Crusade', 'Classic', 'Unknown'];
          filtered.sort((a, b) => {
            const ea = EXP_ORDER.indexOf(a.expansion);
            const eb = EXP_ORDER.indexOf(b.expansion);
            if (ea !== eb) return ea - eb;
            const aAllComplete = a.variants.every(v => v.complete);
            const bAllComplete = b.variants.every(v => v.complete);
            if (aAllComplete !== bAllComplete) return aAllComplete ? 1 : -1;
            const aBest = Math.max(...a.variants.map(v => v.progress));
            const bBest = Math.max(...b.variants.map(v => v.progress));
            return bBest - aBest;
          });

          const totalSets = filtered.length;
          const completeSets = filtered.filter(g => g.variants.every(v => v.complete)).length;
          const totalPieces = filtered.reduce((sum, g) => sum + Math.max(...g.variants.map(v => v.pieces.length)), 0);
          const collectedPieces = filtered.reduce((sum, g) => sum + Math.max(...g.variants.map(v => v.collected.length)), 0);
          const overallProgress = totalPieces > 0 ? Math.round((collectedPieces / totalPieces) * 100) : 0;

          content.innerHTML = `
            <div class="tmog-layout">
              <div class="tmog-sidebar">
                <div class="tmog-sidebar-inner">
                  <div class="tmog-sidebar-section">
                    <div class="tmog-sidebar-label">Class</div>
                    <div id="tmog-class-dropdown"></div>
                  </div>
                  <div class="tmog-sidebar-section">
                    <div class="tmog-sidebar-label">Expansion</div>
                    <div id="tmog-expansion-dropdown"></div>
                  </div>
                  <div class="tmog-sidebar-section">
                    <label class="tmog-toggle">
                      <input type="checkbox" id="tmog-show-complete" ${showCompletedOnly ? 'checked' : ''} />
                      <span>Completed only</span>
                    </label>
                  </div>
                  <div class="tmog-sidebar-stats">
                    <div class="tmog-stat">
                      <span class="tmog-stat-value">${completeSets}</span>
                      <span class="tmog-stat-label">Sets Complete</span>
                    </div>
                    <div class="tmog-stat">
                      <span class="tmog-stat-value">${collectedPieces}</span>
                      <span class="tmog-stat-label">Pieces Collected</span>
                    </div>
                    <div class="tmog-stat">
                      <span class="tmog-stat-value">${overallProgress}%</span>
                      <span class="tmog-stat-label">Overall</span>
                    </div>
                  </div>
                </div>
              </div>

              <div class="tmog-main">
                <div class="tmog-grid">
                  ${filtered.length === 0 ? `
                    <div class="tmog-empty">No incomplete sets found for ${activeClass}</div>
                  ` : filtered.map((group, gi) => {
                    const firstVariant = group.variants[0];
                    const hasTabs = group.variants.length > 1;
                    const setIcon = firstVariant.pieces[0]?.icon || '';

                    return `
                      <div class="tmog-card" data-group="${gi}">
                        <div class="tmog-card-header">
                          <div class="tmog-card-meta-row">
                            ${setIcon ? `<img src="${setIcon}" class="tmog-set-icon" />` : ''}
                            ${(activeClass === 'All Classes' ? group.classes : [activeClass]).map(cn => {
                              const cid = CLASS_IDS[cn] || 0;
                              const cc = getClassColor(cid);
                              return `<span class="tmog-class-pill" style="color: ${cc}; background: ${cc}20; border-color: ${cc}40">${cn}</span>`;
                            }).join('')}
                            <span class="tmog-expansion-tag">${group.expansion}</span>
                          </div>
                          <h3 class="tmog-set-name">${group.name}</h3>
                          ${hasTabs ? `
                            <div class="tmog-diff-tabs">
                              ${group.variants.map((v, vi) => `
                                <button class="tmog-diff-tab${vi === 0 ? ' active' : ''}${v.complete ? ' tab-complete' : ''}" data-group="${gi}" data-variant="${vi}">
                                  ${v.difficulty || 'Default'}
                                  <span class="tmog-tab-progress">${v.collected.length}/${v.pieces.length}</span>
                                </button>
                              `).join('')}
                            </div>
                          ` : `
                            <div class="tmog-progress-info">
                              <span class="tmog-progress-text">${firstVariant.collected.length}/${firstVariant.pieces.length}</span>
                            </div>
                          `}
                          <div class="tmog-progress-bar">
                            <div class="tmog-progress-fill${firstVariant.complete ? ' complete' : ''}" style="width: ${firstVariant.progress}%" data-group-bar="${gi}"></div>
                          </div>
                        </div>
                        ${group.variants.map((variant, vi) => `
                          <div class="tmog-pieces${vi === 0 ? ' active' : ''}" data-group-pieces="${gi}" data-variant="${vi}">
                            ${variant.pieces.map(piece => {
                              const owned = collectedAppearances.has(piece.appearanceId);
                              return `
                                <div class="tmog-piece ${owned ? 'owned' : 'missing'}" data-item-id="${piece.itemId}" data-item-name="${piece.itemName}" data-slot="${piece.slot}" data-icon="${piece.icon || ''}" data-boss="${piece.source?.boss || ''}" data-instance="${piece.source?.instance || ''}" data-owned="${owned}">
                                  ${piece.icon ? `<a href="https://www.wowhead.com/item=${piece.itemId}" data-wh-icon-size="small" onclick="event.preventDefault()" class="tmog-piece-icon-link"><img src="${piece.icon}" class="tmog-piece-icon" /></a>` : `<span class="tmog-piece-icon-placeholder"></span>`}
                                  <span class="tmog-piece-slot">${piece.slot}</span>
                                  <span class="tmog-piece-name">${piece.itemName}</span>
                                  ${owned ? '<i class="las la-check tmog-piece-check"></i>' : ''}
                                </div>
                              `;
                            }).join('')}
                          </div>
                        `).join('')}
                      </div>
                    `;
                  }).join('')}
                </div>
              </div>
            </div>
          `;

          // Init dropdowns
          const classDropdown = new CustomDropdown({
            id: 'tmog-class-dd',
            label: 'Class',
            options: [
              { value: 'All Classes', label: 'All Classes' },
              ...CLASSES.map(c => ({
                value: c.name,
                label: userClassIds.has(c.id) ? c.name : `${c.name} ✗`,
                icon: getClassIconUrl(c.id),
                disabled: !userClassIds.has(c.id)
              }))
            ],
            selectedValue: activeClass,
            onChange: (val) => { activeClass = val; renderTransmog(); }
          });

          const expDropdown = new CustomDropdown({
            id: 'tmog-exp-dd',
            label: 'Expansion',
            options: EXPANSIONS.filter(exp => {
              if (exp === 'All Expansions') return true;
              if (activeClass === 'All Classes') return setGroups.some(g => g.expansion === exp);
              return setGroups.some(g => g.expansion === exp && g.classes?.includes(activeClass));
            }).map(exp => ({ value: exp, label: exp })),
            selectedValue: activeExpansion,
            onChange: (val) => { activeExpansion = val; renderTransmog(); }
          });

          classDropdown.attachToElement(document.getElementById('tmog-class-dropdown'));
          expDropdown.attachToElement(document.getElementById('tmog-expansion-dropdown'));

          // Piece click → modal
          content.querySelectorAll('.tmog-piece').forEach(el => {
            el.addEventListener('click', () => {
              const itemId = el.dataset.itemId;
              const itemName = el.dataset.itemName;
              const slot = el.dataset.slot;
              const icon = el.dataset.icon;
              const boss = el.dataset.boss;
              const instance = el.dataset.instance;
              const owned = el.dataset.owned === 'true';

              // Remove existing modal
              document.querySelector('.tmog-modal-overlay')?.remove();

              const wowheadUrl = `https://www.wowhead.com/item=${itemId}`;
              const modal = document.createElement('div');
              modal.className = 'tmog-modal-overlay';
              modal.innerHTML = `
                <div class="tmog-modal">
                  <button class="tmog-modal-close"><i class="las la-times"></i></button>
                  <div class="tmog-modal-content">
                    <a href="${wowheadUrl}" onclick="event.preventDefault()" class="tmog-modal-icon-link">
                      <img src="${icon}" class="tmog-modal-icon" />
                    </a>
                    <div class="tmog-modal-info">
                      <span class="tmog-modal-slot">${slot}</span>
                      <h3 class="tmog-modal-name">${itemName}</h3>
                      <span class="tmog-modal-status ${owned ? 'owned' : 'missing'}">${owned ? 'Collected' : 'Missing'}</span>
                    </div>
                  </div>
                  ${boss ? `
                    <div class="tmog-modal-source">
                      <div class="tmog-modal-source-row">
                        <i class="las la-skull"></i>
                        <span>${boss}</span>
                      </div>
                      <div class="tmog-modal-source-row">
                        <i class="las la-dungeon"></i>
                        <span>${instance}</span>
                      </div>
                    </div>
                  ` : ''}
                  <div class="tmog-modal-actions">
                    ${!owned ? `<button class="tmog-modal-todo" id="tmog-add-todo"><i class="las la-plus"></i> Add to Todos</button>` : ''}
                    <a href="${wowheadUrl}" target="_blank" rel="noopener" class="tmog-modal-wowhead">
                      Wowhead <i class="las la-external-link-alt"></i>
                    </a>
                  </div>
                </div>
              `;

              document.body.appendChild(modal);

              // Add to todo handler
              const todoBtn = modal.querySelector('#tmog-add-todo');
              if (todoBtn) {
                todoBtn.addEventListener('click', async () => {
                  todoBtn.disabled = true;
                  todoBtn.innerHTML = '<i class="las la-circle-notch la-spin"></i> Adding...';
                  try {
                    const apiBase = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
                      ? 'https://crbntyp.com/gld/api' : '/gld/api';
                    const token = authService.getAccessToken();
                    const desc = boss ? `Drops from ${boss} in ${instance}` : `Missing ${slot} piece`;
                    await fetch(`${apiBase}/todos.php`, {
                      method: 'POST',
                      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
                      body: JSON.stringify({ action: 'add', title: `Farm: ${itemName}`, description: desc, url: wowheadUrl, image: icon })
                    });
                    todoBtn.innerHTML = '<i class="las la-check"></i> Added!';
                    todoBtn.classList.add('added');
                  } catch (e) {
                    todoBtn.innerHTML = '<i class="las la-exclamation"></i> Failed';
                    todoBtn.disabled = false;
                  }
                });
              }

              // Close handlers
              modal.querySelector('.tmog-modal-close').addEventListener('click', () => modal.remove());
              modal.addEventListener('click', (e) => { if (e.target === modal) modal.remove(); });
              document.addEventListener('keydown', function handler(e) {
                if (e.key === 'Escape') { modal.remove(); document.removeEventListener('keydown', handler); }
              });
            });
          });

          // Difficulty tab handlers
          content.querySelectorAll('.tmog-diff-tab').forEach(tab => {
            tab.addEventListener('click', () => {
              const gi = tab.dataset.group;
              const vi = tab.dataset.variant;

              // Toggle active tab
              content.querySelectorAll(`.tmog-diff-tab[data-group="${gi}"]`).forEach(t => t.classList.remove('active'));
              tab.classList.add('active');

              // Toggle active pieces
              content.querySelectorAll(`.tmog-pieces[data-group-pieces="${gi}"]`).forEach(p => p.classList.remove('active'));
              content.querySelector(`.tmog-pieces[data-group-pieces="${gi}"][data-variant="${vi}"]`)?.classList.add('active');

              // Update progress bar
              const variant = filtered[gi]?.variants[vi];
              if (variant) {
                const bar = content.querySelector(`[data-group-bar="${gi}"]`);
                if (bar) {
                  bar.style.width = variant.progress + '%';
                  bar.classList.toggle('complete', variant.complete);
                }
              }
            });
          });

          document.getElementById('tmog-show-complete')?.addEventListener('change', (e) => {
            showCompletedOnly = e.target.checked;
            renderTransmog();
          });
        }

        renderTransmog();

      } catch (error) {
        console.error('Error loading transmog data:', error);
        document.getElementById('transmog-content').innerHTML = `
          <div class="tmog-empty">
            <p>Failed to load transmog data</p>
            <p style="font-size:12px;color:rgba(255,255,255,0.3)">${error.message || ''}</p>
          </div>
        `;
      }
    }
  });
});
