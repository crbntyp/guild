import raidService from '../services/raid-service.js';
import RaidCard from './raid-card.js';
import SignupModal from './signup-modal.js';
import PageHeader from './page-header.js';

class RaidManager {
  constructor(containerId, authService) {
    this.container = document.getElementById(containerId);
    this.authService = authService;
    this.raids = [];
    this.signupModal = null;
  }

  async init() {
    this.render();
    await this.loadRaids();
  }

  render() {
    const headerHTML = PageHeader.render({
      className: 'raids',
      title: 'Raids',
      description: 'Sign up for upcoming raids with your guild. Pick a character, choose your role, and lock in your spot.'
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

    // Create signup modal
    this.signupModal = new SignupModal(this.authService, async (signupData) => {
      await this.handleSignup(signupData);
    });
    this.container.insertAdjacentHTML('beforeend', this.signupModal.render());
    this.signupModal.attachListeners();
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
