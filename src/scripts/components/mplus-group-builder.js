import { getClassColor, getClassName } from '../utils/wow-constants.js';
import { getClassIconUrl } from '../utils/wow-icons.js';
import { generateTeamName } from '../utils/team-name-generator.js';
import { addVoidCinders } from '../utils/void-cinders.js';
import mplusService from '../services/mplus-service.js';

class MplusGroupBuilder {
  constructor() {
    this.session = null;
    this.signups = [];
    this.groups = [];
    this.unassigned = [];
    this.draggedSignupId = null;
    this.onClose = null;
  }

  async open(session, onClose) {
    this.session = session;
    this.signups = [...(session.signups || [])];
    this.onClose = onClose;
    this.groups = [];
    this.unassigned = [...this.signups];

    // Load existing groups
    try {
      const savedGroups = await mplusService.getGroups(session.id);
      if (savedGroups.length > 0) {
        this.groups = savedGroups.map(g => ({
          team_name: g.team_name,
          members: g.members.map(m => {
            const signup = this.signups.find(s => s.id === m.signup_id);
            return signup || null;
          }).filter(Boolean)
        }));
        // Remove assigned from unassigned
        const assignedIds = new Set(this.groups.flatMap(g => g.members.map(m => m.id)));
        this.unassigned = this.signups.filter(s => !assignedIds.has(s.id));
      }
    } catch (e) {}

    this.render();
    this.attachListeners();
  }

