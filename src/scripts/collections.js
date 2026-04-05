// Collections page - shared transmog looks and housing blueprints
import PageInitializer from './utils/page-initializer.js';
import authService from './services/auth.js';
import FormModal from './components/form-modal.js';

console.log('⚡ Collections initialized');

// Fallback preview images
const PLACEHOLDER_IMG = 'https://wow.zamimg.com/images/wow/icons/large/inv_misc_questionmark.jpg';
const HOUSING_PLACEHOLDER_IMG = 'img/housing-placeholder.jpg';

// Placeholder data — replace with a real data source / API later.
const COLLECTIONS = [
  {
    type: 'transmog',
    name: 'Abyssal Immolator',
    author: 'Bäsics',
    preview: 'https://render.worldofwarcraft.com/eu/icons/56/inv_helm_cloth_raidwarlockmidnight_d_01.jpg',
    link: '|cffa335ee|Htransmogset:1234|h[Abyssal Immolator]|h|r'
  },
  {
    type: 'transmog',
    name: 'Luminant Verdict',
    author: 'Felbladë',
    preview: 'https://render.worldofwarcraft.com/eu/icons/56/inv_helm_plate_raidpaladinmidnight_d_01.jpg',
    link: '|cffa335ee|Htransmogset:5678|h[Luminant Verdict]|h|r'
  },
  {
    type: 'blueprint',
    name: 'Cozy Highmountain Cabin',
    author: 'Blighthöund',
    preview: null,
    link: '|cffffd100|Hhousing:blueprint:0001|h[Cozy Highmountain Cabin]|h|r'
  }
];

function renderGrid() {
  const grid = document.getElementById('collections-grid');
  if (!grid) return;

  if (!COLLECTIONS.length) {
    grid.innerHTML = `<div class="collections-empty">Nothing shared yet.</div>`;
    return;
  }

  grid.innerHTML = COLLECTIONS.map((item, i) => {
    const fallback = item.type === 'blueprint' ? HOUSING_PLACEHOLDER_IMG : PLACEHOLDER_IMG;
    const preview = item.preview || fallback;
    return `
    <div class="collection-card">
      <div class="collection-card-preview">
        <img src="${preview}" alt="${item.name}" onerror="this.onerror=null;this.src='${fallback}'" />
        <span class="collection-card-type collection-card-type-${item.type}">
          <i class="las ${item.type === 'transmog' ? 'la-tshirt' : 'la-home'}"></i>
          ${item.type === 'transmog' ? 'Transmog' : 'Blueprint'}
        </span>
      </div>
      <div class="collection-card-body">
        <div class="collection-card-title">${item.name}</div>
        <div class="collection-card-author">shared by ${item.author}</div>
        <button class="collection-card-copy" data-index="${i}">
          <i class="las la-copy"></i>
          <span>Copy ingame link</span>
        </button>
      </div>
    </div>
  `;
  }).join('');
}

function attachCopyHandlers() {
  document.querySelectorAll('.collection-card-copy').forEach(btn => {
    btn.addEventListener('click', async () => {
      const index = parseInt(btn.dataset.index, 10);
      const item = COLLECTIONS[index];
      if (!item) return;

      try {
        await navigator.clipboard.writeText(item.link);
        const label = btn.querySelector('span');
        const original = label.textContent;
        label.textContent = 'Copied!';
        btn.classList.add('copied');
        setTimeout(() => {
          label.textContent = original;
          btn.classList.remove('copied');
        }, 1500);
      } catch (e) {
        console.error('Clipboard copy failed', e);
      }
    });
  });
}

async function hasLinkedDiscord() {
  if (!authService.isAuthenticated()) return false;
  try {
    const baseUrl = (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
      ? 'https://crbntyp.com/gld/api' : '/gld/api';
    const token = authService.getAccessToken();
    const res = await fetch(`${baseUrl}/user-servers.php`, {
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (!res.ok) return false;
    const data = await res.json();
    return Array.isArray(data.servers) && data.servers.length > 0;
  } catch (e) {
    return false;
  }
}

/**
 * Parse a WoW chat link like `|cffa335ee|Htransmogset:1234|h[Name]|h|r`
 * @returns {{ color: string, linkType: string, args: string[], label: string, raw: string } | null}
 */
function parseChatLink(raw) {
  if (!raw) return null;
  const str = raw.trim();
  const match = str.match(/^\|c(?:ff)?([0-9a-f]{6,8})\|H([^|]+)\|h\[([^\]]+)\]\|h\|r$/i);
  if (!match) return null;

  const [, color, payload, label] = match;
  const parts = payload.split(':');
  return {
    color: `#${color.slice(-6)}`,
    linkType: parts[0].toLowerCase(),
    args: parts.slice(1),
    label,
    raw: str
  };
}

/**
 * Map a parsed chat link (or raw code fallback) to a collection type.
 */
function detectCollectionType(code) {
  const parsed = parseChatLink(code);
  if (parsed) {
    if (parsed.linkType.startsWith('transmog')) return 'transmog';
    if (parsed.linkType === 'housing' || parsed.args.includes('blueprint')) return 'blueprint';
    return 'transmog';
  }
  if (!code) return 'transmog';
  const lower = code.toLowerCase();
  if (lower.includes('housing') || lower.includes('blueprint')) return 'blueprint';
  return 'transmog';
}

function readFileAsDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function setupAddModal() {
  const modal = new FormModal({
    id: 'add-collection-modal',
    title: 'Add a collection',
    fields: [
      {
        type: 'text',
        name: 'code',
        label: 'Ingame code',
        placeholder: '|cffa335ee|Htransmogset:1234|h[Name]|h|r',
        required: true,
        helperText: 'Paste the chat link copied from the game — the name is pulled automatically'
      },
      {
        type: 'file',
        name: 'screenshot',
        label: 'Screenshot',
        required: true,
        helperText: 'PNG or JPG, ideally a cropped in-game screenshot'
      }
    ],
    onSubmit: async (formData) => {
      const parsed = parseChatLink(formData.code);
      if (!parsed) {
        alert('That ingame code doesn\'t look right. Paste the chat link straight from the game.');
        throw new Error('Invalid chat link');
      }

      const fileInput = modal.getField('screenshot');
      const file = fileInput?.files?.[0];
      if (!file) return;

      const preview = await readFileAsDataURL(file);
      const battletag = authService.getUser()?.battletag || 'Anonymous';

      COLLECTIONS.unshift({
        type: detectCollectionType(formData.code),
        name: parsed.label,
        author: battletag,
        preview,
        link: formData.code
      });

      renderGrid();
      attachCopyHandlers();
    }
  });

  // Inject modal into DOM
  const wrapper = document.createElement('div');
  wrapper.innerHTML = modal.render();
  document.body.appendChild(wrapper.firstElementChild);
  modal.attachListeners();

  return modal;
}

async function setupAddButton() {
  const bar = document.getElementById('add-collection-bar');
  const btn = document.getElementById('add-collection-btn');
  if (!bar || !btn) return;

  const canAdd = await hasLinkedDiscord();
  if (!canAdd) return;

  const modal = setupAddModal();
  bar.style.display = '';
  btn.addEventListener('click', () => modal.open());
}

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init();

  renderGrid();
  attachCopyHandlers();
  setupAddButton();
});
