# Guild Application - Development Context

## Application Overview

**My Personal Warcraft** is a modern World of Warcraft companion application built for the **Geez-yer-shoes-n-jaykit** cross-realm guild on EU Tarren Mill. The application provides guild roster management, character tracking, Mythic+ leaderboards, personal todos, YouTube video curation, and a WoW screenshot gallery.

**Tech Stack:** Vanilla JavaScript (ES6 Modules), SCSS, Node.js/Express, Battle.net API, YouTube Data API

**Live URL:** https://carbontype.co/guild/
**Backend:** Railway-hosted OAuth proxy and user data persistence server

---

## Architecture Overview

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Frontend (SPA)                          │
│  - Vanilla JavaScript ES6 Modules                            │
│  - SCSS Component-Based Styling                              │
│  - Battle.net OAuth (Popup-based on Desktop)                 │
└──────────────────┬──────────────────────────────────────────┘
                   │
                   ├─ Battle.net API (Guild, Character Data)
                   ├─ YouTube Data API v3 (Channel Videos)
                   │
┌──────────────────▼──────────────────────────────────────────┐
│              Backend (Express Server)                        │
│  - OAuth Proxy (Battle.net token exchange)                   │
│  - User Data Persistence (JSON files)                        │
│  - Metadata Fetcher (Open Graph, YouTube)                    │
└─────────────────────────────────────────────────────────────┘
```

### Data Flow

1. **Authentication Flow:**
   - User clicks "Login with Battle.net"
   - Desktop: Opens popup window → Battle.net OAuth → Callback with code
   - Mobile: Full page redirect → Battle.net OAuth → Callback with code
   - Frontend sends code to backend `/api/auth/token`
   - Backend exchanges code for access token (hides client secret)
   - Token stored in localStorage with expiry timestamp

2. **Guild Roster Flow:**
   - Frontend requests guild roster from Battle.net API
   - CacheService checks memory cache → localStorage → API call
   - Character data lazy-loaded as needed
   - 404 errors filtered (deleted characters)
   - Data cached for 10-15 minutes

3. **User Data Flow (Todos/YouTube Channels):**
   - **Dual-layer persistence:** Backend database (primary) + localStorage (fallback)
   - On load: Try backend first (if authenticated) → fallback to localStorage
   - On save: Instant localStorage write → async backend sync
   - Data keyed by Battle.net Battletag for multi-account support

---

## Project Structure

```
guild/
├── src/                          # Source files (development)
│   ├── scripts/
│   │   ├── api/                  # API clients
│   │   │   ├── battlenet-client.js    # Battle.net API wrapper
│   │   │   └── wow-api.js             # WoW-specific endpoints
│   │   ├── services/             # Core services
│   │   │   ├── auth.js                # OAuth authentication
│   │   │   ├── cache-service.js       # Dual-layer caching
│   │   │   ├── guild-service.js       # Guild data management
│   │   │   ├── character-service.js   # Character data
│   │   │   ├── account-service.js     # User account/characters
│   │   │   ├── icon-loader.js         # Icon loading with fallbacks
│   │   │   └── custom-tooltip.js      # Wowhead tooltip integration
│   │   ├── components/           # Reusable UI components
│   │   │   ├── item-manager.js        # Base class for CRUD managers
│   │   │   ├── todo-manager.js        # Todo management
│   │   │   ├── youtube-manager.js     # YouTube channel management
│   │   │   ├── guild-roster.js        # Roster display
│   │   │   ├── character-card.js      # Character card component
│   │   │   ├── character-modal.js     # Character detail modal
│   │   │   ├── video-modal.js         # YouTube video player modal
│   │   │   ├── form-modal.js          # Generic form modal
│   │   │   ├── custom-dropdown.js     # Dropdown UI component
│   │   │   ├── page-header.js         # Reusable page headers
│   │   │   ├── top-bar.js             # Navigation bar
│   │   │   ├── footer.js              # Footer component
│   │   │   ├── background-rotator.js  # Gallery background rotator
│   │   │   └── guild-search.js        # Guild search component
│   │   ├── utils/                # Utility functions
│   │   │   ├── wow-constants.js       # WoW classes, races, colors
│   │   │   ├── wow-icons.js           # Icon URL generation
│   │   │   ├── item-quality.js        # Item quality colors/names
│   │   │   ├── helpers.js             # General utilities
│   │   │   ├── config-utils.js        # Config helpers
│   │   │   └── page-initializer.js    # Page setup utility
│   │   ├── data/                 # Static data
│   │   │   ├── backgrounds.js         # Background image metadata
│   │   │   └── enchant-mappings.js    # Enchant name mappings
│   │   ├── config.js             # App configuration
│   │   ├── main.js               # Guild roster page
│   │   ├── my-characters.js      # My characters page
│   │   ├── my-todos.js           # Todos page
│   │   ├── my-youtube.js         # YouTube page
│   │   ├── my-mounts.js          # Mounts collection page
│   │   ├── gallery.js            # Gallery page
│   │   └── mythic-plus.js        # Mythic+ leaderboards page
│   ├── styles/
│   │   ├── main.scss             # Main stylesheet (imports all)
│   │   ├── _mixins.scss          # Shared SCSS mixins
│   │   ├── base/                 # Base styles & variables
│   │   │   ├── _variables.scss        # CSS custom properties
│   │   │   ├── _reset.scss            # CSS reset
│   │   │   └── _responsive.scss       # Responsive utilities
│   │   ├── components/           # Component styles
│   │   │   ├── _top-bar.scss
│   │   │   ├── _guild-search.scss
│   │   │   ├── _member-card.scss
│   │   │   ├── _character-modal.scss
│   │   │   ├── _video-modal.scss
│   │   │   ├── _form-modal.scss
│   │   │   ├── _custom-dropdown.scss
│   │   │   ├── _custom-tooltip.scss
│   │   │   ├── _buttons.scss
│   │   │   ├── _loading.scss
│   │   │   ├── _pagination.scss
│   │   │   ├── _status.scss
│   │   │   ├── _class-stats.scss
│   │   │   ├── _meta-showcase.scss
│   │   │   ├── _equipment.scss
│   │   │   ├── _guild-header.scss
│   │   │   ├── _roster-controls.scss
│   │   │   └── _background-rotator.scss
│   │   ├── layout/               # Layout components
│   │   │   ├── _container.scss
│   │   │   └── _footer.scss
│   │   └── pages/                # Page-specific styles
│   │       ├── _roster.scss
│   │       ├── _gallery.scss
│   │       ├── _my-todos.scss
│   │       ├── _my-youtube.scss
│   │       ├── _my-mounts.scss
│   │       └── _mythic-plus.scss
│   ├── img/                      # Images
│   │   ├── bgs/                       # Background images (26 WoW locations)
│   │   ├── app-guild.png              # App logo
│   │   ├── header.png                 # Top bar background
│   │   ├── logo.png                   # Footer logo
│   │   ├── placeholder.png            # Image placeholder
│   │   └── character-fallback.svg     # Fallback character image
│   ├── gitimgs/                  # GitHub README screenshots
│   ├── index.html                # Guild roster page
│   ├── my-characters.html        # My characters page
│   ├── my-todos.html             # Todos page
│   ├── my-youtube.html           # YouTube page
│   ├── my-mounts.html            # Mounts collection page
│   ├── gallery.html              # Gallery page
│   └── mythic-plus.html          # Mythic+ leaderboards page
├── dist/                         # Build output (gitignored)
├── node_modules/                 # Dependencies
├── data/                         # Server data
│   └── seasons/                       # Mythic+ season data
├── user-data/                    # User data storage (gitignored)
├── scripts/
│   └── capture-season-data.js    # Season data capture utility
├── server.cjs                    # Express backend server
├── package.json                  # Dependencies & scripts
├── build-prod.cjs                # Production build script
├── clean-console.cjs             # Console cleaning utility
├── .env                          # Environment variables (gitignored)
├── .env.example                  # Example environment variables
├── railway.json                  # Railway deployment config
├── render.yaml                   # Render deployment config (alternative)
├── README.md                     # Main documentation
├── BUILD.md                      # Build process documentation
├── QUICK-DEPLOY.md               # Deployment quick reference
└── CHANGELOG.md                  # Change log
```

---

## Core Systems

### 1. Authentication System (`auth.js`)

**Type:** Battle.net OAuth 2.0 Authorization Code Flow

**Key Features:**
- Popup-based login on desktop (better UX)
- Full-page redirect on mobile (popup blockers)
- Token stored in localStorage with expiry
- Auto-detects environment (localhost vs production)
- Cross-window messaging for popup auth
- Automatic token expiry check

**Flow:**
```javascript
// Desktop Flow
login() → popup window → Battle.net OAuth → callback with code
       → exchangeCodeForToken() → fetch user profile → store in localStorage

