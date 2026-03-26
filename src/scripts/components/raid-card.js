import { getClassColor, getClassName } from '../utils/wow-constants.js';
import { getClassIconUrl, getSpecIconUrl } from '../utils/wow-icons.js';

// Map raid names to journal instance IDs for background imagery
const RAID_INSTANCE_IDS = {
  'The Voidspire': 1307,
  'March on Quel\'Danas': 1308,
  'The Dreamrift': 1314,
  'Nerub-ar Palace': 1273,
  'Liberation of Undermine': 1296,
  'Manaforge Omega': 1302
};

class RaidCard {
  static getInstanceId(raidTitle) {
    // Normalize quotes/apostrophes for matching
    const normalize = (s) => s.toLowerCase().replace(/['"'"]/g, '');
    const normalizedTitle = normalize(raidTitle);
    for (const [name, id] of Object.entries(RAID_INSTANCE_IDS)) {
      if (normalizedTitle.includes(normalize(name))) return id;
    }
    return null;
  }

  static render(raid, userSignup = null) {
    const raidDate = new Date(raid.raid_date);
    const now = new Date();
    const isPast = raidDate < now;

    const activeSignups = (raid.signups || []).filter(s => s.status !== 'declined');
    const signupCount = raid.signup_count ?? activeSignups.length;
    const tankCount = raid.tank_count ?? activeSignups.filter(s => s.role === 'tank').length;
    const healerCount = raid.healer_count ?? activeSignups.filter(s => s.role === 'healer').length;
    const dpsCount = raid.dps_count ?? activeSignups.filter(s => s.role === 'dps').length;

    const progressPercent = Math.min((signupCount / raid.max_players) * 100, 100);

    const difficultyClass = {
      'normal': 'difficulty-normal',
      'heroic': 'difficulty-heroic',
      'mythic': 'difficulty-mythic'
    }[raid.difficulty] || 'difficulty-heroic';

    const statusClass = {
      'open': 'status-open',
      'full': 'status-full',
      'cancelled': 'status-cancelled',
      'completed': 'status-completed'
    }[raid.status] || 'status-open';

    // Format date
    const dateStr = raidDate.toLocaleDateString('en-GB', {
      weekday: 'short', day: 'numeric', month: 'short'
    });
    const timeStr = raidDate.toLocaleTimeString('en-GB', {
      hour: '2-digit', minute: '2-digit'
    });

    // Countdown
    let countdownStr = '';
    if (!isPast && raid.status === 'open') {
      const diff = raidDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 0) countdownStr = `${days}d ${hours}h`;
      else if (hours > 0) countdownStr = `${hours}h`;
      else countdownStr = 'Soon';
    }

    // Signup list HTML
    const signupListHTML = raid.signups
      ? this.renderSignupList(raid.signups)
      : '';

    // Action button
    let actionHTML = '';
    if (!isPast && raid.status !== 'cancelled' && raid.status !== 'completed') {
      if (userSignup) {
        actionHTML = `
          <div class="raid-card-actions">
            <span class="raid-signed-up">Signed up as ${userSignup.character_name}</span>
            <button class="btn-raid-withdraw" data-raid-id="${raid.id}">Withdraw</button>
          </div>
        `;
      } else {
        actionHTML = `
          <div class="raid-card-actions">
            <button class="btn-raid-signup" data-raid-id="${raid.id}">Sign Up</button>
          </div>
        `;
      }
    }

    const instanceId = this.getInstanceId(raid.title);

    return `
      <div class="raid-card ${statusClass}" data-raid-id="${raid.id}" data-instance-id="${instanceId || ''}">
        <div class="raid-card-bg-overlay"></div>
        <div class="raid-card-inner">
        <div class="raid-card-header">
          <div class="raid-card-title">
            <h3>${raid.title}</h3>
            <span class="raid-difficulty-badge ${difficultyClass}">${raid.difficulty}</span>
          </div>
          <div class="raid-card-date">
            <span class="raid-date">${dateStr}</span>
            <span class="raid-time">${timeStr}</span>
            ${countdownStr ? `<span class="raid-countdown">${countdownStr}</span>` : ''}
          </div>
        </div>

        ${raid.description ? `<p class="raid-card-description">${raid.description}</p>` : ''}

        <div class="raid-card-progress">
          <div class="raid-progress-bar">
            <div class="raid-progress-fill" style="width: ${progressPercent}%"></div>
          </div>
          <span class="raid-progress-text">${signupCount}/${raid.max_players} players</span>
        </div>

        <div class="raid-card-roles">
          <div class="raid-role">
            <span class="raid-role-icon tank"><i class="las la-shield-alt"></i></span>
            <span class="raid-role-count">${tankCount}/${raid.min_tanks}</span>
          </div>
          <div class="raid-role">
            <span class="raid-role-icon healer"><i class="las la-plus-circle"></i></span>
            <span class="raid-role-count">${healerCount}/${raid.min_healers}</span>
          </div>
          <div class="raid-role">
            <span class="raid-role-icon dps"><i class="las la-crosshairs"></i></span>
            <span class="raid-role-count">${dpsCount}/${raid.min_dps}</span>
          </div>
        </div>

        ${signupListHTML}
        ${actionHTML}
      </div>
      </div>
    `;
  }

  static renderSignupList(signups) {
    const active = signups.filter(s => s.status !== 'declined');
    if (active.length === 0) return '<div class="raid-signups-empty">No signups yet</div>';

    const grouped = { tank: [], healer: [], dps: [] };
    active.forEach(s => {
      const role = grouped[s.role] ? s.role : 'dps';
      grouped[role].push(s);
    });

    const renderGroup = (members) => members.map(s => {
      const classColor = getClassColor(s.character_class_id);
      const classIconUrl = getClassIconUrl(s.character_class_id);
      const specIconUrl = s.character_spec ? getSpecIconUrl(s.character_class_id) : null;
      const statusIcon = s.status === 'tentative' ? '<i class="las la-question-circle tentative-icon"></i>' : '';

      return `
        <div class="raid-signup-member" title="${s.character_name} - ${s.character_spec || getClassName(s.character_class_id)} (${s.character_ilvl} ilvl)">
          ${classIconUrl ? `<img src="${classIconUrl}" alt="" class="raid-signup-icon" />` : ''}
          <span class="raid-signup-name" style="color: ${classColor}">${s.character_name}</span>
          ${statusIcon}
        </div>
      `;
    }).join('');

    return `
      <div class="raid-signups-list">
        ${grouped.tank.length ? `<div class="raid-signup-group"><span class="raid-signup-role-label tank">Tanks</span>${renderGroup(grouped.tank)}</div>` : ''}
        ${grouped.healer.length ? `<div class="raid-signup-group"><span class="raid-signup-role-label healer">Healers</span>${renderGroup(grouped.healer)}</div>` : ''}
        ${grouped.dps.length ? `<div class="raid-signup-group"><span class="raid-signup-role-label dps">DPS</span>${renderGroup(grouped.dps)}</div>` : ''}
      </div>
    `;
  }
}

export default RaidCard;
