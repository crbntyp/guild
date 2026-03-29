# gld__

A modern World of Warcraft companion application featuring guild roster management, character tracking, mount collection browsing, live event calendar, YouTube video curation, personal todos, M+ leaderboard and comp stat tracking, and a stunning background gallery. Built with vanilla JavaScript and the Battle.net API.

**Now updated for the Midnight expansion** — includes new Haranir race, Devourer Demon Hunter spec, Midnight raids, Season 17 Mythic+ dungeons, and ilvl squash handling.

## 📸 Screenshots

<div align="center">
  <img src="src/gitimgs/logo-guild.png" alt="Guild Logo" width="60%">
</div>

<p align="center">
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.21.52.png" width="49%" />
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.22.54.png" width="49%" />
</p>

<p align="center">
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.24.29.png" width="49%" />
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.25.03.png" width="49%" />
</p>

<p align="center">
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.26.40.png" width="49%" />
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.26.51.png" width="49%" />
</p>

<p align="center">
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.27.28.png" width="49%" />
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.27.37.png" width="49%" />
</p>

<p align="center">
  <img src="src/gitimgs/Screenshot 2025-11-15 at 21.27.52.png" width="49%" />
</p>

## ✨ Features

### 🔐 Battle.net Authentication
- OAuth 2.0 integration with full-page redirect login
- Secure token management with automatic refresh
- Protected routes for personalized features

### 👥 Guild Roster
- Real-time guild data from Battle.net API
- **Cross-realm support** - displays characters from multiple connected realms
- Character cards with Battle.net portrait renders
- Class-colored styling throughout
- Detailed character information:
  - Class, race (gender-specific icons), specialization, faction
  - Item level and equipment stats
  - Realm badges
- Advanced filtering and sorting:
  - Search by name or class
  - Sort by item level, rank, name, level, or class
  - Custom dropdown components with counts
- **Character Modal** - Click any character for detailed view:
  - Full equipment display with quality-colored borders
  - Item icons with hover tooltips
  - Character stats and specialization
  - **Mythic+ Progression Tab** - Current season dungeon stats with key level, time, and timer bonus
  - Interactive modal with backdrop blur

### 🎬 YouTube Video Manager (Auth Required)
- Curate favorite Warcraft YouTube channels
- Automatic video fetching from YouTube Data API v3
- Filter videos by custom search tags
- **Video Modal** - Click any video to watch in-app:
  - Centered modal player (16:9 aspect ratio)
  - Auto-play with easy close
  - Stops video on modal close
- Horizontal scrolling video rows per channel
- Edit channels and manage tags
- Auto-cleanup of videos older than 30 days
- Backend database persistence with cross-device sync

### ✅ Personal Todos (Auth Required)
- Personal task management with backend database persistence
- Auto-fill metadata from URLs (title, description, images)
- Masonry grid layout for dynamic card heights
- Edit, complete, and organize tasks
- Image previews from Open Graph metadata
- Per-user data synced across devices

### 🎨 Background Gallery
- Curated collection of high-quality Warcraft screenshots
- Automatic rotation every 8 seconds with smooth fade transitions
- Location names with attribution
- Download functionality for each background

### 👤 My Characters (Auth Required)
- View all your WoW characters across realms
- Guild rank display for guild members
- Same advanced filtering as guild roster
- Quick access to character details
- **Full-Size Image Preview** - Magnify icon opens lightbox with full-body 3D render

### 🐎 My Mounts (Auth Required) **NEW!**
- Browse your personal mount collection
- **Tab-Based UI** - Navigate by expansion with smooth scrolling arrows
- **Wowhead Integration** - Icons link directly to Wowhead pages with tooltips on hover
- **High-Quality Icons** - Automatically upgraded from .gif to .jpg for crisp display
- **Spell ID Mapping** - Automated scraper builds accurate mount→spell ID database
- Organized by expansion (Classic through The War Within)
- Only displays mounts you own (matched against database of 1,481 cataloged mounts)
- Static database generation (no repeated API calls)