// Mobile Flow
login() → redirect to Battle.net → callback with code
       → exchangeCodeForToken() → fetch user profile → store in localStorage
```

**Important Constants:**
- `API_PROXY_URL`: Backend OAuth proxy (localhost:3001 or Railway)
- `storageKey`: 'bnet_auth'

**Events:**
- `auth-state-changed`: Dispatched on login/logout

### 2. Caching System (`cache-service.js`)

**Type:** Dual-layer (Memory + localStorage) with TTL

**Architecture:**
```
┌─────────────┐
│ Memory Map  │  ← Fast, session-only
└──────┬──────┘
       │
┌──────▼──────┐
│ localStorage│  ← Persistent, cross-session
└─────────────┘
```

**Key Features:**
- Memory cache (Map) for instant access
- localStorage fallback for persistence
- TTL-based expiration (5-15 minutes)
- Automatic cleanup of expired entries
- Cache keys: `cache_${type}:${params}`

**TTL Settings (config.js):**
- Default: 5 minutes
- Guild Roster: 10 minutes
- Character Data: 15 minutes

### 3. Data Persistence System (`item-manager.js`)

**Type:** Dual-layer (Backend + localStorage) with sync

**Base Class:** `ItemManager` (extended by TodoManager, YouTubeManager)

**Architecture:**
```
┌──────────────┐
│   Backend    │  ← Primary (authenticated users)
│ (JSON files) │
└──────┬───────┘
       │ sync
┌──────▼───────┐
│ localStorage │  ← Fallback + instant writes
└──────────────┘
```

**Key Features:**
- User-specific storage keyed by Battle.net Battletag
- Backend-first load strategy (if authenticated)
- Instant localStorage writes
- Async backend sync
- Automatic conflict resolution (backend wins if both have data)

**Storage Keys:**
- Todos: `guild_todos_${battletag.replace('#', '_')}`
- YouTube: `guild_youtube_channels_${battletag.replace('#', '_')}`

**Backend Endpoints:**
- GET/POST `/api/user/todos`
- GET/POST `/api/user/youtube`

### 4. Battle.net API Client (`battlenet-client.js`)

**Type:** Token-based REST API wrapper

**Key Features:**
- Client credentials flow for public data
- Automatic token refresh on 401
- Silent 404/403 handling (expected for privacy settings)
- Token stored in localStorage
- Regional endpoint support (EU, US, KR, TW)

**Common Endpoints:**
- Guild Roster: `/data/wow/guild/{realm}/{guild}/roster`
- Character Profile: `/profile/wow/character/{realm}/{character}`
- Character Equipment: `/profile/wow/character/{realm}/{character}/equipment`
- Character Media: `/profile/wow/character/{realm}/{character}/character-media`
- Mythic+ Profile: `/profile/wow/character/{realm}/{character}/mythic-keystone-profile`

---

## Component Architecture

### Base Component: `ItemManager`

**Purpose:** Abstract base class for managing collections with dual-layer persistence

**Used By:**
- `TodoManager` (todo items)
- `YouTubeManager` (YouTube channels)

**Key Methods:**
```javascript
// Lifecycle
async init()              // Initialize manager, load items
async loadItems()         // Load from backend + localStorage
async saveItems()         // Save to both layers

