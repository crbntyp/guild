import raidService from '../services/raid-service.js';
import RaidCard from './raid-card.js';
import SignupModal from './signup-modal.js';
import PageHeader from './page-header.js';
import wowAPI from '../api/wow-api.js';

class RaidManager {
  constructor(containerId, authService) {
    this.container = document.getElementById(containerId);
    this.authService = authService;
    this.raids = [];
    this.signupModal = null;
    this.isAdmin = false;

    // Read server (guild) ID and name from URL param or localStorage
    const urlParams = new URLSearchParams(window.location.search);
    const serverParam = urlParams.get('server');
    const nameParam = urlParams.get('name');
    if (serverParam) {
      localStorage.setItem('gld_raid_server', serverParam);
      this.guildId = serverParam;
    } else {
      this.guildId = localStorage.getItem('gld_raid_server') || null;
    }
    if (nameParam) {
      localStorage.setItem('gld_raid_server_name', nameParam);
      this.guildName = nameParam;
    } else {
      this.guildName = localStorage.getItem('gld_raid_server_name') || null;
    }
  }

  async init() {
    this.isAdmin = await raidService.checkAdmin();
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
      const raids = await raidService.getRaids(false, this.guildId);

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
      const message = this.guildId
        ? '<p>No upcoming raids</p><p class="no-raids-sub">Create one via your Discord bot, ask your GM!</p>'
        : '<p>No raids found</p><p class="no-raids-sub">Click a raid signup link from your Discord server to get started</p>';
      content.innerHTML = `
        <div class="no-raids">
          <i class="las la-dungeon la-3x"></i>
          ${message}
        </div>
      `;
      return;
    }

    const raidsHTML = this.raids.map(raid => {
      const signups = raid.signups || [];
      const userSignup = userId
        ? signups.find(s => s.bnet_user_id === userId)
        : null;
      return RaidCard.render(raid, userSignup, this.isAdmin);
    }).join('');

    content.innerHTML = `<div class="raids-grid">${raidsHTML}</div>`;

    this.attachRaidListeners();
    this.loadRaidBackgrounds();
  }

  async loadRaidBackgrounds() {
    const cards = this.container.querySelectorAll('.raid-card[data-instance-id]');

    for (const card of cards) {
      const instanceId = card.dataset.instanceId;
      if (!instanceId) continue;

      try {
        const mediaData = await wowAPI.getJournalInstanceMedia(parseInt(instanceId));
        if (mediaData?.assets) {
          const tileAsset = mediaData.assets.find(asset => asset.key === 'tile');
          if (tileAsset?.value) {
            const banner = card.querySelector('.raid-card-banner');
            if (banner) {
              banner.style.backgroundImage = `url('${tileAsset.value}')`;
            }
          }
        }
      } catch (error) {
        // Background not available, no problem
      }
    }
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

    // Admin delete buttons
    this.container.querySelectorAll('.btn-raid-delete').forEach(btn => {
      btn.addEventListener('click', async (e) => {
        e.stopPropagation();
        const raidId = parseInt(e.currentTarget.dataset.raidId);
        if (confirm('Delete this raid? This cannot be undone.')) {
          try {
            await raidService.deleteRaid(raidId);
            await this.loadRaids();
          } catch (error) {
            console.error('Failed to delete raid:', error);
            alert('Failed to delete: ' + error.message);
          }
        }
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