### 👤 My Account Hub (Auth Required)
- Central landing page for all account features
- Feature cards with icons, descriptions, and live stats
- Character count and vault reward count pulled from the database
- Quick navigation to all sub-features

### 🔨 Crafters (Auth Required)
- Cross-character profession overview across all your alts
- Expansion tier breakdown with skill progress bars
- Priority sorting (Midnight professions first)
- Character avatars with class-colored names
- Filters out unused professions (skill <= 1)

### 🎁 Weekly Vault (Auth Required)
- Track vault reward progress across all characters without logging each one
- Three vault categories: Raids (2/4/6 bosses), M+ Keys (1/4/8 runs), Delves (2/4/8)
- Colour-coded badges: active (reward ready), inactive (grey), partial progress (coloured dot)
- Progress bar showing total vault slots unlocked as percentage
- Highest M+ key level displayed on dungeon badge
- Snapshot-based tracking with MySQL — baselines saved at weekly reset (Wednesday 05:00 UTC)
- Achievement statistics API for delve and raid boss timestamps
- Sorted by most active characters first

### 🏆 Mythic+ Leaderboards
- Real-time Mythic+ leaderboard data from Battle.net API
- **Meta Composition Showcase** - Visual display of top performing specs:
  - Top tank, healer, and 3 DPS specializations
  - Percentage-based popularity indicators
  - Class and spec icon combination display
- **Specialization Statistics** - Detailed breakdown by role:
  - Tank, Healer, and DPS categories
  - Spec icons alongside class icons
  - Percentage distribution and player counts
  - Analyzed from top 8 runs per dungeon
- **Dungeon Grid** - Quick overview of all dungeons:
  - Top keystones for each dungeon
  - Group composition with class colors
  - Key level and completion times
- **Detailed Leaderboard** - Filterable by dungeon:
  - Top 50 runs per dungeon
  - Full party composition display
  - Affixes and completion times
- Smart 404 filtering for out-of-rotation dungeons
- Automatic data refresh and caching

### 📅 Upcoming Events **NEW!**
- Live event calendar scraped from Wowhead
- **Real-time Tracking** - Shows current and upcoming events (next 2 weeks)
- **Live Countdowns** - Auto-updating timers showing time remaining
- **Smart Categorization** - 11 color-coded event types:
  - 🎂 Anniversary - WoW's birthday celebrations
  - 🔄 Remix Events - Limited-time remix content
  - 🔁 Recurring - Timewalking and weekly dungeon events
  - ⚔️ PvP Events - Battleground brawls and arenas
  - 🎁 Holidays - Seasonal celebrations
  - ⭐ Bonus Events - Weekly rotating bonus rewards
  - 🎪 Darkmoon Faire - Monthly carnival
  - 🏁 Racing Cups - Dragonriding competitions
  - ⚡ Special Events - Unique limited-time events
  - 🏰 Raids/Dungeons - End-game PvE content
- **Static Database** - 177 events generated from Wowhead data
- **No Auth Required** - Available to all visitors
- Automatic filtering of placeholder/invalid events

## 🏗️ Architecture

### Modern Component-Based Design
- **Reusable Components**: PageHeader, FormModal, VideoModal, CharacterModal, CustomDropdown
- **Base Classes**: ItemManager for shared CRUD operations
- **Centralized Services**: CacheService, AuthService, GuildService, CharacterService
- **Utility Functions**: WoW constants, icon loading, page initialization
- **SCSS Mixins**: Shared styling patterns for consistency

### Smart Caching & Persistence System
- **API Cache**: Memory + LocalStorage dual-layer caching for Battle.net API data
- **User Data**: Backend database with LocalStorage fallback for todos/channels
- **Per-user storage**: Data keyed by Battle.net Battletag for multi-account support
- TTL-based expiration (5-15 minutes for API data)
- Automatic cleanup of expired cache entries
- Batch API request optimization