// CRUD Operations
async addItem(data)       // Add new item
async updateItem(id, data)// Update existing item
async deleteItem(id)      // Delete item
getItemById(id)           // Get item by ID

// Utilities
getStorageKey()           // Get user-specific key
formatDate(dateString)    // Format date (relative or short)
escapeHtml(text)          // Sanitize HTML
isValidUrl(string)        // Validate URL
```

### Reusable Components

**Modal Components:**
- `CharacterModal`: Character details with equipment, stats
- `VideoModal`: YouTube video player (16:9 aspect ratio)
- `FormModal`: Generic form modal with flexible fields

**UI Components:**
- `CustomDropdown`: Dropdown with counts, search, multi-select
- `PageHeader`: Reusable page headers with action buttons
- `TopBar`: Navigation bar with auth state
- `Footer`: Footer with logo and links
- `BackgroundRotator`: Auto-rotating background gallery

**Data Components:**
- `GuildRoster`: Guild roster display with filtering/sorting
- `CharacterCard`: Reusable character cards with portraits
- `GuildSearch`: Guild search with realm/name inputs

---

## API Integrations

### 1. Battle.net API

**Base URL:** `https://eu.api.blizzard.com` (configurable by region)

**Authentication:** OAuth 2.0 (Client Credentials + Authorization Code)

**Rate Limits:** 36,000 requests/hour (100/second burst)

**Key Namespaces:**
- `static-eu`: Static game data (classes, races, specs)
- `dynamic-eu`: Dynamic game data (realms, auctions)
- `profile-eu`: User profiles (characters, guilds, achievements)

