import mplusService from '../services/mplus-service.js';
import MplusSessionCard from './mplus-session-card.js';
import MplusGroupBuilder from './mplus-group-builder.js';
import SignupModal from './signup-modal.js';
import PageHeader from './page-header.js';
import { addVoidCinders } from '../utils/void-cinders.js';

class MplusManager {
  constructor(containerId, authService) {
    this.container = document.getElementById(containerId);
    this.authService = authService;
    this.sessions = [];
    this.signupModal = null;
    this.groupBuilder = new MplusGroupBuilder();
    this.isAdmin = false;
  }

  async init() {
    this.isAdmin = await mplusService.checkAdmin();

    // Check for Discord-BNet link flow
    const urlParams = new URLSearchParams(window.location.search);
    const linkDiscord = urlParams.get('link_discord') || sessionStorage.getItem('gld_link_discord');
    const linkToken = urlParams.get('link_token') || sessionStorage.getItem('gld_link_token');
    if (linkDiscord && linkToken) {
      try {
        await mplusService.linkDiscord(linkDiscord, linkToken);
      } catch (e) {
        console.error('Discord link failed:', e.message);
      }
      sessionStorage.removeItem('gld_link_discord');
      sessionStorage.removeItem('gld_link_token');
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    this.render();
    await this.loadSessions();
  }

  render() {
    const headerHTML = PageHeader.render({
      className: 'mplus-groups',
      badge: 'gld__ groups',
      title: 'Group Builder',
      description: 'Sign up for sessions, and let the GM build balanced 5-man groups from the signup pool.'
    });

    this.container.innerHTML = `
      ${headerHTML}
      <div id="mplus-sessions-content">
        <div class="loading-spinner">
          <i class="las la-circle-notch la-spin la-4x"></i>
          <p>Loading sessions...</p>
        </div>
      </div>
    `;

    // Signup modal (reuse raid signup modal with mplus mode)
    this.signupModal = new SignupModal(this.authService, async (signupData) => {
      await this.handleSignup(signupData);
    }, 'mplus');
    this.container.insertAdjacentHTML('beforeend', this.signupModal.render());
    this.signupModal.attachListeners();

  }

  async loadSessions() {
    const content = document.getElementById('mplus-sessions-content');

    try {
      const sessions = await mplusService.getSessions();

      this.sessions = await Promise.all(
        sessions.map(s => mplusService.getSession(s.id).catch(() => s))
      );

      this.renderSessionList();
    } catch (error) {
      console.error('Failed to load sessions:', error);
      content.innerHTML = `
        <div class="mplus-empty">
          <i class="las la-dungeon la-3x"></i>
          <p>Failed to load sessions</p>
        </div>
      `;
    }
  }

  renderSessionList() {
    const content = document.getElementById('mplus-sessions-content');
    const user = this.authService.getUser();
    const userId = user?.id;

    if (this.sessions.length === 0) {
      content.innerHTML = `
        <div class="mplus-empty">
          <i class="las la-trophy la-3x" style="color: #a335ee; margin-bottom: 16px"></i>
          <p>No upcoming sessions</p>
          <p class="mplus-empty-sub">Check back later or ask your GM to create one via <code>/group</code> in Discord</p>
        </div>
      `;
      return;
    }

    // Group sessions by Discord server
    const serverGroups = {};
    const noServer = [];

    this.sessions.forEach(session => {
      if (session.discord_guild_id) {
        if (!serverGroups[session.discord_guild_id]) {
          serverGroups[session.discord_guild_id] = {
            name: session.discord_guild_name || 'Unknown Server',
            sessions: []
          };
        }
        serverGroups[session.discord_guild_id].sessions.push(session);
      } else {
        noServer.push(session);
      }
    });

    let html = '';

    // Render each server group
    Object.values(serverGroups).forEach(group => {
      const cardsHTML = group.sessions.map(session => {
        const signups = session.signups || [];
        const userSignup = userId ? signups.find(s => s.bnet_user_id === userId) : null;
        return MplusSessionCard.render(session, userSignup, this.isAdmin, userId);
      }).join('');

      html += `
        <div class="mplus-server-group">
          <div class="mplus-server-header">
            <i class="lab la-discord"></i>
            <span>${group.name}</span>
          </div>
          <div class="mplus-sessions-grid">${cardsHTML}</div>
        </div>
      `;
    });

    // Render sessions without a server
    if (noServer.length > 0) {
      const cardsHTML = noServer.map(session => {
        const signups = session.signups || [];
        const userSignup = userId ? signups.find(s => s.bnet_user_id === userId) : null;
        return MplusSessionCard.render(session, userSignup, this.isAdmin, userId);
      }).join('');

      html += `<div class="mplus-sessions-grid">${cardsHTML}</div>`;
    }

    content.innerHTML = html;

    this.attachSessionListeners();
  }

  attachSessionListeners() {
    // Sign up
    this.container.querySelectorAll('.btn-mplus-signup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const sessionId = parseInt(e.target.dataset.sessionId);
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) this.signupModal.open(session);
      });
    });

    // Withdraw
    this.container.querySelectorAll('.btn-mplus-withdraw').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const sessionId = parseInt(e.target.dataset.sessionId);
        if (confirm('Withdraw from this session?')) {
          try {
            await mplusService.withdraw(sessionId);
            await this.loadSessions();
          } catch (error) {
            console.error('Failed to withdraw:', error);
          }
        }
      });
    });

    // Delete session (admin)
    this.container.querySelectorAll('.btn-mplus-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const sessionId = parseInt(e.currentTarget.dataset.sessionId);
        if (confirm('Delete this session? This cannot be undone.')) {
          try {
            await mplusService.deleteSession(sessionId);
            await this.loadSessions();
          } catch (error) {
            alert('Failed to delete: ' + error.message);
          }
        }
      });
    });

    // Build groups (admin)
    this.container.querySelectorAll('.btn-mplus-build-icon').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const sessionId = parseInt(e.currentTarget.dataset.sessionId);
        const session = this.sessions.find(s => s.id === sessionId);
        if (session) {
          this.groupBuilder.open(session, () => this.loadSessions());
        }
      });
    });
  }

  async handleSignup(signupData) {
    try {
      // Remap raid_id to session_id
      const data = { ...signupData };
      if (data.raid_id) {
        data.session_id = data.raid_id;
        delete data.raid_id;
      }
      await mplusService.signup(data);
      this.signupModal.close();
      await this.loadSessions();
    } catch (error) {
      console.error('Failed to sign up:', error);
      alert('Failed to sign up: ' + error.message);
    }
  }

  showCreateForm() {
    const overlay = document.createElement('div');
    overlay.className = 'mplus-create-overlay';
    overlay.innerHTML = `
      <div class="mplus-create-form">
        <h3>Create M+ Session</h3>
        <div class="mplus-form-field">
          <label>Title</label>
          <input type="text" id="mplus-form-title" placeholder="e.g. Wednesday M+ Push" />
        </div>
        <div class="mplus-form-field">
          <label>Date & Time</label>
          <input type="datetime-local" id="mplus-form-date" />
        </div>
        <div class="mplus-form-field">
          <label>Description (optional)</label>
          <input type="text" id="mplus-form-desc" placeholder="e.g. High keys, 2500+ score preferred" />
        </div>
        <div class="mplus-form-actions">
          <button class="mplus-form-cancel" id="mplus-form-cancel">Cancel</button>
          <button class="mplus-form-submit" id="mplus-form-submit">Create</button>
        </div>
      </div>
    `;

    document.body.appendChild(overlay);
    document.body.classList.add('modal-open');
    addVoidCinders(overlay.querySelector('.mplus-create-form'));

    // No click-outside-to-close — use cancel button

    const closeForm = () => {
      overlay.remove();
      document.body.classList.remove('modal-open');
      document.removeEventListener('keydown', escHandler);
    };

    const escHandler = (e) => {
      if (e.key === 'Escape') closeForm();
    };
    document.addEventListener('keydown', escHandler);

    document.getElementById('mplus-form-cancel').addEventListener('click', closeForm);

    document.getElementById('mplus-form-submit').addEventListener('click', async () => {
      const title = document.getElementById('mplus-form-title').value.trim();
      const date = document.getElementById('mplus-form-date').value;
      const desc = document.getElementById('mplus-form-desc').value.trim();

      if (!title || !date) {
        alert('Title and date are required');
        return;
      }

      try {
        await mplusService.createSession({
          title,
          session_date: date,
          description: desc || null
        });
        overlay.remove();
        document.body.classList.remove('modal-open');
        await this.loadSessions();
      } catch (error) {
        alert('Failed to create session: ' + error.message);
      }
    });
  }
}

export default MplusManager;