### Performance Optimizations
- Lazy loading of character data
- Smart 404 filtering for deleted characters
- Debounced search and filter operations
- Minimal redundant API calls
- Component-specific responsive styles

## 🛠️ Tech Stack

**Frontend**
- Vanilla JavaScript (ES6 Modules)
- SCSS with component-based architecture
- Masonry.js for grid layouts
- Line Awesome icons

**APIs**
- Battle.net REST API (OAuth, Guild, Character data)
- YouTube Data API v3
- Open Graph Metadata API

**Backend**
- PHP API on Hostinger VPS (same-origin at `/gld/api/`)
- MySQL 8.0 database (raids, raid_signups, vault_snapshots)
- BNet OAuth token verification via `oauth.battle.net/userinfo`
- Discord.js bot with `/raid` slash command (systemd service)
- Internal webhook (port 3002) for PHP-to-Discord notifications
- Node.js + Express OAuth proxy
- Per-user data storage (keyed by BNet user ID)

**Build Tools**
- Sass compiler
- CPX for file operations
- npm scripts for build automation

## 📁 Project Structure

```
src/
├── scripts/
│   ├── api/
│   │   ├── battlenet-client.js     # Battle.net OAuth & API wrapper
│   │   └── wow-api.js               # WoW-specific API endpoints
│   ├── services/
│   │   ├── auth.js                  # OAuth authentication
│   │   ├── cache-service.js         # Caching with TTL
│   │   ├── guild-service.js         # Guild data management
│   │   ├── character-service.js     # Character data
│   │   ├── account-service.js       # User account/characters
│   │   ├── icon-loader.js           # Icon loading with fallbacks
│   │   └── raid-service.js          # Raid signup API client
│   ├── components/
│   │   ├── top-bar.js               # Navigation
│   │   ├── guild-roster.js          # Roster display
│   │   ├── character-modal.js       # Character detail modal
│   │   ├── character-card.js        # Reusable character cards
│   │   ├── video-modal.js           # YouTube video player modal
│   │   ├── form-modal.js            # Generic form modal
│   │   ├── todo-manager.js          # Todo CRUD with backend sync
│   │   ├── youtube-manager.js       # YouTube channel management with backend sync
│   │   ├── item-manager.js          # Base class with dual-layer persistence
│   │   ├── custom-dropdown.js       # Dropdown UI component
│   │   ├── page-header.js           # Reusable page headers
│   │   ├── background-rotator.js    # Background rotation
│   │   ├── raid-manager.js          # Raid list/management UI
│   │   ├── raid-card.js             # Raid card renderer
│   │   ├── signup-modal.js          # Raid signup modal
│   │   └── footer.js                # Footer component
│   ├── utils/
│   │   ├── wow-constants.js         # WoW classes, races, colors
│   │   ├── wow-icons.js             # Icon URL generation
│   │   ├── item-quality.js          # Item quality colors/names
│   │   ├── helpers.js               # Utility functions
│   │   ├── config-utils.js          # Config helpers
│   │   └── page-initializer.js      # Page setup utility
│   ├── data/
│   │   ├── backgrounds.js           # Background image metadata
│   │   ├── generated-mount-data.js  # Mount database loader
│   │   └── mount-data.js            # Mount data utilities
│   ├── main.js                      # Guild roster page
│   ├── gallery.js                   # Gallery page
│   ├── events.js                    # Events calendar page
│   ├── my-todos.js                  # Todos page
│   ├── my-youtube.js                # YouTube page
│   ├── my-characters.js             # My characters page
│   ├── my-mounts.js                 # My mounts page
│   ├── mythic-plus.js               # Mythic+ leaderboards page
│   ├── my-crafters.js               # Crafters page
│   ├── my-vault.js                  # Weekly vault page
│   ├── raids.js                     # Raid signups page
│   ├── my-account.js                # Account hub page
│   ├── changelog.js                 # Changelog page
│   └── config.js                    # App configuration
├── styles/
│   ├── _mixins.scss                 # Shared mixins
│   ├── base/                        # Base styles & variables
│   ├── components/                  # Component styles
│   ├── layout/                      # Layout components
│   ├── pages/                       # Page-specific styles
│   └── main.scss                    # Main stylesheet
├── img/bgs/                         # Background images
├── assets/                          # Icons and fonts
├── index.html                       # Guild roster
├── gallery.html                     # Gallery
├── events.html                      # Events calendar
├── my-todos.html                    # Todos
├── my-youtube.html                  # YouTube
├── my-characters.html               # My characters
├── my-mounts.html                   # My mounts
├── my-crafters.html                 # Crafters
├── my-vault.html                    # Weekly vault
├── raids.html                       # Raid signups
├── my-account.html                  # Account hub
├── changelog.html                   # Changelog
└── mythic-plus.html                 # Mythic+ leaderboards

src/api/
├── config.php                       # DB connection, CORS, BNet token verification
├── raids.php                        # List/create raids
├── raid.php                         # Single raid with signups
├── signup.php                       # Signup/update/withdraw
├── vault.php                        # Vault snapshot get/save
├── auth-token.php                   # OAuth token exchange
├── todos.php                        # Todos CRUD
├── youtube.php                      # YouTube channels CRUD
├── youtube-fetch.php                # YouTube API proxy
├── metadata.php                     # Open Graph metadata proxy
└── setup.sql                        # Database schema

discord-bot/
├── bot.js                           # Discord bot with /raid command
└── config.js                        # Bot configuration

data/
├── mounts-generated.json            # Generated mount database (1,481 mounts)
└── events-generated.json            # Generated events database (177 events)

scripts/
├── generate-mount-data.js           # Mount database generator script
└── generate-events-data.js          # Events database generator script

server.cjs                           # Express backend
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14+)
- npm
- Battle.net Developer Account

### Installation

```bash
# Clone the repository
git clone <repository-url>
cd guild

