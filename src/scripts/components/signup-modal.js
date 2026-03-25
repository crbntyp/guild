import accountService from '../services/account-service.js';
import characterService from '../services/character-service.js';
import { getClassColor, getClassName, getSpecRole, CLASS_POSSIBLE_ROLES } from '../utils/wow-constants.js';
import { getClassIconUrl } from '../utils/wow-icons.js';

class SignupModal {
  constructor(authService, onSubmit) {
    this.authService = authService;
    this.onSubmit = onSubmit;
    this.modal = null;
    this.currentRaid = null;
    this.selectedCharacter = null;
    this.characterProfile = null;
  }

  render() {
    return `
      <div class="signup-modal-overlay" id="signup-modal-overlay" style="display: none;">
        <div class="signup-modal">
          <div class="signup-modal-header">
            <h3>Sign Up for Raid</h3>
            <button class="signup-modal-close" id="signup-modal-close"><i class="las la-times"></i></button>
          </div>
          <div class="signup-modal-body" id="signup-modal-body">
            <!-- Dynamic content -->
          </div>
        </div>
      </div>
    `;
  }

  attachListeners() {
    const overlay = document.getElementById('signup-modal-overlay');
    const closeBtn = document.getElementById('signup-modal-close');

    if (closeBtn) {
      closeBtn.addEventListener('click', () => this.close());
    }

    if (overlay) {
      overlay.addEventListener('click', (e) => {
        if (e.target === overlay) this.close();
      });
    }
  }

  async open(raid) {
    this.currentRaid = raid;
    this.selectedCharacter = null;
    this.characterProfile = null;

    const overlay = document.getElementById('signup-modal-overlay');
    const body = document.getElementById('signup-modal-body');

    if (!overlay || !body) return;

    overlay.style.display = 'flex';

    // Show loading
    body.innerHTML = `
      <div class="signup-loading">
        <i class="las la-circle-notch la-spin la-3x"></i>
        <p>Loading your characters...</p>
      </div>
    `;

    try {
      const characters = await accountService.getAccountCharacters();

      // Filter to max level characters, sort by level desc then ilvl
      const eligible = characters
        .filter(c => c.level >= 70)
        .sort((a, b) => b.level - a.level);

      if (eligible.length === 0) {
        body.innerHTML = `
          <div class="signup-empty">
            <p>No eligible characters found (level 70+)</p>
          </div>
        `;
        return;
      }

      this.renderCharacterSelect(body, eligible);
    } catch (error) {
      console.error('Failed to load characters:', error);
      body.innerHTML = `
        <div class="signup-empty">
          <p>Failed to load characters</p>
        </div>
      `;
    }
  }

  renderCharacterSelect(container, characters) {
    const raidTitle = this.currentRaid?.title || 'Raid';

    container.innerHTML = `
      <div class="signup-raid-info">
        <strong>${raidTitle}</strong>
        <span class="signup-raid-difficulty ${this.currentRaid?.difficulty || 'heroic'}">${this.currentRaid?.difficulty || 'heroic'}</span>
      </div>
      <p class="signup-step-label">Select a character:</p>
      <div class="signup-character-grid">
        ${characters.map(c => {
          const classColor = getClassColor(c.playable_class?.id);
          const classIconUrl = getClassIconUrl(c.playable_class?.id);
          const realmName = c.realm?.name || c.realm?.slug || '';
          return `
            <div class="signup-character-card" data-name="${c.name}" data-realm="${c.realm?.slug || ''}" data-class-id="${c.playable_class?.id || 0}" data-level="${c.level}">
              ${classIconUrl ? `<img src="${classIconUrl}" alt="" class="signup-char-icon" />` : ''}
              <div class="signup-char-info">
                <span class="signup-char-name" style="color: ${classColor}">${c.name}</span>
                <span class="signup-char-realm">${realmName} - ${c.level}</span>
              </div>
            </div>
          `;
        }).join('')}
      </div>
    `;

    // Attach character click handlers
    container.querySelectorAll('.signup-character-card').forEach(card => {
      card.addEventListener('click', () => this.selectCharacter(card, container));
    });
  }

