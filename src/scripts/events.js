// Events page - displays current and upcoming WoW events
import PageInitializer from './utils/page-initializer.js';

console.log('⚡ Events page initialized');

class EventsPage {
  constructor() {
    this.container = document.getElementById('events-content');
    this.events = [];
    this.currentEvents = [];
    this.upcomingEvents = [];
    this.updateInterval = null;
  }

  async init() {
    try {
      // Load events data
      await this.loadEvents();

      // Filter and categorize events
      this.categorizeEvents();

      // Render the page
      this.render();

      // Update countdowns every second
      this.updateInterval = setInterval(() => this.updateCountdowns(), 1000);
    } catch (error) {
      console.error('Error loading events:', error);
      this.renderError(error);
    }
  }

  async loadEvents() {
    try {
      const response = await fetch('data/events-generated.json');
      if (!response.ok) {
        throw new Error(`Failed to load events: ${response.status}`);
      }

      const data = await response.json();
      this.events = data.events || [];

      console.log(`✅ Loaded ${this.events.length} events`);
    } catch (error) {
      console.error('Failed to load events:', error);
      throw error;
    }
  }

  categorizeEvents() {
    const now = new Date();
    const twoWeeksFromNow = new Date(now.getTime() + (14 * 24 * 60 * 60 * 1000));

    this.currentEvents = [];
    this.upcomingEvents = [];

    this.events.forEach(event => {
      // Filter out placeholder events with names like [#1406]
      if (!event.name || /^\[#\d+\]$/.test(event.name)) {
        return;
      }

      if (!event.occurrences || event.occurrences.length === 0) {
        return;
      }

      // Find the most relevant occurrence
      const relevantOccurrence = event.occurrences.find(occ => {
        const start = new Date(occ.start);
        const end = new Date(occ.end);

        return end > now; // Not yet ended
      });

      if (!relevantOccurrence) {
        return;
      }

      const start = new Date(relevantOccurrence.start);
      const end = new Date(relevantOccurrence.end);

      // Categorize
      if (start <= now && end > now) {
        // Currently active
        this.currentEvents.push({ ...event, activeOccurrence: relevantOccurrence });
      } else if (start > now && start <= twoWeeksFromNow) {
        // Upcoming within 2 weeks
        this.upcomingEvents.push({ ...event, activeOccurrence: relevantOccurrence });
      }
    });

    // Sort by start date
    this.currentEvents.sort((a, b) => new Date(a.activeOccurrence.end) - new Date(b.activeOccurrence.end));
    this.upcomingEvents.sort((a, b) => new Date(a.activeOccurrence.start) - new Date(b.activeOccurrence.start));

    console.log(`📊 Current events: ${this.currentEvents.length}, Upcoming: ${this.upcomingEvents.length}`);
  }

  render() {
    if (!this.container) return;

    let html = '';

    // Current Events Section
    if (this.currentEvents.length > 0) {
      html += `
        <div class="events-section">
          <div class="section-header">
            <i class="las la-calendar-check"></i>
            <h3>Active Now (${this.currentEvents.length})</h3>
          </div>
          <div class="events-grid">
      `;

      this.currentEvents.forEach(event => {
        html += this.renderEventCard(event, 'current');
      });

      html += `
          </div>
        </div>
      `;
    }

    // Upcoming Events Section
    if (this.upcomingEvents.length > 0) {
      html += `
        <div class="events-section">
          <div class="section-header">
            <i class="las la-clock"></i>
            <h3>Starting Soon (${this.upcomingEvents.length})</h3>
          </div>
          <div class="events-grid">
      `;

      this.upcomingEvents.forEach(event => {
        html += this.renderEventCard(event, 'upcoming');
      });

      html += `
          </div>
        </div>
      `;
    }

    // No events message
    if (this.currentEvents.length === 0 && this.upcomingEvents.length === 0) {
      html = `
        <div class="empty-state">
          <i class="las la-calendar-times"></i>
          <h3>No Active Events</h3>
          <p>There are no active or upcoming events in the next 2 weeks.</p>
        </div>
      `;
    }

    this.container.innerHTML = html;
  }

  renderEventCard(event, type) {
    const isActive = type === 'current';

    // Determine display category
    let displayCategory = event.categoryName;
    if (event.name && event.name.startsWith('WoW Remix')) {
      displayCategory = 'Remix Event';
    } else if (event.name && (event.name.includes('Timewalking') || event.name.includes('Dungeon Event'))) {
      displayCategory = 'Recurring';
    } else if (event.name && event.name.includes('PvP Brawl')) {
      displayCategory = 'PvP Event';
    } else if (event.name && /WoW'?s? (\d+\w{2} )?Anniversary/i.test(event.name)) {
      displayCategory = 'Anniversary';
    } else if (event.name && event.name.includes('Bonus Event')) {
      displayCategory = 'Bonus Event';
    } else if (event.name && event.name.includes('Darkmoon Faire')) {
      displayCategory = 'Darkmoon Faire';
    } else if (event.name && event.name.includes('Cup')) {
      displayCategory = 'Racing Cup';
    } else if (event.name && /Plunderstorm|Trial of Style|Secrets of Azeroth|Turbulent Timeways/i.test(event.name)) {
      displayCategory = 'Special Event';
    }

    const categoryClass = this.getCategoryClass(event.categoryName, event.name);
    const iconClass = this.getCategoryIcon(event.categoryName, event.name);

    return `
      <div class="event-card ${categoryClass}" data-event-id="${event.id}">
        <div class="event-icon">
          <i class="${iconClass}"></i>
        </div>
        <div class="event-info">
          <h3 class="event-name">${event.name}</h3>
          <div class="event-category">${displayCategory}</div>
          <div class="event-countdown" data-end="${event.activeOccurrence.end}" data-start="${event.activeOccurrence.start}" data-type="${type}">
            ${this.formatCountdown(event.activeOccurrence, isActive)}
          </div>
        </div>
      </div>
    `;
  }

  getCategoryClass(categoryName, eventName) {
    // Check for WoW Anniversary events
    if (eventName && /WoW'?s? (\d+\w{2} )?Anniversary/i.test(eventName)) {
      return 'category-anniversary';
    }

    // Check for WoW Remix events
    if (eventName && eventName.startsWith('WoW Remix')) {
      return 'category-remix';
    }

    // Timewalking and Dungeon Events are recurring
    if (eventName && (eventName.includes('Timewalking') || eventName.includes('Dungeon Event'))) {
      return 'category-recurring';
    }

    // PvP Brawl events
    if (eventName && eventName.includes('PvP Brawl')) {
      return 'category-pvp';
    }

    // Bonus Events
    if (eventName && eventName.includes('Bonus Event')) {
      return 'category-bonus';
    }

    // Darkmoon Faire
    if (eventName && eventName.includes('Darkmoon Faire')) {
      return 'category-darkmoon';
    }

    // Racing Cups (Dragonriding)
    if (eventName && eventName.includes('Cup')) {
      return 'category-racing';
    }

    // Special Events
    if (eventName && /Plunderstorm|Trial of Style|Secrets of Azeroth|Turbulent Timeways/i.test(eventName)) {
      return 'category-special';
    }

    const categoryMap = {
      'Holidays': 'category-holiday',
      'Recurring': 'category-recurring',
      'PvP Brawl': 'category-pvp',
      'Raid': 'category-raid',
      'Dungeon': 'category-dungeon'
    };

    return categoryMap[categoryName] || 'category-other';
  }

  getCategoryIcon(categoryName, eventName) {
    // Check for WoW Anniversary events
    if (eventName && /WoW'?s? (\d+\w{2} )?Anniversary/i.test(eventName)) {
      return 'las la-birthday-cake';
    }

    // Check for WoW Remix events
    if (eventName && eventName.startsWith('WoW Remix')) {
      return 'las la-redo-alt';
    }

    // Timewalking and Dungeon Events are recurring
    if (eventName && (eventName.includes('Timewalking') || eventName.includes('Dungeon Event'))) {
      return 'las la-sync';
    }

    // PvP Brawl events
    if (eventName && eventName.includes('PvP Brawl')) {
      return 'las la-chess-knight';
    }

    // Bonus Events
    if (eventName && eventName.includes('Bonus Event')) {
      return 'las la-star';
    }

    // Darkmoon Faire
    if (eventName && eventName.includes('Darkmoon Faire')) {
      return 'las la-ticket-alt';
    }

    // Racing Cups
    if (eventName && eventName.includes('Cup')) {
      return 'las la-flag-checkered';
    }

    // Special Events
    if (eventName && /Plunderstorm|Trial of Style|Secrets of Azeroth|Turbulent Timeways/i.test(eventName)) {
      return 'las la-bolt';
    }

    const iconMap = {
      'Holidays': 'las la-gift',
      'Recurring': 'las la-sync',
      'PvP Brawl': 'las la-chess-knight',
      'Raid': 'las la-dragon',
      'Dungeon': 'las la-dungeon'
    };

    return iconMap[categoryName] || 'las la-calendar';
  }

  formatCountdown(occurrence, isActive) {
    const now = new Date();
    const targetDate = isActive ? new Date(occurrence.end) : new Date(occurrence.start);
    const diff = targetDate - now;

    if (diff <= 0) {
      return isActive ? 'Ending soon' : 'Starting now';
    }

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

    const parts = [];

    if (days > 0) {
      parts.push(`${days}d`);
    }
    if (hours > 0 || days > 0) {
      parts.push(`${hours}h`);
    }
    if (days === 0) {
      parts.push(`${minutes}m`);
    }

    const timeString = parts.join(' ');
    return isActive ? `Ends in ${timeString}` : `Starts in ${timeString}`;
  }

  updateCountdowns() {
    const countdownElements = document.querySelectorAll('.event-countdown');

    countdownElements.forEach(el => {
      const end = el.getAttribute('data-end');
      const start = el.getAttribute('data-start');
      const type = el.getAttribute('data-type');
      const isActive = type === 'current';

      const occurrence = { start, end };
      el.textContent = this.formatCountdown(occurrence, isActive);
    });
  }

  renderError(error) {
    if (!this.container) return;

    this.container.innerHTML = `
      <div class="empty-state error-state">
        <i class="las la-exclamation-triangle"></i>
        <h3>Error Loading Events</h3>
        <p>${error.message || 'An error occurred while loading events.'}</p>
        <button class="btn-primary" onclick="window.location.reload()">Try Again</button>
      </div>
    `;
  }

  destroy() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
    }
  }
}

// Initialize everything when DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init();

  // Initialize events page
  const eventsPage = new EventsPage();
  await eventsPage.init();

  // Clean up on page unload
  window.addEventListener('beforeunload', () => {
    eventsPage.destroy();
  });
});