# Install dependencies
npm install
```

### Configuration

Update `src/scripts/config.js` with your guild details:
```javascript
guild: {
  realm: 'tarren-mill',
  name: 'your-guild-name',
  realmSlug: 'tarren-mill',
  nameSlug: 'your-guild-name'
}
```

**Security Note**: For production, move API credentials to environment variables.

### Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Clean dist folder
npm run clean
```

The dev server runs at `http://localhost:8080` with auto-reload.

## 🎯 Build Commands

```bash
npm run build           # Build everything
npm run build:scss      # Compile SCSS
npm run build:html      # Copy HTML files
npm run build:js        # Copy JavaScript
npm run build:img       # Copy images
npm run build:assets    # Copy assets
npm run build:fonts     # Copy fonts
npm run generate:mounts # Generate mount database from Battle.net API
npm run generate:events # Generate events database from Wowhead
```

## 🔌 API Integration

### Backend API Endpoints
**User Data (Authenticated)**
- `GET /api/user/todos` - Fetch user's todos
- `POST /api/user/todos` - Save/update user's todos
- `GET /api/user/youtube` - Fetch user's YouTube channels
- `POST /api/user/youtube` - Save/update user's YouTube channels

**Metadata Services**
- `POST /api/fetch-metadata` - Fetch Open Graph metadata from URLs
- `POST /api/fetch-youtube` - Fetch YouTube channel videos