  render() {
    // Remove existing overlay
    document.querySelector('.mplus-builder-overlay')?.remove();

    const overlay = document.createElement('div');
    overlay.className = 'mplus-builder-overlay active';
    overlay.innerHTML = `
      <div class="mplus-builder">
        <div class="mplus-builder-header">
          <h2>${this.session.title} — Group Builder</h2>
          <div class="mplus-builder-actions">
            <button class="mplus-builder-btn" id="mplus-auto-assign"><i class="las la-magic"></i> Auto-Assign</button>
            <button class="mplus-builder-btn" id="mplus-add-group"><i class="las la-plus"></i> Add Group</button>
            <button class="mplus-builder-btn" id="mplus-save-groups"><i class="las la-save"></i> Save</button>
            <button class="mplus-builder-btn mplus-btn-danger" id="mplus-clear-groups"><i class="las la-undo"></i> Clear</button>
            <button class="mplus-builder-close" id="mplus-builder-close"><i class="las la-times"></i></button>
          </div>
        </div>
        <div class="mplus-builder-body">
          <div class="mplus-builder-pool" id="mplus-pool">
            <h3>Signup Pool <span class="mplus-pool-count">(${this.unassigned.length})</span></h3>
            ${this.renderPool()}
          </div>
          <div class="mplus-builder-groups" id="mplus-groups-area">
            ${this.groups.length > 0 ? this.groups.map((g, i) => this.renderGroup(g, i)).join('') : '<div class="mplus-groups-empty">Click "Add Group" or "Auto-Assign" to start building groups</div>'}
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    // Add void cinders
    addVoidCinders(overlay.querySelector('.mplus-builder'));
  }

  renderPool() {
    const tanks = this.unassigned.filter(s => s.role === 'tank');
    const healers = this.unassigned.filter(s => s.role === 'healer');
    const dps = this.unassigned.filter(s => s.role === 'dps');

    const renderCards = (signups) => signups
      .sort((a, b) => b.character_ilvl - a.character_ilvl)
      .map(s => this.renderSignupCard(s)).join('');

    return `
      ${tanks.length ? `<div class="mplus-pool-role"><span class="mplus-pool-role-label tank"><i class="las la-shield-alt"></i> Tanks (${tanks.length})</span>${renderCards(tanks)}</div>` : ''}
      ${healers.length ? `<div class="mplus-pool-role"><span class="mplus-pool-role-label healer"><i class="las la-plus-circle"></i> Healers (${healers.length})</span>${renderCards(healers)}</div>` : ''}
      ${dps.length ? `<div class="mplus-pool-role"><span class="mplus-pool-role-label dps"><i class="las la-crosshairs"></i> DPS (${dps.length})</span>${renderCards(dps)}</div>` : ''}
      ${this.unassigned.length === 0 ? '<div class="mplus-pool-empty">All players assigned</div>' : ''}
    `;
  }

  renderSignupCard(signup) {
    const classColor = getClassColor(signup.character_class_id);
    const classIconUrl = getClassIconUrl(signup.character_class_id);
    const tentative = signup.status === 'tentative' ? ' tentative' : '';
    return `
      <div class="mplus-pool-card${tentative}" draggable="true" data-signup-id="${signup.id}" data-role="${signup.role}">
        ${classIconUrl ? `<img src="${classIconUrl}" alt="" class="mplus-pool-card-icon" />` : ''}
        <span class="mplus-pool-card-name" style="color: ${classColor}">${signup.character_name}</span>
        <span class="mplus-pool-card-stats">(${signup.mplus_rating || 0}/${signup.character_ilvl})</span>
      </div>
    `;
  }

  renderGroup(group, index) {
    const tankSlots = group.members.filter(m => m.role === 'tank');
    const healerSlots = group.members.filter(m => m.role === 'healer');
    const dpsSlots = group.members.filter(m => m.role === 'dps');

    const renderSlot = (member, role) => {
      if (member) {
        const classColor = getClassColor(member.character_class_id);
        const classIconUrl = getClassIconUrl(member.character_class_id);
        return `
          <div class="mplus-group-member filled" draggable="true" data-signup-id="${member.id}" data-role="${member.role}" data-group-index="${index}">
            ${classIconUrl ? `<img src="${classIconUrl}" alt="" class="mplus-pool-card-icon" />` : ''}
            <span class="mplus-pool-card-name" style="color: ${classColor}">${member.character_name}</span>
            <span class="mplus-pool-card-stats">(${member.mplus_rating || 0}/${member.character_ilvl})</span>
            <button class="mplus-remove-member" data-signup-id="${member.id}" data-group-index="${index}"><i class="las la-times"></i></button>
          </div>
        `;
      }
      return `<div class="mplus-group-slot empty" data-role="${role}" data-group-index="${index}"><i class="las ${role === 'tank' ? 'la-shield-alt' : role === 'healer' ? 'la-plus-circle' : 'la-crosshairs'}"></i> ${role}</div>`;
    };

    const avgIlvl = group.members.length > 0 ? Math.round(group.members.reduce((sum, m) => sum + m.character_ilvl, 0) / group.members.length) : 0;

    return `
      <div class="mplus-group" data-group-index="${index}">
        <div class="mplus-group-header">
          <span class="mplus-group-name" contenteditable="true" data-group-index="${index}">${group.team_name}</span>
          <button class="mplus-reroll-name" data-group-index="${index}" title="Re-roll name"><i class="las la-dice"></i></button>
          ${avgIlvl ? `<span class="mplus-group-ilvl">${avgIlvl} ilvl</span>` : ''}
          <span class="mplus-group-count">${group.members.length}/5</span>
          <button class="mplus-remove-group" data-group-index="${index}" title="Remove group"><i class="las la-trash-alt"></i></button>
        </div>
        <div class="mplus-group-slots">
          ${renderSlot(tankSlots[0] || null, 'tank')}
          ${renderSlot(healerSlots[0] || null, 'healer')}
          ${renderSlot(dpsSlots[0] || null, 'dps')}
          ${renderSlot(dpsSlots[1] || null, 'dps')}
          ${renderSlot(dpsSlots[2] || null, 'dps')}
        </div>
      </div>
    `;
  }

  refreshUI() {
    const pool = document.getElementById('mplus-pool');
    const groupsArea = document.getElementById('mplus-groups-area');
    if (pool) {
      pool.innerHTML = `<h3>Signup Pool <span class="mplus-pool-count">(${this.unassigned.length})</span></h3>${this.renderPool()}`;
    }
    if (groupsArea) {
      groupsArea.innerHTML = this.groups.length > 0
        ? this.groups.map((g, i) => this.renderGroup(g, i)).join('')
        : '<div class="mplus-groups-empty">Click "Add Group" or "Auto-Assign" to start building groups</div>';
    }
    this.attachDragListeners();
  }

  attachListeners() {
    const overlay = document.querySelector('.mplus-builder-overlay');
    if (!overlay) return;

    document.getElementById('mplus-builder-close')?.addEventListener('click', () => this.close());
    document.getElementById('mplus-auto-assign')?.addEventListener('click', () => this.autoAssign());
    document.getElementById('mplus-add-group')?.addEventListener('click', () => this.addGroup());
    document.getElementById('mplus-save-groups')?.addEventListener('click', () => this.saveGroups());
    document.getElementById('mplus-clear-groups')?.addEventListener('click', () => this.clearGroups());

    // No click-outside-to-close — use close button

    document.addEventListener('keydown', this._escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    });

    this.attachDragListeners();
  }

  attachDragListeners() {
    const overlay = document.querySelector('.mplus-builder-overlay');
    if (!overlay) return;

    // Draggable cards (pool + group members)
    overlay.querySelectorAll('[draggable="true"]').forEach(card => {
      card.addEventListener('dragstart', (e) => {
        this.draggedSignupId = parseInt(e.currentTarget.dataset.signupId);
        e.currentTarget.classList.add('dragging');
        e.dataTransfer.effectAllowed = 'move';
      });
      card.addEventListener('dragend', (e) => {
        e.currentTarget.classList.remove('dragging');
        this.draggedSignupId = null;
        overlay.querySelectorAll('.drag-over').forEach(el => el.classList.remove('drag-over'));
      });
    });

    // Drop targets (empty slots)
    overlay.querySelectorAll('.mplus-group-slot.empty').forEach(slot => {
      slot.addEventListener('dragover', (e) => {
        e.preventDefault();
        const draggedSignup = this.signups.find(s => s.id === this.draggedSignupId);
        if (draggedSignup && draggedSignup.role === slot.dataset.role) {
          slot.classList.add('drag-over');
          e.dataTransfer.dropEffect = 'move';
        }
      });
      slot.addEventListener('dragleave', (e) => {
        slot.classList.remove('drag-over');
      });
      slot.addEventListener('drop', (e) => {
        e.preventDefault();
        slot.classList.remove('drag-over');
        const signupId = this.draggedSignupId;
        const groupIndex = parseInt(slot.dataset.groupIndex);
        const role = slot.dataset.role;
        this.assignToGroup(signupId, groupIndex, role);
      });
    });

    // Pool drop target (return to pool)
    const pool = document.getElementById('mplus-pool');
    if (pool) {
      pool.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
      });
      pool.addEventListener('drop', (e) => {
        e.preventDefault();
        if (this.draggedSignupId) {
          this.removeFromGroup(this.draggedSignupId);
        }
      });
    }

    // Remove buttons
    overlay.querySelectorAll('.mplus-remove-member').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const signupId = parseInt(e.currentTarget.dataset.signupId);
        this.removeFromGroup(signupId);
      });
    });

    // Remove group buttons
    overlay.querySelectorAll('.mplus-remove-group').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const groupIndex = parseInt(e.currentTarget.dataset.groupIndex);
        this.removeGroup(groupIndex);
      });
    });

    // Re-roll name buttons
    overlay.querySelectorAll('.mplus-reroll-name').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const groupIndex = parseInt(e.currentTarget.dataset.groupIndex);
        const existingNames = this.groups.map(g => g.team_name);
        this.groups[groupIndex].team_name = generateTeamName(existingNames);
        this.refreshUI();
      });
    });

    // Editable team names
    overlay.querySelectorAll('.mplus-group-name[contenteditable]').forEach(el => {
      el.addEventListener('blur', () => {
        const groupIndex = parseInt(el.dataset.groupIndex);
        const newName = el.textContent.trim();
        if (newName && this.groups[groupIndex]) {
          this.groups[groupIndex].team_name = newName;
        }
      });
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') { e.preventDefault(); el.blur(); }
      });
    });
  }

  assignToGroup(signupId, groupIndex, role) {
    const signup = this.signups.find(s => s.id === signupId);
    if (!signup || signup.role !== role) return;

    // Remove from current group if in one
    this.groups.forEach(g => {
      g.members = g.members.filter(m => m.id !== signupId);
    });

    // Remove from unassigned
    this.unassigned = this.unassigned.filter(s => s.id !== signupId);

    // Add to target group
    if (this.groups[groupIndex]) {
      this.groups[groupIndex].members.push(signup);
    }

    this.refreshUI();
  }

  removeFromGroup(signupId) {
    const signup = this.signups.find(s => s.id === signupId);
    if (!signup) return;

    this.groups.forEach(g => {
      g.members = g.members.filter(m => m.id !== signupId);
    });

    if (!this.unassigned.find(s => s.id === signupId)) {
      this.unassigned.push(signup);
    }

    this.refreshUI();
  }

  addGroup() {
    const existingNames = this.groups.map(g => g.team_name);
    this.groups.push({
      team_name: generateTeamName(existingNames),
      members: []
    });
    this.refreshUI();
  }

  removeGroup(groupIndex) {
    const group = this.groups[groupIndex];
    if (!group) return;

    // Return members to pool
    group.members.forEach(m => {
      if (!this.unassigned.find(s => s.id === m.id)) {
        this.unassigned.push(m);
      }
    });

    this.groups.splice(groupIndex, 1);
    this.refreshUI();
  }

  autoAssign() {
    // Return everyone to pool first
    this.unassigned = [...this.signups];
    this.groups = [];

    const totalPlayers = this.unassigned.length;
    if (totalPlayers === 0) {
      this.refreshUI();
      return;
    }

    // Separate by role, confirmed first then tentative, sorted by ilvl
    const sortByPriority = (a, b) => {
      if (a.status !== b.status) return a.status === 'confirmed' ? -1 : 1;
      return b.character_ilvl - a.character_ilvl;
    };

    const tanks = this.unassigned.filter(s => s.role === 'tank').sort(sortByPriority);
    const healers = this.unassigned.filter(s => s.role === 'healer').sort(sortByPriority);
    const dps = this.unassigned.filter(s => s.role === 'dps').sort(sortByPriority);

    // Work out how many groups we can make — at least 1 if we have players
    // Ideal: each group gets 1 tank, 1 healer, 3 DPS
    // Flexible: make as many groups as possible, fill what we can
    const groupCount = Math.max(1, Math.ceil(totalPlayers / 5));

    const existingNames = [];
    for (let i = 0; i < groupCount; i++) {
      const name = generateTeamName(existingNames);
      existingNames.push(name);
      this.groups.push({ team_name: name, members: [] });
    }

    // Distribute tanks round-robin
    tanks.forEach((t, i) => {
      this.groups[i % groupCount].members.push(t);
    });

    // Distribute healers round-robin
    healers.forEach((h, i) => {
      this.groups[i % groupCount].members.push(h);
    });

    // Snake draft DPS for ilvl balance
    let forward = true;
    let gi = 0;
    dps.forEach(d => {
      this.groups[gi].members.push(d);
      if (forward) {
        gi++;
        if (gi >= groupCount) { gi = groupCount - 1; forward = false; }
      } else {
        gi--;
        if (gi < 0) { gi = 0; forward = true; }
      }
    });

    // Remove any empty groups (shouldn't happen but just in case)
    this.groups = this.groups.filter(g => g.members.length > 0);

    // Update unassigned (should be empty now)
    const assignedIds = new Set(this.groups.flatMap(g => g.members.map(m => m.id)));
    this.unassigned = this.signups.filter(s => !assignedIds.has(s.id));

    this.refreshUI();
  }

  async saveGroups() {
    const saveBtn = document.getElementById('mplus-save-groups');
    if (saveBtn) {
      saveBtn.disabled = true;
      saveBtn.innerHTML = '<i class="las la-circle-notch la-spin"></i> Saving...';
    }

    try {
      const groupsData = this.groups.map(g => ({
        team_name: g.team_name,
        members: g.members.map(m => m.id)
      }));
      await mplusService.saveGroups(this.session.id, groupsData);
      if (saveBtn) {
        saveBtn.innerHTML = '<i class="las la-check"></i> Saved!';
        setTimeout(() => {
          saveBtn.disabled = false;
          saveBtn.innerHTML = '<i class="las la-save"></i> Save';
        }, 1500);
      }
    } catch (e) {
      if (saveBtn) {
        saveBtn.disabled = false;
        saveBtn.innerHTML = '<i class="las la-save"></i> Save';
      }
      alert('Failed to save: ' + e.message);
    }
  }

  clearGroups() {
    if (!confirm('Clear all groups? Players will return to the signup pool.')) return;
    this.groups = [];
    this.unassigned = [...this.signups];
    this.refreshUI();
  }

  close() {
    document.querySelector('.mplus-builder-overlay')?.remove();
    document.body.classList.remove('modal-open');
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
    if (this.onClose) this.onClose();
  }
}

export default MplusGroupBuilder;
