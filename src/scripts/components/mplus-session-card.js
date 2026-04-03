import { getClassColor, getClassName } from '../utils/wow-constants.js';
import { getClassIconUrl } from '../utils/wow-icons.js';

class MplusSessionCard {
  static render(session, userSignup = null, isAdmin = false, userId = null) {
    const isOwner = userId && parseInt(session.owner_bnet_id) === userId;
    const canManage = isAdmin || isOwner;
    const sessionDate = new Date(session.session_date);
    const now = new Date();
    const isPast = sessionDate < now;

    const signups = session.signups || [];
    const signupCount = session.signup_count ?? signups.length;
    const tankCount = session.tank_count ?? signups.filter(s => s.role === 'tank').length;
    const healerCount = session.healer_count ?? signups.filter(s => s.role === 'healer').length;
    const dpsCount = session.dps_count ?? signups.filter(s => s.role === 'dps').length;

    // How many complete groups possible
    const possibleGroups = Math.min(tankCount, healerCount, Math.floor(dpsCount / 3));

    const dateStr = sessionDate.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' });
    const timeStr = sessionDate.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });

    let countdownStr = '';
    if (isPast) {
      countdownStr = 'Passed';
    } else {
      const diff = sessionDate - now;
      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      if (days > 1) countdownStr = `${days}d ${hours}h`;
      else if (days === 1) countdownStr = 'Tomorrow';
      else if (hours > 0) countdownStr = 'Today';
      else countdownStr = 'Soon';
    }

    const signupListHTML = signups.length > 0 ? this.renderSignupList(signups) : '<div class="mplus-signups-empty">No signups yet</div>';


    return `
      <div class="mplus-session-card" data-session-id="${session.id}">
        ${canManage ? `<button class="btn-mplus-build-icon" data-session-id="${session.id}" title="Build Groups">Build</button>` : ''}
        ${isAdmin ? `
          <div class="mplus-card-admin-icons">
            <button class="btn-mplus-delete" data-session-id="${session.id}" title="Delete session"><i class="las la-trash-alt"></i></button>
          </div>
        ` : ''}
        <div class="mplus-card-header">
          <div class="mplus-card-title">
            <h3>${session.title}</h3>
            <span class="mplus-card-status status-${session.status}">${session.status}</span>
          </div>
          <div class="mplus-card-date">
            <span class="mplus-date">${dateStr}</span>
            <span class="mplus-time">${timeStr}</span>
            <span class="mplus-countdown">${countdownStr}</span>
          </div>
          ${session.description ? `<p class="mplus-card-description">${session.description}</p>` : ''}
        </div>

        <div class="mplus-card-stats">
          <div class="mplus-stat">
            <span class="mplus-stat-icon tank"><i class="las la-shield-alt"></i></span>
            <span class="mplus-stat-count">${tankCount}</span>
          </div>
          <div class="mplus-stat">
            <span class="mplus-stat-icon healer"><i class="las la-plus-circle"></i></span>
            <span class="mplus-stat-count">${healerCount}</span>
          </div>
          <div class="mplus-stat">
            <span class="mplus-stat-icon dps"><i class="las la-crosshairs"></i></span>
            <span class="mplus-stat-count">${dpsCount}</span>
          </div>
          <span class="mplus-stat-groups">${possibleGroups} group${possibleGroups !== 1 ? 's' : ''} possible</span>
        </div>

        <div class="mplus-card-roster">${signupListHTML}</div>

        <div class="mplus-card-actions">
          ${userSignup && !isPast && session.status === 'open' ? `
            <span class="mplus-signed-up">Signed up as ${userSignup.character_name}</span>
            <button class="btn-mplus-withdraw" data-session-id="${session.id}">Withdraw</button>
          ` : !userSignup && !isPast && session.status === 'open' ? `
            <button class="btn-mplus-signup" data-session-id="${session.id}">Sign Up</button>
          ` : ''}
        </div>
      </div>
    `;
  }

  static renderSignupList(signups) {
    const grouped = { tank: [], healer: [], dps: [] };
    signups.forEach(s => {
      const role = grouped[s.role] ? s.role : 'dps';
      grouped[role].push(s);
    });

    const renderGroup = (members) => members.map(s => {
      const classColor = getClassColor(s.character_class_id);
      const classIconUrl = getClassIconUrl(s.character_class_id);
      const tentativeIcon = s.status === 'tentative' ? '<i class="las la-question-circle tentative-icon"></i>' : '';
      const rating = s.mplus_rating || 0;
      return `
        <div class="mplus-signup-member" title="${s.character_name} - ${s.character_spec || getClassName(s.character_class_id)} (${s.character_ilvl} ilvl, ${rating} io)">
          ${classIconUrl ? `<img src="${classIconUrl}" alt="" class="mplus-signup-icon" />` : ''}
          <span class="mplus-signup-name" style="color: ${classColor}">${s.character_name}</span>
          <span class="mplus-signup-rating"><i class="las la-star"></i> (${rating})</span>
          ${tentativeIcon}
        </div>
      `;
    }).join('');

    return `
      <div class="mplus-signups-list">
        ${grouped.tank.length ? `<div class="mplus-signup-group"><span class="mplus-signup-role-label tank">Tanks</span>${renderGroup(grouped.tank)}</div>` : ''}
        ${grouped.healer.length ? `<div class="mplus-signup-group"><span class="mplus-signup-role-label healer">Healers</span>${renderGroup(grouped.healer)}</div>` : ''}
        ${grouped.dps.length ? `<div class="mplus-signup-group"><span class="mplus-signup-role-label dps">DPS</span>${renderGroup(grouped.dps)}</div>` : ''}
      </div>
    `;
  }
}

export default MplusSessionCard;