### Battle.net API Endpoints
- `/oauth/token` - Authentication
- `/data/wow/guild/{realm}/{guild}/roster` - Guild roster
- `/profile/wow/character/{realm}/{character}` - Character profile
- `/profile/wow/character/{realm}/{character}/equipment` - Equipment
- `/profile/wow/character/{realm}/{character}/character-media` - Character images
- `/profile/wow/character/{realm}/{character}/specializations` - Specs
- `/profile/wow/character/{realm}/{character}/collections/mounts` - Mount collection
- `/data/wow/mount/{mountId}` - Mount data (used in generation script)
- `/data/wow/media/creature-display/{displayId}` - Mount 3D renders (used in generation script)

### Data Persistence Strategy
- **User Data (Todos/Channels)**: Backend database with localStorage fallback
- **API Cache**: Memory cache + localStorage with TTL expiration
- **Guild roster**: 10 minutes cache
- **Character profiles**: 15 minutes cache
- **Equipment**: 15 minutes cache
- **OAuth tokens**: Until expiry (~24 hours)

### Rate Limiting
The app implements smart caching and batch requests to stay within API rate limits.

## 🎨 Customization

### Change Guild
Edit `src/scripts/config.js`:
```javascript
guild: {
  realm: 'your-realm',
  name: 'Your Guild Name'
}
```

### Update Theme
Edit `src/styles/base/_variables.scss`:
```scss
:root {
  --color-primary: #0078FF;
  --color-bg: #1a1a1a;
}
```

### Class Colors
WoW class colors are centralized in `src/scripts/utils/wow-constants.js` using official Blizzard colors.

## 📦 Recent Improvements

### Code Consolidation
- **~530+ lines removed** through refactoring
- Eliminated duplicate code patterns
- Removed 10 unused files
- Centralized WoW constants and caching logic
- Created reusable SCSS mixins

### Component Architecture
- Migrated to component-based design
- Created base classes for shared functionality
- Implemented modal pattern for character and video viewing
- Built reusable form and dropdown components

### Performance
- Dual-layer caching with backend persistence
- Smart 404 filtering for deleted characters
- Batch API requests to reduce rate limiting
- Cross-device data synchronization
- ~18-20% CSS size reduction

## 📋 Changelog

### 2026-03-29 — Account Hub, Events Redesign & Infrastructure

- **My Account Hub** 👤
  - Landing page for all account features with live stats
  - Character count and vault reward count displayed on cards
  - Navigation dropdown opens on hover for faster access
  - Mobile menu updated with clickable My Account link

- **Events Page Redesign** 📅
  - Active events as cards with progress bars showing duration
  - Upcoming events in compact timeline rows with date, icon, countdown
  - "Popular Events Coming Later This Year" ranked by community interest
  - End dates instead of countdowns (avoids US/EU timing issues)
  - EU server time offset (+23h from Wowhead data)
  - Low-popularity events filtered out, deduplicated by name

- **Full VPS Migration** 🔧
  - Todos and YouTube moved from Railway to PHP/MySQL on VPS
  - OAuth token exchange now handled by PHP (auth-token.php)
  - Metadata proxy and YouTube fetch proxy on VPS
  - Railway dependency fully removed
  - Todos: 90-day auto-cleanup, YouTube: 20-channel limit, 30-day video cleanup

- **Changelog Page** 📝
  - Full feature history from v1.0 to present
  - Linked from footer on every page

### 2026-03-28 — Crafters & Weekly Vault

- **Crafters Page** 🔨
  - Cross-character profession overview showing all alts
  - Expansion tier breakdown with purple/green skill progress bars
  - Character avatars from character-media API
  - Priority sorting: Midnight expansion tiers first
  - Filters out unused professions (skill <= 1)

- **Weekly Vault Page** 🎁
  - Scans all level 90+ characters for vault activity
  - Three categories: Raids (2/4/6), M+ Keys (1/4/8), Delves (2/4/8)
  - Inset character renders from character-media API
  - Colour-coded badges with active/inactive/partial progress states
  - Coloured dot indicator for partial progress (e.g. 1/2 raid bosses)
  - Progress bar with gradient showing total vault slots as percentage
  - Highest M+ key level on dungeon badge
  - MySQL snapshot system for weekly baseline tracking
  - Wednesday 05:00 UTC reset cycle (EU servers)
  - INSERT IGNORE preserves baseline — first load of week sets the benchmark
  - Achievement statistics API for delve count and raid boss timestamps
  - Sorted by most active characters first

