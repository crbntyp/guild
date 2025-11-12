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

**Last Updated:** 2025-01-12
**Application Version:** 1.0.0
**Author:** Jonny Pyper (carbontype)
