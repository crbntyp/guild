import PageInitializer from './utils/page-initializer.js';
import PageHeader from './components/page-header.js';

document.addEventListener('DOMContentLoaded', async () => {
  await PageInitializer.init();

  const container = document.getElementById('changelog-container');
  container.innerHTML = `
    ${PageHeader.render({
      className: 'changelog',
      title: 'Changelog',
      description: 'Everything we\'ve built, from day one to today.'
    })}

    <div class="changelog-content">

      <div class="changelog-entry">
        <div class="changelog-date">April 2026</div>
        <h3 class="changelog-title">Raid & Dungeon Loot Browser</h3>
        <p>Browse every piece of loot from every raid and dungeon across all expansions. Over 15,000 items with icons, boss names, and collection tracking. Filter by expansion, instance, and armor type. Click any item for details and add missing pieces to your todo list.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Transmog Set Collection Tracker</h3>
        <p>Track every class tier set across every expansion. See which pieces you own, which you're missing, and exactly where to farm them — boss names, raid locations, and direct Wowhead tooltips on every item. Four tabs: Raid Sets, Armor Sets, Raid Loot, and Dungeon Loot. Reputation items show faction and standing required. Add missing pieces to your todo list with one click.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
          <span class="changelog-tag">Database</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">My Account Hub</h3>
        <p>A new landing page for all your account features. See your characters, crafters, vault, mounts, todos, and YouTube in one place — with live stats like character count and vault rewards. The navigation dropdown now opens on hover for quicker access.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Railway Removed — Full VPS Migration</h3>
        <p>Moved all backend services to a single server. Authentication, data storage, and API proxies now run on one machine. Removed an external dependency and simplified the entire stack.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Infrastructure</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Events Page Redesign</h3>
        <p>Completely rebuilt the events page. Active events show as cards with progress bars. Upcoming events use a clean timeline layout. A "Popular Events Coming Later" section ranks the most anticipated events by community interest. Dates adjusted for EU servers.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Redesign</span>
          <span class="changelog-tag">Events</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Weekly Vault Tracker</h3>
        <p>See which of your characters have vault rewards ready — without logging into each one. Tracks raids, M+ keys, and delves across all your alts. Shows progress towards each vault slot with colour-coded badges and a progress bar.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
          <span class="changelog-tag">Database</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Crafters Overview</h3>
        <p>A new page showing every profession across all your characters. See skill levels, expansion tiers, and progress bars at a glance. No more switching between alts to remember who crafts what.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Visual Rebrand</h3>
        <p>Complete visual overhaul. Midnight raid zone art as backgrounds across the site. New purple accent colour throughout. Battle.net blue for login buttons. Frosted glass effects on navigation and search. Dark, clean, and consistent.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Design</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Raid Signup System</h3>
        <p>Organise raids through Discord. A bot creates events with a slash command, and guild members sign up on the website — choosing their character, spec, and role. Includes a reserve bench that auto-promotes when spots open. Real-time notifications back to Discord when people sign up or withdraw.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
          <span class="changelog-tag">Discord</span>
          <span class="changelog-tag">Database</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Home Page Redesign</h3>
        <p>The landing page now shows what the app can do. Live demo cards with real character renders, example raid signups, and previews of the crafters and vault features. Search any guild directly from the hero section.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Redesign</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">March 2026</div>
        <h3 class="changelog-title">Midnight Expansion Update</h3>
        <p>Full support for the Midnight expansion. New Haranir race with icons. Devourer spec for Demon Hunters. Three new raids with zone imagery. Season 17 Mythic+ with 8 new dungeons. Handles the item level squish so old characters don't break the sorting.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Expansion</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">December 2025</div>
        <h3 class="changelog-title">Character Modal Upgrade</h3>
        <p>Click any character to see their full gear with item icons and quality colours. A new Mythic+ tab shows their dungeon runs, key levels, and timer performance. Full-size character renders available in a lightbox view.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Enhancement</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">November 2025</div>
        <h3 class="changelog-title">Mount Collection</h3>
        <p>Browse your mount collection organised by expansion. Each mount links to its Wowhead page. Tab-based navigation with smooth scrolling. Shows only the mounts you actually own, matched against a database of over 1,500 mounts.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">November 2025</div>
        <h3 class="changelog-title">Events Calendar</h3>
        <p>Live event tracking scraped from community data. Shows what's active now and what's coming in the next two weeks. Auto-refreshes daily so events stay up to date without any manual work.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">October 2025</div>
        <h3 class="changelog-title">Mythic+ Leaderboards</h3>
        <p>Real-time leaderboards showing the top runs for every dungeon. Includes a meta composition breakdown — which specs are dominating tanks, healers, and DPS. Filter by dungeon, see full group compositions, and track what's popular this season.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">September 2025</div>
        <h3 class="changelog-title">YouTube Curation</h3>
        <p>Add your favourite WoW content creators and filter their videos by tag. Watch videos in-app without leaving the page. Channels sync across devices so your list follows you.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">September 2025</div>
        <h3 class="changelog-title">Personal Todos</h3>
        <p>A simple task board for your WoW to-do list. Paste a URL and it auto-fills the title and image. Cards arrange in a masonry grid. Syncs across devices so you can add a reminder on desktop and check it on your phone.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">August 2025</div>
        <h3 class="changelog-title">Background Gallery</h3>
        <p>A rotating collection of high-quality Warcraft zone screenshots. Changes every 8 seconds with smooth fade transitions. Each image shows the location name. Download any screenshot you like.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">August 2025</div>
        <h3 class="changelog-title">My Characters</h3>
        <p>View all your characters across every realm in one place. See class, race, spec, item level, and guild rank. Same filtering and sorting as the guild roster — but for your entire account.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">New Feature</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">July 2025</div>
        <h3 class="changelog-title">Battle.net Login</h3>
        <p>Secure login through Battle.net. No passwords stored — authentication handled entirely through Blizzard's official system. Unlocks personal features like character lists, mounts, todos, and YouTube channels.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Foundation</span>
        </div>
      </div>

      <div class="changelog-entry">
        <div class="changelog-date">July 2025</div>
        <h3 class="changelog-title">Guild Roster — Where It All Started</h3>
        <p>The original feature. Search any guild on EU or US servers and browse their roster. Character cards show avatars, class colours, specs, races, and item levels. Click any character for a detailed breakdown of their gear.</p>
        <div class="changelog-tags">
          <span class="changelog-tag">Foundation</span>
          <span class="changelog-tag">v1.0</span>
        </div>
      </div>

    </div>
  `;
});