- **Homepage Updates** 🏠
  - Added Crafters + Vault dual preview section
  - "Stop Alt-Tabbing, Start Playing" heading with real crafter progress bars and vault badges
  - Both cards link to respective pages with BNet Login chip

### 2026-03-27 — Visual Rebrand & Raid Signup System

- **Raid Signup System** ⚔️
  - MySQL database with raids and raid_signups tables
  - PHP API with BNet OAuth token verification
  - Discord bot with `/raid` slash command for raid creation
  - Raid cards with zone imagery, difficulty badges, countdowns, progress bars
  - Role-based signups with tank/healer/DPS caps
  - Reserve/overflow system — auto-promotes first reserve of same role on withdrawal
  - Discord notifications on signup, withdrawal, and raid full
  - Server-scoped raids via Discord guild ID
  - Smart landing page: detects Discord context, shows personalised welcome
  - Marketing landing page with demo raid cards for unauthenticated visitors
  - Admin raid deletion (server-side auth check)
  - Bot invite link for adding to Discord servers

- **Home Page Redesign** 🏠
  - Full marketing landing with hero section, feature showcase
  - Demo character cards with real Blizzard renders, class/race/spec icons
  - Demo raid cards carousel
  - 4-column "Other Features" grid with BNet login chips
  - Full-width guild search form
  - Removed old logo/info panel
  - Renamed Guild Finder to Home in navigation

