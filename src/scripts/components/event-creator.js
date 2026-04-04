import { parseEventInput } from '../utils/event-parser.js';
import { addVoidCinders } from '../utils/void-cinders.js';
import raidService from '../services/raid-service.js';
import mplusService from '../services/mplus-service.js';
import authService from '../services/auth.js';

class EventCreator {
  constructor() {
    this.servers = [];
    this.onCreated = null;
  }

  async open(onCreated) {
    this.onCreated = onCreated;

    // Fetch user's servers
    try {
      const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
        ? 'https://crbntyp.com/gld/api' : '/gld/api';
      const token = authService.getAccessToken();
      const res = await fetch(`${baseUrl}/user-servers.php`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        this.servers = data.servers || [];
      }
    } catch (e) {
      this.servers = [];
    }

    this.render();
  }

  render() {
    document.querySelector('.event-creator-overlay')?.remove();

    const serverDropdown = this.servers.length > 1
      ? `<div class="ec-server-picker">
          <select id="ec-server-select">
            ${this.servers.map(s => `<option value="${s.guild_id}">${s.guild_name}</option>`).join('')}
          </select>
        </div>`
      : '';

    const overlay = document.createElement('div');
    overlay.className = 'event-creator-overlay';
    overlay.innerHTML = `
      <div class="event-creator">
        <div class="void-cinders"><span></span><span></span><span></span><span></span><span></span><span></span><span></span><span></span></div>
        <div class="ec-header">
          <h3>What do you want to do?</h3>
          <button class="ec-close" id="ec-close"><i class="las la-times"></i></button>
        </div>
        ${serverDropdown}
        <div class="ec-input-wrap">
          <input type="text" id="ec-input" class="ec-input" placeholder="e.g. I want to make a raid, The Voidspire wednesday 8pm heroic, 2 tanks 4 healers 14 dps" autocomplete="off" />
        </div>
        <div class="ec-preview" id="ec-preview"></div>
        <div class="ec-actions" id="ec-actions" style="display:none">
          <button class="ec-btn-cancel" id="ec-cancel">Cancel</button>
          <button class="ec-btn-create" id="ec-create">Create</button>
        </div>
        <div class="ec-hint">
          <p>Start with <strong>"I want to make a raid"</strong> or <strong>"I want to make a group"</strong></p>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');

    // Focus input
    setTimeout(() => document.getElementById('ec-input')?.focus(), 100);

    this.attachListeners();
  }

  attachListeners() {
    const input = document.getElementById('ec-input');
    const preview = document.getElementById('ec-preview');
    const actions = document.getElementById('ec-actions');

    let debounceTimer;
    input?.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      debounceTimer = setTimeout(() => {
        const text = input.value.trim();
        if (text.length < 10) {
          preview.innerHTML = '';
          actions.style.display = 'none';
          return;
        }

        const parsed = parseEventInput(text);

        if (parsed.error) {
          preview.innerHTML = `<div class="ec-error">${parsed.error}</div>`;
          actions.style.display = 'none';
          return;
        }

        this.lastParsed = parsed;
        preview.innerHTML = this.renderPreview(parsed);
        actions.style.display = 'flex';
      }, 300);
    });

    // Enter to create
    input?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.lastParsed && !this.lastParsed.error) {
        this.create();
      }
    });

    document.getElementById('ec-close')?.addEventListener('click', () => this.close());
    document.getElementById('ec-cancel')?.addEventListener('click', () => this.close());
    document.getElementById('ec-create')?.addEventListener('click', () => this.create());

    document.addEventListener('keydown', this._escHandler = (e) => {
      if (e.key === 'Escape') this.close();
    });
  }

  renderPreview(parsed) {
    if (parsed.type === 'raid') {
      return `
        <div class="ec-preview-card">
          <div class="ec-preview-type">Raid</div>
          <div class="ec-preview-title">${parsed.title || 'Untitled'}</div>
          <div class="ec-preview-details">
            <span class="ec-preview-diff ec-diff-${parsed.difficulty}">${parsed.difficulty}</span>
            ${parsed.dateText ? `<span class="ec-preview-date">${parsed.dateText}</span>` : '<span class="ec-preview-missing">No date detected</span>'}
          </div>
          <div class="ec-preview-roles">
            <span class="ec-role tank"><i class="las la-shield-alt"></i> ${parsed.tanks}T</span>
            <span class="ec-role healer"><i class="las la-plus-circle"></i> ${parsed.healers}H</span>
            <span class="ec-role dps"><i class="las la-crosshairs"></i> ${parsed.dps}D</span>
            <span class="ec-role-total">${parsed.maxPlayers} players</span>
          </div>
          ${parsed.description ? `<div class="ec-preview-desc">${parsed.description}</div>` : ''}
        </div>
      `;
    } else {
      return `
        <div class="ec-preview-card">
          <div class="ec-preview-type">Group</div>
          <div class="ec-preview-title">${parsed.title || 'Untitled'}</div>
          <div class="ec-preview-details">
            ${parsed.dateText ? `<span class="ec-preview-date">${parsed.dateText}</span>` : '<span class="ec-preview-missing">No date detected</span>'}
          </div>
          ${parsed.description ? `<div class="ec-preview-desc">${parsed.description}</div>` : ''}
        </div>
      `;
    }
  }

  async create() {
    const parsed = this.lastParsed;
    if (!parsed || parsed.error) return;

    if (!parsed.date) {
      document.getElementById('ec-preview').innerHTML += '<div class="ec-error">Could not detect a date. Try "tonight 8pm" or "wednesday 8pm".</div>';
      return;
    }

    const createBtn = document.getElementById('ec-create');
    if (createBtn) {
      createBtn.disabled = true;
      createBtn.textContent = 'Creating...';
    }

    // Get server
    const serverSelect = document.getElementById('ec-server-select');
    const guildId = serverSelect?.value || (this.servers.length === 1 ? this.servers[0].guild_id : null);

    // Store exactly what the user asked for — no timezone conversion
    const d = parsed.date;
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')} ${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:00`;

    try {
      if (parsed.type === 'raid') {
        await raidService.createRaid({
          title: parsed.title,
          raid_date: dateStr,
          difficulty: parsed.difficulty,
          max_players: parsed.maxPlayers,
          max_tanks: parsed.tanks,
          max_healers: parsed.healers,
          max_dps: parsed.dps,
          description: parsed.description || null,
          discord_guild_id: guildId
        });
      } else {
        await mplusService.createSession({
          title: parsed.title,
          session_date: dateStr,
          description: parsed.description || null,
          discord_guild_id: guildId
        });
      }

      this.close();
      if (this.onCreated) this.onCreated(parsed.type);
    } catch (e) {
      if (createBtn) {
        createBtn.disabled = false;
        createBtn.textContent = 'Create';
      }
      document.getElementById('ec-preview').innerHTML += `<div class="ec-error">Failed: ${e.message}</div>`;
    }
  }

  close() {
    document.querySelector('.event-creator-overlay')?.remove();
    document.body.classList.remove('modal-open');
    if (this._escHandler) {
      document.removeEventListener('keydown', this._escHandler);
    }
  }
}

export default new EventCreator();
