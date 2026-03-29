// Events page - displays current and upcoming WoW events
import PageInitializer from './utils/page-initializer.js';
import PageHeader from './components/page-header.js';

console.log('⚡ Events page initialized');

class EventsPage {
  constructor() {
    this.container = document.getElementById('events-container');
    this.events = [];
    this.currentEvents = [];
    this.upcomingEvents = [];
    this.laterEvents = [];
    this.updateInterval = null;
  }

  async init() {
    try {
      await this.loadEvents();
      this.categorizeEvents();
      this.render();
      this.updateInterval = setInterval(() => this.updateCountdowns(), 1000);
    } catch (error) {
      console.error('Error loading events:', error);
      this.renderError(error);
    }
  }

  async loadEvents() {
    const response = await fetch('data/events-generated.json');
    if (!response.ok) throw new Error(`Failed to load events: ${response.status}`);
    const data = await response.json();
    this.events = data.events || [];
  }

  categorizeEvents() {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

    this.currentEvents = [];
    this.upcomingEvents = [];
    this.laterEvents = [];

    // Filter out junk
    const raidNames = ['The Voidspire', "March on Quel'Danas", 'The Dreamrift', 'Nerub-ar Palace', 'Liberation of Undermine', 'Manaforge Omega'];
    const filtered = this.events.filter(e => {
      if (!e.name || /^\[#\d+\]$/.test(e.name)) return false;
      if (raidNames.some(r => e.name === r)) return false;
      if (!e.occurrences || e.occurrences.length === 0) return false;
      if ((e.popularity || 0) < 30) return false;
      return true;
    });

    // Deduplicate by name (keep highest popularity)
    const deduped = new Map();
    filtered.forEach(e => {
      const existing = deduped.get(e.name);
      if (!existing || (e.popularity || 0) > (existing.popularity || 0)) {
        deduped.set(e.name, e);
      }
    });

    deduped.forEach(event => {
      // Find next relevant occurrence
      const futureOcc = event.occurrences.find(occ => new Date(occ.end) > now);
      if (!futureOcc) return;

      const start = new Date(futureOcc.start);
      const end = new Date(futureOcc.end);

      // Find the NEXT occurrence after this one (for "Returns" display)
      const currentOccIndex = event.occurrences.indexOf(futureOcc);
      const nextOcc = event.occurrences[currentOccIndex + 1] || null;

      const enriched = { ...event, activeOccurrence: futureOcc, nextOccurrence: nextOcc };

      if (start <= now && end > now) {
        this.currentEvents.push(enriched);
      } else if (start > now && start <= twoWeeksFromNow) {
        this.upcomingEvents.push(enriched);
      } else if (start > twoWeeksFromNow && (event.popularity || 0) >= 80) {
        this.laterEvents.push(enriched);
      }
    });

    // Sort
    this.currentEvents.sort((a, b) => new Date(a.activeOccurrence.end) - new Date(b.activeOccurrence.end));
    this.upcomingEvents.sort((a, b) => new Date(a.activeOccurrence.start) - new Date(b.activeOccurrence.start));
    this.laterEvents.sort((a, b) => (b.popularity || 0) - (a.popularity || 0));
    this.laterEvents = this.laterEvents.slice(0, 12);
  }

  render() {
    if (!this.container) return;

    let html = PageHeader.render({
      className: 'events',
      title: 'Events',
      description: 'Current and upcoming World of Warcraft events.'
    });

    html += '<div id="events-content">';

    // Active events — same compact rows as upcoming
    if (this.currentEvents.length > 0) {
      html += `
        <div class="events-section">
          <div class="events-section-label"><span class="events-label-dot active"></span> Active Now</div>
          <div class="events-active-grid">
            ${this.currentEvents.map(e => this.renderActiveRow(e)).join('')}
          </div>
        </div>
      `;
    }

    // Upcoming events — compact rows
    if (this.upcomingEvents.length > 0) {
      html += `
        <div class="events-section">
          <div class="events-section-label"><span class="events-label-dot upcoming"></span> Starting Soon</div>
          <div class="events-upcoming-list">
            ${this.upcomingEvents.map(e => this.renderUpcomingRow(e)).join('')}
          </div>
        </div>
      `;
    }

    // Coming later
    if (this.laterEvents.length > 0) {
      html += `
        <div class="events-section">
          <div class="events-section-label"><span class="events-label-dot later"></span> Popular Events Coming Later This Year</div>
          <div class="events-later-list">
            ${this.laterEvents.map((e, i) => this.renderLaterRow(e, i + 1)).join('')}
          </div>
        </div>
      `;
    }

    if (this.currentEvents.length === 0 && this.upcomingEvents.length === 0 && this.laterEvents.length === 0) {
      html += `
        <div class="events-empty">
          <i class="las la-calendar-times"></i>
          <p>No events found</p>
          <p class="events-empty-sub">Check back later for upcoming World of Warcraft events.</p>
        </div>
      `;
    }

    html += '</div>';
    this.container.innerHTML = html;
  }

  renderHeroCard(event) {
    const bannerUrl = this.getEventBannerUrl(event.name);
    const iconUrl = this.getEventIconUrl(event.name, event.categoryName);
    const categoryClass = this.getCategoryClass(event.categoryName, event.name);
    const displayCategory = this.getDisplayCategory(event);

    // Progress through event
    const start = new Date(event.activeOccurrence.start);
    const end = new Date(event.activeOccurrence.end);
    const now = new Date();
    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

    // Days remaining
    const remaining = end - now;
    const daysLeft = Math.floor(remaining / (1000 * 60 * 60 * 24));
    const hoursLeft = Math.floor((remaining % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

    // Returns date
    let returnsHtml = '';
    if (event.nextOccurrence) {
      const nextStart = new Date(event.nextOccurrence.start);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      returnsHtml = `<span class="event-returns">Returns ${monthNames[nextStart.getMonth()]} ${nextStart.getDate()}</span>`;
    }

    return `
      <div class="event-hero ${categoryClass}" ${bannerUrl ? `style="background-image: url('${bannerUrl}')"` : ''}>
        <div class="event-hero-overlay"></div>
        <div class="event-hero-content">
          <div class="event-hero-icon">
            <img src="${iconUrl}" alt="" />
          </div>
          <div class="event-hero-info">
            <div class="event-hero-top">
              <span class="event-hero-category">${displayCategory}</span>
              ${returnsHtml}
            </div>
            <h3 class="event-hero-name">${event.name}</h3>
            <div class="event-hero-timer">
              <div class="event-hero-countdown" data-end="${event.activeOccurrence.end}" data-start="${event.activeOccurrence.start}" data-type="current">
                ${daysLeft > 0 ? `${daysLeft}d ${hoursLeft}h remaining` : `${hoursLeft}h remaining`}
              </div>
              <div class="event-hero-progress">
                <div class="event-hero-progress-fill ${categoryClass}" style="width: ${progress}%"></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  renderActiveRow(event) {
    const iconUrl = this.getEventIconUrl(event.name, event.categoryName);
    const categoryClass = this.getCategoryClass(event.categoryName, event.name);
    const start = new Date(event.activeOccurrence.start);
    const end = new Date(event.activeOccurrence.end);
    const now = new Date();

    // Progress
    const totalDuration = end - start;
    const elapsed = now - start;
    const progress = Math.min(Math.round((elapsed / totalDuration) * 100), 100);

    // Returns
    let returnsHtml = '';
    if (event.nextOccurrence) {
      const nextStart = new Date(event.nextOccurrence.start);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      returnsHtml = `<span class="event-returns">Returns ${monthNames[nextStart.getMonth()]} ${nextStart.getDate()}</span>`;
    }

    return `
      <div class="event-upcoming-row event-active-row ${categoryClass}">
        <div class="event-upcoming-icon">
          <img src="${iconUrl}" alt="" />
        </div>
        <div class="event-upcoming-info">
          <span class="event-upcoming-name">${event.name}</span>
          <span class="event-upcoming-category">${this.getDisplayCategory(event)}</span>
        </div>
        <div class="event-active-right">
          <span class="event-active-countdown" data-end="${event.activeOccurrence.end}" data-start="${event.activeOccurrence.start}" data-type="current">${this.formatCountdown(event.activeOccurrence, true)}</span>
          ${returnsHtml}
        </div>
        <div class="event-active-progress-bar">
          <div class="event-active-progress-fill ${categoryClass}" style="width: ${progress}%"></div>
        </div>
      </div>
    `;
  }

  renderUpcomingRow(event) {
    const iconUrl = this.getEventIconUrl(event.name, event.categoryName);
    const categoryClass = this.getCategoryClass(event.categoryName, event.name);
    const start = new Date(event.activeOccurrence.start);
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `
      <div class="event-upcoming-row ${categoryClass}">
        <div class="event-upcoming-date">
          <span class="event-date-day">${dayNames[start.getDay()]}</span>
          <span class="event-date-num">${start.getDate()}</span>
          <span class="event-date-month">${monthNames[start.getMonth()]}</span>
        </div>
        <div class="event-upcoming-icon">
          <img src="${iconUrl}" alt="" />
        </div>
        <div class="event-upcoming-info">
          <span class="event-upcoming-name">${event.name}</span>
          <span class="event-upcoming-category">${this.getDisplayCategory(event)}</span>
        </div>
        <div class="event-upcoming-countdown" data-end="${event.activeOccurrence.end}" data-start="${event.activeOccurrence.start}" data-type="upcoming">
          ${this.formatCountdown(event.activeOccurrence, false)}
        </div>
      </div>
    `;
  }

  renderLaterRow(event, rank) {
    const iconUrl = this.getEventIconUrl(event.name, event.categoryName);
    const categoryClass = this.getCategoryClass(event.categoryName, event.name);
    const start = new Date(event.activeOccurrence.start);
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

    return `
      <div class="event-later-row ${categoryClass}">
        <span class="event-later-rank">${rank}</span>
        <div class="event-later-icon">
          <img src="${iconUrl}" alt="" />
        </div>
        <span class="event-later-name">${event.name}</span>
        <span class="event-later-date">${monthNames[start.getMonth()]} ${start.getDate()}</span>
      </div>
    `;
  }

  getDisplayCategory(event) {
    const name = event.name || '';
    if (name.startsWith('WoW Remix')) return 'Remix';
    if (name.includes('Timewalking') || name.includes('Dungeon Event')) return 'Recurring';
    if (name.includes('PvP Brawl')) return 'PvP';
    if (/WoW'?s? (\d+\w{2} )?Anniversary/i.test(name)) return 'Anniversary';
    if (name.includes('Bonus Event')) return 'Bonus';
    if (name.includes('Darkmoon Faire')) return 'Darkmoon';
    if (name.includes('Cup')) return 'Racing';
    if (/Plunderstorm|Trial of Style|Secrets of Azeroth|Turbulent Timeways/i.test(name)) return 'Special';
    if (event.categoryName === 'Holidays') return 'Holiday';
    return event.categoryName || 'Event';
  }

  getCategoryClass(categoryName, eventName) {
    if (eventName && /WoW'?s? (\d+\w{2} )?Anniversary/i.test(eventName)) return 'category-anniversary';
    if (eventName && eventName.startsWith('WoW Remix')) return 'category-remix';
    if (eventName && (eventName.includes('Timewalking') || eventName.includes('Dungeon Event'))) return 'category-recurring';
    if (eventName && eventName.includes('PvP Brawl')) return 'category-pvp';
    if (eventName && eventName.includes('Bonus Event')) return 'category-bonus';
    if (eventName && eventName.includes('Darkmoon Faire')) return 'category-darkmoon';
    if (eventName && eventName.includes('Cup')) return 'category-racing';
    if (eventName && /Plunderstorm|Trial of Style|Secrets of Azeroth|Turbulent Timeways/i.test(eventName)) return 'category-special';
    const map = { 'Holidays': 'category-holiday', 'Recurring': 'category-recurring' };
    return map[categoryName] || 'category-other';
  }

  getEventIconUrl(eventName, categoryName) {
    const cdn = 'https://wow.zamimg.com/images/wow/icons/large';
    const name = (eventName || '').toLowerCase();

    if (name.includes('winter veil') || name.includes('feast of winter')) return `${cdn}/calendar_winterveilstart.jpg`;
    if (name.includes('noblegarden')) return `${cdn}/calendar_noblegardenstart.jpg`;
    if (name.includes('hallow')) return `${cdn}/calendar_hallowsendstart.jpg`;
    if (name.includes('lunar festival')) return `${cdn}/calendar_lunarfestivalstart.jpg`;
    if (name.includes('brewfest')) return `${cdn}/calendar_brewfeststart.jpg`;
    if (name.includes('midsummer') || name.includes('fire festival')) return `${cdn}/calendar_midsummerstart.jpg`;
    if (name.includes('love is in the air')) return `${cdn}/calendar_loveintheairstart.jpg`;
    if (name.includes('children')) return `${cdn}/calendar_childrensweekstart.jpg`;
    if (name.includes('day of the dead')) return `${cdn}/calendar_dayofthedeadstart.jpg`;
    if (name.includes('pilgrim')) return `${cdn}/calendar_pilgrimsbountystart.jpg`;
    if (name.includes('darkmoon')) return `${cdn}/inv_darkmoon_eye.jpg`;
    if (name.includes('harvest festival')) return `${cdn}/calendar_harvestfestivalstart.jpg`;
    if (name.includes('fireworks')) return `${cdn}/calendar_fireworksstart.jpg`;
    if (/wow'?s?\s+(\d+\w{2}\s+)?anniversary/i.test(eventName)) return `${cdn}/calendar_anniversarystart.jpg`;
    if (name.includes('pvp brawl')) return `${cdn}/ability_pvp_gladiatormedallion.jpg`;
    if (name.includes('battleground bonus')) return `${cdn}/pvpcurrency-honor-horde.jpg`;
    if (name.includes('arena skirmish')) return `${cdn}/achievement_legionpvptier4.jpg`;
    if (name.includes('pet battle bonus')) return `${cdn}/tracking_wildpet.jpg`;
    if (name.includes('world quest bonus')) return `${cdn}/inv_misc_coin_02.jpg`;
    if (name.includes('delves bonus')) return `${cdn}/ui_delves.jpg`;
    if (name.includes('burning crusade') && name.includes('timewalking')) return `${cdn}/expansionicon_burningcrusade.jpg`;
    if (name.includes('wrath') && name.includes('timewalking')) return `${cdn}/expansionicon_wrathofthelichking.jpg`;
    if (name.includes('cataclysm') && name.includes('timewalking')) return `${cdn}/expansionicon_cataclysm.jpg`;
    if (name.includes('mists of pandaria') && name.includes('timewalking')) return `${cdn}/expansionicon_mistsofpandaria.jpg`;
    if (name.includes('legion') && name.includes('timewalking')) return `${cdn}/inv_sword_2h_artifactashbringer_d_01.jpg`;
    if (name.includes('midnight dungeon')) return `${cdn}/spell_shadow_twilight.jpg`;
    if (name.includes('war within dungeon')) return `${cdn}/achievement_dungeon_theatreofpain.jpg`;
    if (name.includes('dragonflight dungeon')) return `${cdn}/inv_misc_head_dragon_black.jpg`;
    if (name.includes('timewalking') || name.includes('dungeon event')) return `${cdn}/achievement_dungeon_gundrak_heroic.jpg`;
    if (name.includes('remix')) return `${cdn}/spell_arcane_teleportstormwind.jpg`;
    if (name.includes('cup')) return `${cdn}/inv_misc_tournaments_symbol_bloodelf.jpg`;
    if (name.includes('trial of style')) return `${cdn}/achievement_character_bloodelf_female.jpg`;
    if (name.includes('un\'goro')) return `${cdn}/inv_misc_monsterhorn_06.jpg`;
    if (categoryName === 'Holidays') return `${cdn}/calendar_winterveilstart.jpg`;
    return `${cdn}/inv_misc_rune_01.jpg`;
  }

  getEventBannerUrl(eventName) {
    const cdn = 'https://render.worldofwarcraft.com/us/zones';
    const name = (eventName || '').toLowerCase();

    if (name.includes('burning crusade') && name.includes('timewalking')) return `${cdn}/black-temple-small.jpg`;
    if (name.includes('wrath') && name.includes('timewalking')) return `${cdn}/icecrown-citadel-small.jpg`;
    if (name.includes('cataclysm') && name.includes('timewalking')) return `${cdn}/firelands-small.jpg`;
    if (name.includes('mists of pandaria') && name.includes('timewalking')) return `${cdn}/siege-of-orgrimmar-small.jpg`;
    if (name.includes('legion') && name.includes('timewalking')) return `${cdn}/antorus-the-burning-throne-small.jpg`;
    if (name.includes('midnight dungeon')) return `${cdn}/the-voidspire-small.jpg`;
    if (name.includes('war within dungeon')) return `${cdn}/nerubar-palace-small.jpg`;
    if (name.includes('timewalking') || name.includes('dungeon event')) return `${cdn}/ulduar-small.jpg`;
    if (name.includes('pvp brawl') || name.includes('battleground') || name.includes('arena skirmish')) return 'https://wow.zamimg.com/images/content/short-headers/retail/categories/pvp.jpg';
    if (name.includes('darkmoon')) return 'https://wow.zamimg.com/optimized/guide-header-revamp/uploads/guide/header/692.jpg';
    if (name.includes('winter veil')) return `${cdn}/naxxramas-small.jpg`;
    if (name.includes('hallow')) return `${cdn}/castle-nathria-small.jpg`;
    if (name.includes('brewfest')) return `${cdn}/blackrock-foundry-small.jpg`;
    if (name.includes('noblegarden')) return 'https://wow.zamimg.com/optimized/guide-header-revamp/images/content/tall-headers/retail/categories/world-events-holidays.jpg';
    if (name.includes('midsummer') || name.includes('fire festival')) return `${cdn}/firelands-small.jpg`;
    if (name.includes('lunar festival')) return `${cdn}/mogushan-vaults-small.jpg`;
    if (name.includes('love is in the air')) return `${cdn}/sunwell-plateau-small.jpg`;
    if (name.includes('delves')) return `${cdn}/neltharions-lair-small.jpg`;
    if (/wow'?s?\s+(\d+\w{2}\s+)?anniversary/i.test(eventName)) return `${cdn}/molten-core-small.jpg`;
    if (name.includes('trial of style')) return `${cdn}/the-ruby-sanctum-small.jpg`;
    return null;
  }

  formatCountdown(occurrence, isActive) {
    const now = new Date();
    const target = isActive ? new Date(occurrence.end) : new Date(occurrence.start);
    const diff = target - now;
    if (diff <= 0) return isActive ? 'Ending now' : 'Starting now';

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    if (isActive) {
      const end = new Date(occurrence.end);
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return `Ends ${dayNames[end.getDay()]} ${end.getDate()} ${monthNames[end.getMonth()]}`;
    }
    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  updateCountdowns() {
    document.querySelectorAll('.event-active-countdown').forEach(el => {
      const end = el.getAttribute('data-end');
      el.textContent = this.formatCountdown({ start: el.getAttribute('data-start'), end }, true);
    });

    document.querySelectorAll('.event-upcoming-countdown').forEach(el => {
      const start = el.getAttribute('data-start');
      el.textContent = this.formatCountdown({ start, end: el.getAttribute('data-end') }, false);
    });
  }

  renderError(error) {
    if (!this.container) return;
    this.container.innerHTML = `
      <div class="events-empty">
        <i class="las la-exclamation-triangle"></i>
        <p>Error loading events</p>
        <p class="events-empty-sub">${error.message || ''}</p>
      </div>
    `;
  }

  destroy() {
    if (this.updateInterval) clearInterval(this.updateInterval);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init();
  const eventsPage = new EventsPage();
  await eventsPage.init();
  window.addEventListener('beforeunload', () => eventsPage.destroy());
});
