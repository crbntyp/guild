// Bot access control
// The discord bot install link is only usable by bnet accounts that are
// registered with one of our approved Discord servers.

import authService from '../services/auth.js';

export const ALLOWED_GUILD_IDS = [
  '590189437766336523',
  '822549525506949180',
  '1488423444465844234'
];

let cachedResult = null;

/**
 * Fetch the user's linked Discord servers and check against the allowlist.
 * Non-authenticated users are denied by default — they must log in with
 * bnet and be registered with an approved Discord server.
 */
export async function checkBotAccess() {
  if (cachedResult !== null) return cachedResult;

  if (!authService.isAuthenticated()) {
    cachedResult = { allowed: false, authenticated: false };
    return cachedResult;
  }

  try {
    const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'https://crbntyp.com/gld/api' : '/gld/api';
    const token = authService.getAccessToken();
    const res = await fetch(`${baseUrl}/user-servers.php`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) {
      cachedResult = { allowed: false, authenticated: true };
      return cachedResult;
    }
    const data = await res.json();
    const servers = Array.isArray(data.servers) ? data.servers : [];
    const allowed = servers.some(s => ALLOWED_GUILD_IDS.includes(String(s.guild_id)));
    cachedResult = { allowed, authenticated: true };
    return cachedResult;
  } catch (e) {
    cachedResult = { allowed: false, authenticated: true };
    return cachedResult;
  }
}

/**
 * Apply bot-access gating to any `.btn-add-bot` element on the page.
 * If the user is denied, the link is disabled and its label becomes
 * "Bot permissions denied".
 */
export async function applyBotAccessToButtons(root = document) {
  const buttons = root.querySelectorAll('.btn-add-bot');
  if (!buttons.length) return;

  const { allowed, authenticated } = await checkBotAccess();
  if (allowed) return;

  buttons.forEach(btn => {
    btn.classList.add('disabled');
    btn.setAttribute('aria-disabled', 'true');
    btn.removeAttribute('href');
    btn.removeAttribute('target');
    btn.addEventListener('click', (e) => e.preventDefault());
    btn.innerHTML = `<i class="lab la-discord"></i> Bot permissions denied`;
    btn.title = authenticated
      ? 'Your Battle.net account is not registered with an approved Discord server'
      : 'Log in with Battle.net to access this';
  });
}