  async selectCharacter(card, container) {
    const name = card.dataset.name;
    const realm = card.dataset.realm;
    const classId = parseInt(card.dataset.classId);
    const level = parseInt(card.dataset.level);

    // Highlight selected
    container.querySelectorAll('.signup-character-card').forEach(c => c.classList.remove('selected'));
    card.classList.add('selected');

    this.selectedCharacter = { name, realm, classId, level };

    // Fetch profile for spec and ilvl
    let spec = null;
    let ilvl = 0;

    try {
      const profile = await characterService.fetchCharacterProfile(realm, name);
      this.characterProfile = profile;
      spec = profile?.active_spec?.name || null;
      ilvl = profile?.equipped_item_level || profile?.average_item_level || 0;
    } catch (error) {
      // Profile fetch failed, continue without spec/ilvl
    }

    const detectedRole = spec ? getSpecRole(spec) : 'dps';
    const possibleRoles = CLASS_POSSIBLE_ROLES[classId] || ['dps'];

    // Show role selection and confirm
    const existingConfirm = container.querySelector('.signup-confirm-section');
    if (existingConfirm) existingConfirm.remove();

    const confirmHTML = `
      <div class="signup-confirm-section">
        <div class="signup-selected-info">
          <span style="color: ${getClassColor(classId)}">${name}</span>
          ${spec ? `<span class="signup-spec">${spec}</span>` : ''}
          ${ilvl ? `<span class="signup-ilvl">${ilvl} ilvl</span>` : ''}
        </div>

        <div class="signup-field">
          <label>Role:</label>
          <div class="signup-role-buttons">
            ${possibleRoles.map(role => `
              <button class="signup-role-btn ${role === detectedRole ? 'active' : ''}" data-role="${role}">
                <i class="las ${role === 'tank' ? 'la-shield-alt' : role === 'healer' ? 'la-plus-circle' : 'la-crosshairs'}"></i>
                ${role.charAt(0).toUpperCase() + role.slice(1)}
              </button>
            `).join('')}
          </div>
        </div>

        <div class="signup-field">
          <label>Status:</label>
          <div class="signup-role-buttons">
            <button class="signup-status-btn active" data-status="confirmed">Confirmed</button>
            <button class="signup-status-btn" data-status="tentative">Tentative</button>
          </div>
        </div>

        <div class="signup-field">
          <label>Note (optional):</label>
          <input type="text" class="signup-note-input" placeholder="e.g. might be 5 min late" />
        </div>

        <button class="btn-signup-confirm">Sign Up</button>
      </div>
    `;

    container.insertAdjacentHTML('beforeend', confirmHTML);

    // Role button handlers
    container.querySelectorAll('.signup-role-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.signup-role-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Status button handlers
    container.querySelectorAll('.signup-status-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        container.querySelectorAll('.signup-status-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
      });
    });

    // Confirm handler
    container.querySelector('.btn-signup-confirm').addEventListener('click', () => {
      const selectedRole = container.querySelector('.signup-role-btn.active')?.dataset.role || 'dps';
      const selectedStatus = container.querySelector('.signup-status-btn.active')?.dataset.status || 'confirmed';
      const note = container.querySelector('.signup-note-input')?.value || '';

      if (this.onSubmit) {
        this.onSubmit({
          raid_id: this.currentRaid.id,
          character_name: name,
          character_realm: realm,
          character_class_id: classId,
          character_spec: spec,
          character_level: level,
          character_ilvl: ilvl,
          role: selectedRole,
          status: selectedStatus,
          note: note || null
        });
      }
    });

    // Scroll to confirm section
    container.querySelector('.signup-confirm-section').scrollIntoView({ behavior: 'smooth' });
  }

  close() {
    const overlay = document.getElementById('signup-modal-overlay');
    if (overlay) overlay.style.display = 'none';
    this.currentRaid = null;
    this.selectedCharacter = null;
    this.characterProfile = null;
  }
}

export default SignupModal;
