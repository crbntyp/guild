import raidService from '../services/raid-service.js';
import RaidCard from './raid-card.js';
import SignupModal from './signup-modal.js';
import PageHeader from './page-header.js';
import FormModal from './form-modal.js';
import authService from '../services/auth.js';

class RaidManager {
  constructor(containerId, authService) {
    this.container = document.getElementById(containerId);
    this.authService = authService;
    this.raids = [];
    this.signupModal = null;
    this.createRaidModal = null;
  }

  async init() {
    this.render();
    await this.loadRaids();
  }

  render() {
    const headerHTML = PageHeader.render({
      className: 'raids',
      title: 'Raids',
      description: 'Sign up for upcoming raids with your guild. Pick a character, choose your role, and lock in your spot.',
      actionButton: {
        id: 'btn-create-raid',
        icon: 'la-plus',
        text: 'Create Raid'
      }
    });

    this.container.innerHTML = `
      ${headerHTML}
      <div id="raids-content">
        <div class="loading-spinner">
          <i class="las la-circle-notch la-spin la-4x"></i>
          <p>Loading raids...</p>
        </div>
      </div>
    `;

    // Create raid modal
    this.createRaidModal = new FormModal({
      id: 'create-raid-modal',
      title: 'Create Raid',
      fields: [
        { name: 'title', type: 'text', label: 'Raid Name', placeholder: 'e.g. The Voidspire Heroic', required: true },
        { name: 'description', type: 'textarea', label: 'Description', placeholder: 'Optional notes...' },
        { name: 'raid_date', type: 'datetime-local', label: 'Date & Time', required: true },
        { name: 'difficulty', type: 'select', label: 'Difficulty', options: [
          { value: 'normal', label: 'Normal' },
          { value: 'heroic', label: 'Heroic' },
          { value: 'mythic', label: 'Mythic' }
        ], defaultValue: 'heroic' },
        { name: 'max_players', type: 'number', label: 'Max Players', placeholder: '20', defaultValue: '20' },
        { name: 'min_tanks', type: 'number', label: 'Min Tanks', placeholder: '2', defaultValue: '2' },
        { name: 'min_healers', type: 'number', label: 'Min Healers', placeholder: '4', defaultValue: '4' },
        { name: 'min_dps', type: 'number', label: 'Min DPS', placeholder: '14', defaultValue: '14' }
      ],
      onSubmit: async (formData) => {
        await this.handleCreateRaid(formData);
      }
    });

    // Append modal HTML
    this.container.insertAdjacentHTML('beforeend', this.createRaidModal.render());
    this.createRaidModal.attachListeners();

    // Create signup modal
    this.signupModal = new SignupModal(this.authService, async (signupData) => {
      await this.handleSignup(signupData);
    });
    this.container.insertAdjacentHTML('beforeend', this.signupModal.render());
    this.signupModal.attachListeners();

    // Attach create button listener
    const createBtn = document.getElementById('btn-create-raid');
    if (createBtn) {
      createBtn.addEventListener('click', () => this.createRaidModal.open());
    }
  }

  async loadRaids() {
    const content = document.getElementById('raids-content');

    try {
      const raids = await raidService.getRaids();

      // Fetch full details (with signups) for each raid
      this.raids = await Promise.all(
        raids.map(r => raidService.getRaid(r.id).catch(() => r))
      );

      this.renderRaidList();
    } catch (error) {
      console.error('Failed to load raids:', error);
      content.innerHTML = `
        <div class="no-raids">
          <i class="las la-dungeon la-3x"></i>
          <p>Failed to load raids</p>
        </div>
      `;
    }
  }

  renderRaidList() {
    const content = document.getElementById('raids-content');
    const user = this.authService.getUser();
    const userId = user?.id;

    if (this.raids.length === 0) {
      content.innerHTML = `
        <div class="no-raids">
          <i class="las la-dungeon la-3x"></i>
          <p>No upcoming raids</p>
          <p class="no-raids-sub">Create one to get started</p>
        </div>
      `;
      return;
    }

    const raidsHTML = this.raids.map(raid => {
      const signups = raid.signups || [];
      const userSignup = userId
        ? signups.find(s => s.bnet_user_id === userId)
        : null;
      return RaidCard.render(raid, userSignup);
    }).join('');

    content.innerHTML = `<div class="raids-grid">${raidsHTML}</div>`;

    this.attachRaidListeners();
  }

  attachRaidListeners() {
    // Sign up buttons
    this.container.querySelectorAll('.btn-raid-signup').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const raidId = parseInt(e.target.dataset.raidId);
        const raid = this.raids.find(r => r.id === raidId);
        if (raid) this.signupModal.open(raid);
      });
    });

    // Withdraw buttons
    this.container.querySelectorAll('.btn-raid-withdraw').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        const raidId = parseInt(e.target.dataset.raidId);
        if (confirm('Withdraw from this raid?')) {
          try {
            await raidService.withdraw(raidId);
            await this.loadRaids();
          } catch (error) {
            console.error('Failed to withdraw:', error);
          }
        }
      });
    });
  }

  async handleCreateRaid(formData) {
    try {
      // Convert local datetime to UTC for storage
      const localDate = new Date(formData.raid_date);
      const utcDate = localDate.toISOString().slice(0, 19).replace('T', ' ');

      await raidService.createRaid({
        title: formData.title,
        description: formData.description || null,
        raid_date: utcDate,
        difficulty: formData.difficulty || 'heroic',
        max_players: parseInt(formData.max_players) || 20,
        min_tanks: parseInt(formData.min_tanks) || 2,
        min_healers: parseInt(formData.min_healers) || 4,
        min_dps: parseInt(formData.min_dps) || 14
      });

      this.createRaidModal.close();
      await this.loadRaids();
    } catch (error) {
      console.error('Failed to create raid:', error);
      alert('Failed to create raid: ' + error.message);
    }
  }

  async handleSignup(signupData) {
    try {
      await raidService.signup(signupData);
      this.signupModal.close();
      await this.loadRaids();
    } catch (error) {
      console.error('Failed to sign up:', error);
      alert('Failed to sign up: ' + error.message);
    }
  }
}

export default RaidManager;