- **Visual Identity Overhaul** 🎨
  - Midnight raid zone art as default backgrounds site-wide (except gallery)
  - Global dark background filter (brightness 0.3) for readability
  - Purple void accent (#a335ee) replacing red throughout
  - Battle.net blue (#00AEFF) for login/logout buttons
  - White glass style for search and action buttons
  - Modernised header: white active links, frosted glass buttons
  - Modernised todos, YouTube, and page header styles
  - Fixed bottom-right widget with token price and rotating realm statuses

- **Events Page Overhaul** 📅
  - WoW-themed icons from Wowhead CDN for all event types
  - Zone art banners on event cards (PvP, Darkmoon, timewalking, holidays)
  - Expansion-specific icons for timewalking events (BC, WotLK, Cata, MoP, Legion)
  - Filtered raid instances from events (handled on raids page)
  - Daily auto-refresh cron job at 6am UK time on VPS
  - Fixed Wowhead occurrence format change

- **Midnight Mounts** 🐎
  - Added 97 new Midnight expansion mounts (1578 total)
  - Expansion 11 (Midnight) ID range and tab
  - Incremental mount fetch (only new mounts, merged with existing)
  - Spell ID mappings for Wowhead tooltip integration

- **Auth-Required Pages** 🔐
  - Unified "Authentication Required" view across all protected pages
  - Battle.net blue login button instead of redirect
  - Pages reload on auth state change
  - No headers or content exposed when unauthenticated

### 2026-03-25 — Midnight Expansion Update
- **New Race: Haranir** 🦌
  - Added Haranir race support (IDs 86, 91) with male and female icons
  - Added missing Earthen second faction ID (85)
  - Fixed Dracthyr race ID 70 (was incorrectly labelled as Earthen)

- **New Spec: Devourer** 😈
  - Added Demon Hunter Devourer spec (ID 1480) with void icon
  - Updated Mythic+ spec ID list to include Devourer

- **Midnight Raids** ⚔️
  - Added The Voidspire (6 bosses), March on Quel'Danas (2 bosses), and The Dreamrift (1 boss)
  - Raid imagery loads automatically via Blizzard journal instance API

- **Mythic+ Season 17 (Midnight Season 1)** 🏆
  - Updated character modal and mythic-plus page for new season
  - 8 dungeons: Windrunner Spire, Magisters' Terrace, Nexus-Point Xenas, Maisara Caverns, Skyreach, Seat of the Triumvirate, Algeth'ar Academy, Pit of Saron
  - Background imagery mapped for all dungeons
  - Redesigned dungeon cards — key level badge with stacked name and time

- **Item Level Squash Handling** 📊
  - Characters not logged in since Midnight launch (March 2, 2026) are deprioritized in ilvl sort
  - Uses `last_login_timestamp` from character profiles to detect stale data
  - Loads ilvl for ALL roster members (not just current page) for accurate sorting
  - Complete enriched data cached to localStorage for instant subsequent loads

- **Bug Fixes** 🔧
  - Fixed Enhancement Shaman spec icon (was showing Elemental icon)
  - Fixed ilvl sorting across paginated pages
  - Fixed characters disappearing when profile API returns 404
  - Fixed cascading re-render loop when loading ilvl data

### 2025-12-17
- **Character Modal Enhancements** 🔍
  - Added full-size character image preview (magnify icon opens lightbox with full-body 3D render)
  - Added Mythic+ Progression tab to character modal
  - Shows current season dungeons with key level, completion time, and timer bonus
  - Rating display with Blizzard color scheme
  - Dungeon cards with background images from journal instance media
  - Characters with no M+ activity show all dungeons with placeholder values

### 2025-11-15
- **My Mounts Feature** 🐎
  - Added personal mount collection viewer
  - Tab-based UI for browsing by expansion with scroll arrows
  - Lazy loading with shimmer placeholder (no flash on slow connections)
  - Per-tab progress tracking for image loading
  - Faction icons (Alliance/Horde) and source badges on each mount
  - 3D render images from Battle.net CDN with fallback handling
  - Static mount database generation script (1,481 mounts cataloged)
  - ID-based heuristics for expansion categorization
  - Frosted glass mount name overlays
  - Only displays mounts you own (matched against full database)

### 2025-10-27
- **Guild Search Improvements**
  - Updated realm field with clearer placeholder text ("Realm (e.g tarren-mill)")
  - Fixed callback registration bug preventing guild searches from executing
  - Removed unused guild search API code (Battle.net API limitation)

- **Wowhead Tooltip Integration**
  - Added bonus list parameters for accurate item level display
  - Added explicit ilvl parameter to Wowhead tooltips
  - Fixed incorrect item level display issues on upgraded gear

- **Page Header Enhancements**
  - Repositioned action buttons to appear beside page headings
  - Updated page header layout across Todos and YouTube pages
  - Improved button sizing (reduced height from 40px to 30px, padding optimized)

- **Bug Fixes**
  - Fixed sessionStorage override issue that cleared search callbacks
  - Resolved character modal Wowhead tooltip accuracy issues

## 🔮 Future Enhancements

- Discord bot webhook notifications (signup reminders, raid full alerts)
- World activity tracking for vault (world bosses, world quests)
- Migrate todos/YouTube to MySQL (90-day TTL for todos, 20 channel limit)
- Guild achievements and progression tracking
- PvP ratings display
- Member activity tracking
- Guild bank viewer

## 📝 License

ISC

## 🙏 Credits

- **API**: Battle.net / Blizzard Entertainment
- **Framework**: Carbontype by Jonny Pyper
- **Icons**: Line Awesome, Wowhead CDN
- **Guild**: Geez-yer-shoes-n-jaykit (Tarren Mill EU)

## 📚 Resources

- [Battle.net API Documentation](https://develop.battle.net/documentation)
- [WoW API Forums](https://us.forums.blizzard.com/en/blizzard/c/api-discussion)
- [YouTube Data API](https://developers.google.com/youtube/v3)

---

Built with ⚔️ for the Horde