**Caching Strategy:**
- Guild roster: 10 minutes
- Character data: 15 minutes
- Equipment: 15 minutes
- Media: No expiry (URLs don't change)

### 2. YouTube Data API v3

**Base URL:** `https://www.googleapis.com/youtube/v3`

**Authentication:** API Key (server-side)

**Quota:** 10,000 units/day (search = 100 units)

**Key Endpoints:**
- `/search`: Search channels and videos
- `/videos`: Get video details

**Features:**
- Channel handle resolution (`@username` → channel ID)
- Tag-based video filtering
- Auto-cleanup of videos older than 30 days

### 3. Open Graph Metadata

**Purpose:** Auto-fill todo card metadata from URLs

**Implementation:** Server-side HTML parsing with regex

**Extracted Fields:**
- `og:title` / `twitter:title` / `<title>`
- `og:description` / `twitter:description` / `description`
- `og:image` / `twitter:image`

---

## Build System

### Development Build

**Command:** `npm run dev`

**What it does:**
1. Builds SCSS → CSS
2. Copies HTML files
3. Copies JavaScript (readable, no obfuscation)
4. Copies images, assets, fonts
5. Starts live-server (port 8080)
6. Starts OAuth server (port 3001)
7. Watches for file changes

**Output:** `dist/` folder with readable code

### Production Build

**Command:** `npm run build:prod`

**What it does:**
1. Builds SCSS → CSS (no source maps)
2. Copies HTML files
3. Minifies + obfuscates JavaScript
4. Copies images, assets, fonts
5. Adds copyright notice

**Obfuscation Settings:**
- String array encoding and rotation
- Control flow obfuscation
- Variable name mangling
- Dead code injection (optional)

**Output:** `dist/` folder with minified code (2-5x larger due to obfuscation)

### Build Scripts (package.json)

```json
{
  "build": "Full development build",
  "build:prod": "Full production build",
  "build:scss": "Compile SCSS to CSS",
  "build:html": "Copy HTML files",
  "build:js": "Copy JS files (dev)",
  "build:js:prod": "Minify + obfuscate JS (prod)",
  "build:img": "Copy images",
  "build:assets": "Copy assets",
  "build:fonts": "Copy Line Awesome fonts",
  "build:data": "Copy data files",
  "dev": "Development mode with watch + live-reload"
}
```

---

## Backend Server (server.cjs)

**Framework:** Express 5.x

**Port:** 3001 (configurable via `PORT` env var)

**Purpose:**
1. OAuth proxy (hides client secret)
2. User data persistence (JSON files)
3. Metadata fetching (Open Graph, YouTube)

### Endpoints

#### Authentication
- `POST /api/auth/token`: Exchange auth code for access token
- `POST /api/auth/userinfo`: Get user info from access token

#### User Data (Requires Bearer token)
- `GET /api/user/todos`: Fetch user's todos
- `POST /api/user/todos`: Save user's todos
- `GET /api/user/youtube`: Fetch user's YouTube channels
- `POST /api/user/youtube`: Save user's YouTube channels

#### Metadata Services
- `POST /api/fetch-metadata`: Fetch Open Graph metadata from URL
- `POST /api/fetch-youtube`: Fetch YouTube channel videos

### Data Storage

**Location:** `user-data/` folder (gitignored)

**File Format:** JSON

**File Naming:** `{battletag}_{type}.json`
- Example: `crbntyp_1234_todos.json`

**Security:**
- Bearer token validation via Battle.net API
- Battletag extracted from token
- Files keyed by Battletag (user isolation)

---

## Configuration

### Guild Configuration (config.js)

```javascript
guild: {
  realm: 'tarren-mill',
  name: 'geez-yer-shoes-n-jaykit',
  realmSlug: 'tarren-mill',
  nameSlug: 'geez-yer-shoes-n-jaykit',
  connectedRealmId: 1084
}
```

**How to change guild:**
1. Update `config.js` guild object
2. Rebuild: `npm run build`
3. Clear cache: localStorage + memory

### Environment Variables (.env)

```bash
# Battle.net OAuth
BNET_CLIENT_ID=your_client_id
BNET_CLIENT_SECRET=your_client_secret

# YouTube API
YOUTUBE_API_KEY=your_youtube_api_key

# Server
PORT=3001
```

### Redirect URIs (Battle.net Developer Portal)

**Development:**
- `http://localhost:8080/`

**Production:**
- `https://carbontype.co/guild/`

---

## Common Development Tasks

### Adding a New Page

1. Create HTML file: `src/my-new-page.html`
2. Create JS file: `src/scripts/my-new-page.js`
3. Create SCSS file: `src/styles/pages/_my-new-page.scss`
4. Import SCSS in `main.scss`:
   ```scss
   @import 'pages/my-new-page';
   ```
5. Add navigation link in `top-bar.js`
6. Rebuild: `npm run build`

### Adding a New Component

1. Create JS file: `src/scripts/components/my-component.js`
2. Create SCSS file: `src/styles/components/_my-component.scss`
3. Import SCSS in `main.scss`:
   ```scss
   @import 'components/my-component';
   ```
4. Export component class/function
5. Import where needed

### Adding a New API Endpoint

**Backend (server.cjs):**
```javascript
app.post('/api/my-endpoint', verifyToken, async (req, res) => {
  // Your logic here
  res.json({ success: true });
});
```

**Frontend:**
```javascript
const response = await fetch(`${baseApiUrl}/api/my-endpoint`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${authService.getAccessToken()}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify(data)
});
```

### Clearing Cache

**Frontend (Browser Console):**
```javascript
// Clear all cache
cacheService.clearAll();

// Clear specific cache
cacheService.clear('guild:tarren-mill:geez-yer-shoes-n-jaykit');

// Clear expired only
cacheService.clearExpired();
```

**localStorage:**
```javascript
// Clear all
localStorage.clear();

// Clear specific key
localStorage.removeItem('cache_guild:tarren-mill:geez-yer-shoes-n-jaykit');
```

### Debugging Authentication Issues

**Check auth status:**
```javascript
console.log(authService.isAuthenticated());
console.log(authService.getUser());
console.log(authService.getAccessToken());
```

**Check token expiry:**
```javascript
const authData = authService.getAuthData();
const expiresAt = authData.timestamp + (authData.expires_in * 1000);
console.log('Token expires at:', new Date(expiresAt));
console.log('Token expired:', Date.now() >= expiresAt);
```

**Force logout:**
```javascript
authService.logout();
```

---

## Styling Conventions

### SCSS Architecture

**Structure:**
- `_mixins.scss`: Shared mixins (must be imported first)
- `base/`: Variables, reset, responsive utilities
- `components/`: Component-specific styles
- `layout/`: Layout components (container, footer)
- `pages/`: Page-specific styles

**Naming Convention:**
- BEM-like: `.component-name__element--modifier`
- Class-based: `.guild-roster`, `.member-card`, `.top-bar`

### CSS Custom Properties (Variables)

**Defined in:** `base/_variables.scss`

**Common Variables:**
```scss
:root {
  --color-primary: #0078FF;
  --color-bg: #1a1a1a;
  --color-border: rgba(255, 255, 255, 0.1);
  --color-text: #ffffff;
  --color-text-secondary: rgba(255, 255, 255, 0.7);
}
```

### Class Colors

**Defined in:** `utils/wow-constants.js`

**Usage:**
```javascript
import { CLASS_COLORS } from './utils/wow-constants.js';
element.style.color = CLASS_COLORS[className]; // e.g., '#C41E3A' for Death Knight
```

**Supported Classes:** Death Knight, Demon Hunter, Druid, Evoker, Hunter, Mage, Monk, Paladin, Priest, Rogue, Shaman, Warlock, Warrior

---

## Key Design Decisions

### 1. Why Vanilla JavaScript?

**Reason:** Lightweight, no build complexity, no framework lock-in

**Benefits:**
- Faster load times (no framework overhead)
- Better understanding of fundamentals
- No dependency on framework updates
- Easier to customize and extend

**Trade-offs:**
- More manual DOM manipulation
- No reactive data binding
- More boilerplate for state management

### 2. Why Dual-Layer Persistence?

**Reason:** Reliability + Speed + Cross-device sync

**Benefits:**
- Instant writes (localStorage)
- Cross-device sync (backend)
- Offline support (localStorage fallback)
- Battle.net account linking (multi-device)

**Trade-offs:**
- More complex data flow
- Potential sync conflicts (backend wins)

### 3. Why Popup-based OAuth?

**Reason:** Better UX on desktop (no page reload)

**Benefits:**
- No page reload (preserves state)
- Faster login flow
- Modern UX pattern

**Trade-offs:**
- Popup blockers (fallback to redirect)
- More complex cross-window messaging

### 4. Why Client-Side Rendering?

**Reason:** Static hosting, no server requirements

**Benefits:**
- Deploy to any static host (GitHub Pages, Netlify, etc.)
- No server-side rendering complexity
- Better for SEO (all pages are HTML)

**Trade-offs:**
- Slower initial render (API calls)
- No SSR benefits (SEO, performance)

### 5. Why SCSS over CSS-in-JS?

**Reason:** Better developer experience, familiar tooling

**Benefits:**
- Variables, mixins, nesting
- Component-based organization
- Faster build times than CSS-in-JS
- No runtime overhead

**Trade-offs:**
- Extra build step
- No dynamic styling (runtime)

---

## Common Patterns

### 1. Page Initialization Pattern

**All pages follow this structure:**

```javascript
import AuthService from './services/auth.js';
import PageInitializer from './utils/page-initializer.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Wait for auth check
  await AuthService.waitForAuthCheck();

  // Initialize page components
  PageInitializer.init();

  // Page-specific logic
  initializePageComponents();

  // Listen for auth state changes
  window.addEventListener('auth-state-changed', () => {
    // Re-render based on auth state
  });
});
```

### 2. Component Pattern

**Most components follow this structure:**

```javascript
class MyComponent {
  constructor(options) {
    this.container = document.querySelector(options.selector);
    this.data = [];
  }

  async init() {
    await this.loadData();
    this.render();
    this.attachEventListeners();
  }

  async loadData() {
    // Load data from API or cache
  }

  render() {
    // Render component HTML
  }

  attachEventListeners() {
    // Attach event listeners
  }
}

export default MyComponent;
```

### 3. API Request Pattern

**All API requests use this pattern:**

```javascript
import CacheService from './services/cache-service.js';
import BattleNetClient from './api/battlenet-client.js';

async function fetchData(params) {
  // Check cache first
  const cacheKey = CacheService.generateKey('type', ...params);
  const cached = CacheService.get(cacheKey);
  if (cached) return cached;

  // Fetch from API
  const data = await BattleNetClient.request('/endpoint', { params });

  // Cache result
  CacheService.set(cacheKey, data, TTL);

  return data;
}
```

### 4. ItemManager Extension Pattern

**Extend ItemManager for new collections:**

```javascript
import ItemManager from './item-manager.js';
import AuthService from '../services/auth.js';

class MyItemManager extends ItemManager {
  constructor() {
    super({
      containerId: 'my-items-container',
      authService: AuthService,
      storagePrefix: 'guild_my_items',
      apiEndpoint: '/api/user/my-items',
      baseApiUrl: 'https://guild-production.up.railway.app'
    });
  }

  async init() {
    await super.init();
    this.render();
  }

  render() {
    // Custom rendering logic
  }
}

export default MyItemManager;
```

---

## Troubleshooting

### Common Issues

**1. OAuth Popup Blocked**
- **Cause:** Browser popup blocker
- **Solution:** User must allow popups for the site
- **Fallback:** Redirect flow on mobile

**2. CORS Errors**
- **Cause:** Backend not running or incorrect URL
- **Solution:** Check `API_PROXY_URL` in `auth.js`
- **Check:** Backend server running on port 3001

**3. 404 on Character Data**
- **Cause:** Character deleted or privacy settings
- **Solution:** Already handled, silent filtering

**4. Cache Not Clearing**
- **Cause:** Both memory and localStorage cache
- **Solution:** `cacheService.clearAll()` + `localStorage.clear()`

**5. Data Not Syncing**
- **Cause:** Not authenticated or backend down
- **Solution:** Check auth status, check backend logs

**6. Wowhead Tooltips Not Showing**
- **Cause:** Script not loaded or incorrect item ID
- **Solution:** Check `data-wowhead` attribute format

---

## Important Files Reference

### Must-Know Files

**Configuration:**
- `src/scripts/config.js`: Guild config, API endpoints, cache TTL
- `.env`: Environment variables (API keys, secrets)

**Core Services:**
- `src/scripts/services/auth.js`: Authentication logic
- `src/scripts/services/cache-service.js`: Caching logic
- `src/scripts/components/item-manager.js`: Base class for data managers

**Backend:**
- `server.cjs`: Express server (OAuth proxy, user data)

**Build:**
- `package.json`: Build scripts, dependencies
- `build-prod.cjs`: Production build configuration

**Styling:**
- `src/styles/main.scss`: Main stylesheet (imports all)
- `src/styles/_mixins.scss`: Shared SCSS mixins
- `src/styles/base/_variables.scss`: CSS custom properties

---

## Git Workflow

### Branch Strategy

**Main Branch:** `master`

**Commit Message Format:**
```
<type>: <subject>

<body>

🤖 Generated with Claude Code
Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types:** feat, fix, refactor, docs, style, test, chore

### Deployment Workflow

1. Make changes
2. Test locally: `npm run dev`
3. Build production: `npm run build:prod`
4. Commit changes: `git add . && git commit -m "..."`
5. Push to GitHub: `git push`
6. FTP upload `dist/` folder to web host

**Backend Deployment:**
- Railway auto-deploys on git push
- Environment variables set in Railway dashboard

---

## Performance Optimizations

### Implemented

1. **Lazy Loading:** Character data loaded only when needed
2. **Smart Caching:** Dual-layer cache with TTL expiration
3. **404 Filtering:** Silent filtering of deleted characters
4. **Debounced Search:** 300ms debounce on search inputs
5. **Batch Requests:** Multiple characters fetched in parallel
6. **Image Optimization:** WebP + fallbacks, lazy loading

### Future Optimizations

1. **Service Worker:** Offline support, background sync
2. **Virtual Scrolling:** For large rosters (100+ members)
3. **Image CDN:** CloudFlare or similar for background images
4. **Code Splitting:** Load page-specific JS only
5. **Font Optimization:** Subset Line Awesome icons

---

## Security Considerations

### Current Security Measures

1. **Client Secret Hidden:** OAuth proxy prevents secret exposure
2. **Token Expiry:** Automatic token expiration (24 hours)
3. **User Isolation:** Data keyed by Battletag
4. **Input Sanitization:** HTML escaping for user input
5. **CORS Enabled:** Backend restricts origins

### Known Limitations

1. **Client-Side Code:** All frontend code is visible
2. **API Keys in Frontend:** Battle.net client ID exposed (expected)
3. **No Rate Limiting:** Frontend can spam API (Battle.net handles it)
4. **localStorage Access:** User can modify their own data

### Best Practices

1. **Never commit secrets:** Use `.env` for sensitive data
2. **Validate user input:** Sanitize before rendering
3. **Use HTTPS:** Always use HTTPS in production
4. **Rotate API keys:** Periodically rotate keys

---

## Dependencies

### Production Dependencies

```json
{
  "cors": "^2.8.5",           // CORS middleware
  "dotenv": "^17.2.3",        // Environment variables
  "express": "^5.1.0",        // Web server framework
  "line-awesome": "^1.3.0",   // Icon library
  "masonry-layout": "^4.2.2", // Grid layout library
  "node-fetch": "^2.7.0"      // HTTP client
}
```

### Dev Dependencies

```json
{
  "concurrently": "^9.2.1",         // Run multiple commands
  "cpx": "^1.5.0",                  // Copy files with watching
  "javascript-obfuscator": "^4.1.1",// Code obfuscation
  "live-server": "^1.2.2",          // Development server
  "sass": "^1.93.2",                // SCSS compiler
  "terser": "^5.44.0"               // JavaScript minifier
}
```

---

## External Resources

### APIs & Documentation

- **Battle.net API Docs:** https://develop.battle.net/documentation
- **YouTube Data API:** https://developers.google.com/youtube/v3
- **WoW API Forums:** https://us.forums.blizzard.com/en/blizzard/c/api-discussion
- **Wowhead:** https://www.wowhead.com/tooltips (tooltips integration)

### Icon Resources

- **Line Awesome:** https://icons8.com/line-awesome (icons used in UI)
- **Wowhead CDN:** https://wow.zamimg.com/ (class, race, spec icons)

### Tools

- **Railway:** https://railway.app (backend hosting)
- **FTP Client:** FileZilla, Cyberduck (for deployment)

---

## Notes for Future Development

### Code Quality

- ES6 modules throughout (no CommonJS in frontend)
- JSDoc comments for complex functions
- Meaningful variable names (no single letters except loops)
- DRY principle: Shared logic in services/utils

### Testing

- Currently no automated tests
- Manual testing via `npm run dev`
- Browser DevTools for debugging

### Accessibility

- Keyboard navigation partial (modals, dropdowns)
- Screen reader support limited
- Color contrast meets WCAG AA

### Browser Support

- Modern browsers only (ES6 modules required)
- Tested: Chrome, Firefox, Safari, Edge
- No IE11 support (ES6 modules not supported)

---

## Quick Reference

### Start Development
```bash
npm run dev
```

### Build Production
```bash
npm run build:prod
```

### Deploy
```bash
# Upload dist/ folder via FTP
# Backend auto-deploys via Railway
```

### Clear Cache
```javascript
cacheService.clearAll();
localStorage.clear();
```

### Force Logout
```javascript
authService.logout();
```

### Change Guild
```javascript
// Edit src/scripts/config.js
guild: {
  realm: 'new-realm',
  name: 'new-guild-name',
  realmSlug: 'new-realm',
  nameSlug: 'new-guild-name'
}
```

---

**Last Updated:** 2025-12-17
**Application Version:** 1.0.0
**Author:** Jonny Pyper (carbontype)

---

## My Mounts Feature (Added 2025-11-15)

### Overview

The My Mounts page displays a user's World of Warcraft mount collection organized by expansion. The feature shows only owned mounts with their 3D render images, grouped by WoW expansion from Classic through The War Within.

### Architecture

**Data Generation Approach:**
- Static mount database generated via script (`scripts/generate-mount-data.js`)
- One-time generation fetches all 1,481 mounts from Battle.net API
- Stores mount metadata (name, description, image URL, source, faction, expansion)
- Expansion determined via ID-based heuristics (fallback since API doesn't provide it)

**Runtime Approach:**
- Fetches user's owned mounts from Battle.net collections API
- Matches owned mounts with generated database by mount ID
- Only displays mounts that exist in both (owned + have image data)
- Groups by expansion using database's heuristic field

### Files Added/Modified

**Data Generation:**
- `scripts/generate-mount-data.js` - Mount database generator script
- `data/mounts-generated.json` - Generated database of all 1,481 mounts (gitignored in dist, committed in data/)
- Added `"generate:mounts": "node scripts/generate-mount-data.js"` to package.json

**HTML:**
- `src/my-mounts.html` - Page structure with header and content container

**JavaScript:**
- `src/scripts/my-mounts.js` - Main page logic with MountsPage class
- `src/scripts/data/generated-mount-data.js` - Loader for generated mount database
- `src/scripts/api/wow-api.js` - Added `getCharacterMountsCollection()` method

**SCSS:**
- `src/styles/pages/_my-mounts.scss` - Page-specific styles
- `src/styles/main.scss` - Added import for _my-mounts.scss

**Navigation:**
- `src/scripts/components/top-bar.js` - Added "My Mounts" link under "My Account" dropdown

### API Integration

**Collections Endpoint:** `/profile/wow/character/{realmSlug}/{characterName}/collections/mounts`
- **Namespace:** `profile-eu`
- **Authentication:** Requires user's Battle.net access token
- **Returns:** List of owned mounts with mount ID, name, and is_useable flag
- **Note:** Does NOT include expansion_id (we use database heuristic instead)

**Mount Data Endpoint:** `/data/wow/mount/{mountId}` (used during generation)
- **Namespace:** `static-eu`
- **Returns:** Mount metadata including name, description, source, faction, creature displays

**Creature Display Endpoint:** `/data/wow/media/creature-display/{displayId}` (used during generation)
- **Namespace:** `static-eu`
- **Returns:** 3D render image URLs for mounts

### Page Features

1. **Authentication Check**
   - Redirects unauthenticated users with message to login
   - Uses AuthService to verify user login status

2. **Mount Count in Header**
   - Page title shows "My Mounts (count)" where count is total owned mounts
   - Dynamically updated after API load

3. **Image Loading Progress Bar**
   - Shows progress bar while mount images lazy load
   - Displays "Loading images: X / Y" count
   - Fades out automatically when all images loaded
   - Uses red gradient progress fill

4. **Mount Organization**
   - Groups mounts by expansion using database heuristic
   - Displays expansions in reverse chronological order (newest first)
   - Only shows expansions that have owned mounts
   - Each expansion card shows mount count

5. **Mount Display**
   - 5-column grid layout of mount 3D renders
   - Lazy loading with Intersection Observer (loads 200px before viewport)
   - Shimmer effect on placeholders while loading
   - Fade-in animation when images load
   - Mount name overlay with frosted glass effect
   - Hover effects: translateY(-4px) lift

6. **Mount Name Styling**
   - Semi-transparent black background (rgba(0, 0, 0, 0.5))
   - Backdrop filter: blur(10px) + brightness(0.3) for frosted glass effect
   - White text, uppercase, letter-spacing 1.5px
   - Font-weight 300 (light)
   - Positioned -20px from top (overlaps image)
   - Pill-shaped (border-radius: 50px)

7. **Expansion Mapping**
   ```javascript
   const EXPANSIONS = {
     0: 'Classic',
     1: 'The Burning Crusade',
     2: 'Wrath of the Lich King',
     3: 'Cataclysm',
     4: 'Mists of Pandaria',
     5: 'Warlords of Draenor',
     6: 'Legion',
     7: 'Battle for Azeroth',
     8: 'Shadowlands',
     9: 'Dragonflight',
     10: 'The War Within'
   }
   ```

8. **Expansion Heuristics (ID Ranges)**
   - The War Within (10): ID >= 1750
   - Dragonflight (9): ID >= 1500
   - Shadowlands (8): ID >= 1400
   - Battle for Azeroth (7): ID >= 1000
   - Legion (6): ID >= 750
   - Warlords of Draenor (5): ID >= 550
   - Mists of Pandaria (4): ID >= 450
   - Cataclysm (3): ID >= 370
   - Wrath of the Lich King (2): ID >= 250
   - The Burning Crusade (1): ID >= 100
   - Classic (0): ID < 100

### Error Handling

- **404/403 Errors:** Displays privacy settings message (collection may be private)
- **No Characters:** Shows message if user has no WoW characters
- **General Errors:** Displays error state with retry button
- **Failed Images:** Question mark placeholder shown for mounts with broken image URLs
- **Missing Images:** All mounts show placeholder initially, then swap to real image on load

### UI Components

**Progress Bar:**
- Red gradient fill (linear-gradient(90deg, #e12e2c, #ff4444))
- Smooth width transition (0.3s ease)
- Shows count: "Loading images: X / Y"
- Auto-fades out after all images loaded

**Expansion Cards:**
- Expansion name as heading
- Mount count display (e.g., "341 mounts")
- Single column layout
- 5-column grid for mount items
- Glassmorphism background with backdrop blur

**Mount Items:**
- Square aspect ratio (1:1)
- 3D render images from Battle.net CDN
- Placeholder → shimmer → fade-in sequence
- Name overlay with frosted glass effect
- Hover lift animation
- Wowhead tooltip integration (hidden link for tooltip script)

### Styling Architecture

**Layout:**
- Container max-width: 1290px
- Single column expansion cards (changed from 2-column)
- 5-column mount grid
- Mobile responsive (adjusts grid columns)

**Visual Effects:**
- Glassmorphism: rgba(26, 26, 26, 0.3) + backdrop-filter: blur(5px)
- Shimmer animation on lazy-loading images
- Fade-in animation (0.3s) when images load
- Frosted glass name overlay using backdrop-filter

**Colors:**
- Primary accent: #e12e2c (red)
- Background: rgba(26, 26, 26, 0.3)
- Text: white with various opacities
- Border: rgba(255, 255, 255, 0.1)

### Technical Implementation

**Data Generation Script:**
- Runtime: ~2-3 minutes for 1,481 mounts
- Rate limiting: 50ms delay between requests
- Error handling: Continues on individual mount failures
- Output: JSON file with mount ID as key
- Image fetching: Uses creature display media endpoint
- Expansion logic: ID-based heuristic ranges

**Lazy Loading:**
- IntersectionObserver with 200px rootMargin
- Loads images before entering viewport
- Tracks progress for progress bar
- Handles load errors with fallback placeholder
- Caches loaded images (browser cache)

**Performance:**
- Only owned mounts rendered (not all 1,481)
- Images lazy-loaded on scroll
- No unnecessary API calls (uses generated database)
- Shimmer effect provides visual feedback
- Progressive enhancement (placeholder → image)

### Mount Database Structure

```json
{
  "generatedAt": "2025-11-15T08:55:05.834Z",
  "version": "1.0.0",
  "totalMounts": 1481,
  "mounts": {
    "6": {
      "id": 6,
      "name": "Brown Horse",
      "description": "A favorite among Stormwind's guards...",
      "image": "https://render.worldofwarcraft.com/eu/npcs/zoom/creature-display-2404.jpg",
      "source": "Vendor",
      "faction": "ALLIANCE",
      "expansion": 0
    }
  }
}
```

### Known Limitations

1. **Expansion accuracy:** ID-based heuristics may miscategorize some mounts (especially edge cases)
2. **Missing images:** Some mounts may have broken image URLs from Blizzard CDN
3. **API limitations:** Collections endpoint doesn't provide expansion data
4. **No caching:** Mount collection fetched fresh each page load
5. **Image size:** Large 3D renders may take time to load (hence lazy loading)

### Future Enhancements

1. **Filtering & Search:**
   - Search by mount name
   - Filter by source type (vendor, drop, achievement, etc.)
   - Filter by faction (Alliance, Horde, Both)
   - Filter by usability

2. **Collection Stats:**
   - Percentage of total available mounts
   - Missing mounts from each expansion
   - Rarest mounts owned
   - Most recent acquisitions

3. **Mount Details Modal:**
   - Full mount description
   - Acquisition method/source
   - Usability status
   - Link to Wowhead for more info

4. **Caching:**
   - Cache mount collection data
   - Cache generated mount database in localStorage
   - Invalidate cache on mount acquisition

5. **Alternative Views:**
   - List view option
   - Compact grid option
   - Sorting options (name, date acquired, expansion)

### Maintenance

**Updating Mount Database:**
```bash
# Run generation script when new mounts are added to WoW
npm run generate:mounts

# Rebuilds data/mounts-generated.json
# Should be run after major patches/expansions
```

**ID Heuristic Updates:**
- Monitor new mount IDs from latest expansion
- Update `getExpansionFromId()` thresholds in generate-mount-data.js
- Re-run generation script after updates

---

## Character Modal Enhancements (Added 2025-12-17)

### Overview

Two new features added to the character modal on both guild roster and my-characters pages:

1. **Full-Size Character Image Preview** - Magnify glass icon opens a lightbox modal with the full-body character render
2. **Mythic+ Progression Tab** - New tab showing current season dungeon stats for each character

### Feature 1: Full-Size Character Image Preview

**Purpose:** Allow users to view their character's full-body 3D render in a large lightbox overlay.

**Files Added:**
- `src/scripts/components/image-preview-modal.js` - Singleton lightbox modal component
- `src/styles/components/_image-preview-modal.scss` - Lightbox styles + magnify icon styles

**Files Modified:**
- `src/scripts/components/character-card.js` - Added magnify icon button in avatar placeholder
- `src/scripts/my-characters.js` - Added import, updated `loadAvatar()` to extract full render URL and attach click handler
- `src/styles/main.scss` - Added import for image-preview-modal styles

**How It Works:**
1. When character avatar loads, the magnify icon appears on hover (bottom-right corner)
2. `loadAvatar()` extracts the `main-raw` or `main` asset from the character media API response
3. Clicking the magnify icon opens the `imagePreviewModal` singleton
4. Modal displays the full-body render in a centered lightbox with dark backdrop
5. Close via X button, clicking backdrop, or pressing Escape key

**Character Media Assets (Battle.net API):**
- `avatar` - Small square avatar
- `inset` - Bust/portrait (used in character cards)
- `main` - Full body render with class background
- `main-raw` - Full body render transparent (PNG) - preferred

**Component Structure:**
```javascript
class ImagePreviewModal {
  constructor()     // Initialize singleton
  init()           // Create modal DOM element
  open(url, alt)   // Open with image URL
  close()          // Close modal
  handleKeydown()  // Escape key handler
}
```

**SCSS Styles:**
- `.image-preview-modal` - Full-screen overlay (z-index: 10001, above character modal)
- `.image-preview-backdrop` - Dark backdrop with blur (rgba(0,0,0,0.92))
- `.image-preview-content` - Centered container with scale animation
- `.image-preview-img` - Max 90vw/85vh, object-fit contain
- `.magnify-icon` - Hover-visible icon on character cards

### Feature 2: Mythic+ Progression Tab

**Purpose:** Display character-specific Mythic+ dungeon stats for the current season directly in the character modal.

**Files Modified:**
- `src/scripts/api/wow-api.js` - Added `getCharacterMythicKeystoneSeasonDetails()` method
- `src/scripts/components/character-modal.js` - Added M+ tab, pane, and `loadMythicPlusProgression()` method
- `src/styles/components/_character-modal.scss` - Added `.modal-mythic-plus` styles

**How It Works:**
1. New tab button (key icon) added to modal tab bar
2. When modal opens, `loadMythicPlusProgression()` is called
3. Fetches character's M+ profile from Battle.net API
4. Fetches season-specific details to get `best_runs` array
5. Displays all current season dungeons (8 for TWW S3) with character's stats
6. Characters with no M+ activity show all dungeons with "-" and "--:--"

**API Endpoints Used:**
- `GET /profile/wow/character/{realm}/{name}/mythic-keystone-profile` - Base profile with seasons list and overall rating
- `GET /profile/wow/character/{realm}/{name}/mythic-keystone-profile/season/{seasonId}` - Season details with `best_runs` array
- `GET /data/wow/mythic-keystone/dungeon/index` - Current season dungeons list

**Data Structure (Season Details Response):**
```javascript
{
  best_runs: [
    {
      dungeon: { id: 378, name: "Halls of Atonement" },
      keystone_level: 15,
      duration: 1845000,        // milliseconds
      keystone_upgrades: 2      // 0-3 timer bonus
    }
  ]
}
```

**Current Season Dungeons (TWW Season 3):**
- Halls of Atonement (378)
- Tazavesh: Streets of Wonder (391)
- Tazavesh: So'leah's Gambit (392)
- Priory of the Sacred Flame (499)
- Ara-Kara, City of Echoes (503)
- The Dawnbreaker (505)
- Operation: Floodgate (525)
- Eco-Dome Al'dani (542)

**Display Elements:**
- **Rating display** - Overall M+ rating with Blizzard color scheme
- **Dungeon cards** - Background image, name, stats
- **Key level badge** - Color-coded: orange (15+), purple (10-14), blue (<10)
- **Completion time** - Formatted as mm:ss
- **Timer bonus** - +++ (gold), ++ (silver), + (bronze), - (depleted)

**Rating Color Scheme (matches Blizzard):**
```javascript
getMythicRatingColor(rating) {
  if (rating >= 3000) return '#ff8000'; // Orange
  if (rating >= 2500) return '#a335ee'; // Purple
  if (rating >= 2000) return '#0070dd'; // Blue
  if (rating >= 1500) return '#1eff00'; // Green
  if (rating >= 750) return '#ffffff';  // White
  return 'rgba(255, 255, 255, 0.5)';   // Gray
}
```

**SCSS Structure:**
```scss
.modal-mythic-plus {
  .mythic-plus-rating     // Rating display box
  .dungeons-list          // Dungeon cards container
  .dungeon-instance       // Individual dungeon card
    .dungeon-background-overlay
    .dungeon-content
      .dungeon-name
      .dungeon-stats
        .dungeon-key-level  // Colored badge
        .dungeon-time       // mm:ss format
        .timer-bonus        // +++/++/+/-
}
```

### Dungeon to Journal Instance Mapping

For background images, dungeon IDs are mapped to journal instance IDs:
```javascript
const dungeonToJournal = {
  378: 1185,   // Halls of Atonement
  391: 1194,   // Tazavesh: Streets of Wonder
  392: 1194,   // Tazavesh: So'leah's Gambit
  499: 1267,   // Priory of the Sacred Flame
  503: 1271,   // Ara-Kara, City of Echoes
  505: 1270,   // The Dawnbreaker
  525: 1298,   // Operation: Floodgate
  542: 1303    // Eco-Dome Al'dani
};
```

### Maintenance Notes

**Updating for New Seasons:**
1. Update `currentSeasonDungeonIds` array in `character-modal.js`
2. Update `dungeonToJournal` mapping with new dungeon→journal instance IDs
3. Background images are fetched from journal instance media API

**API Quirks:**
- Base M+ profile returns seasons as `[{key: {...}, id: 15}]` - id is directly on object, not nested
- Must fetch season-specific endpoint to get actual `best_runs` data
- Rating is at `current_mythic_rating.rating` in base profile
