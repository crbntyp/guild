# My Personal Warcraft

A modern World of Warcraft companion application featuring guild roster management, character tracking, YouTube video curation, personal todos, and a stunning background gallery. Built with vanilla JavaScript and the Battle.net API for **Geez-yer-shoes-n-jaykit** cross-realm guild (EU).

## ✨ Features

### 🔐 Battle.net Authentication
- OAuth 2.0 integration with popup-based login
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

### ✅ Personal Todos (Auth Required)
- Personal task management with localStorage persistence
- Auto-fill metadata from URLs (title, description, images)
- Masonry grid layout for dynamic card heights
- Edit, complete, and organize tasks
- Image previews from Open Graph metadata
- 30-day persistence

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

## 🏗️ Architecture

### Modern Component-Based Design
- **Reusable Components**: PageHeader, FormModal, VideoModal, CharacterModal, CustomDropdown
- **Base Classes**: ItemManager for shared CRUD operations
- **Centralized Services**: CacheService, AuthService, GuildService, CharacterService
- **Utility Functions**: WoW constants, icon loading, page initialization
- **SCSS Mixins**: Shared styling patterns for consistency

### Smart Caching System
- LocalStorage + Memory dual-layer caching
- TTL-based expiration (5-15 minutes depending on data type)
- Automatic cleanup of expired entries
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
- Node.js + Express
- OAuth proxy for secure authentication
- Metadata fetching service

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
│   │   └── icon-loader.js           # Icon loading with fallbacks
│   ├── components/
│   │   ├── top-bar.js               # Navigation
│   │   ├── guild-roster.js          # Roster display
│   │   ├── character-modal.js       # Character detail modal
│   │   ├── character-card.js        # Reusable character cards
│   │   ├── video-modal.js           # YouTube video player modal
│   │   ├── form-modal.js            # Generic form modal
│   │   ├── todo-manager.js          # Todo CRUD
│   │   ├── youtube-manager.js       # YouTube channel management
│   │   ├── item-manager.js          # Base class for managers
│   │   ├── custom-dropdown.js       # Dropdown UI component
│   │   ├── page-header.js           # Reusable page headers
│   │   ├── background-rotator.js    # Background rotation
│   │   └── footer.js                # Footer component
│   ├── utils/
│   │   ├── wow-constants.js         # WoW classes, races, colors
│   │   ├── wow-icons.js             # Icon URL generation
│   │   ├── item-quality.js          # Item quality colors/names
│   │   ├── helpers.js               # Utility functions
│   │   ├── config-utils.js          # Config helpers
│   │   └── page-initializer.js      # Page setup utility
│   ├── data/
│   │   └── backgrounds.js           # Background image metadata
│   ├── main.js                      # Guild roster page
│   ├── gallery.js                   # Gallery page
│   ├── my-todos.js                  # Todos page
│   ├── my-youtube.js                # YouTube page
│   ├── my-characters.js             # My characters page
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
├── my-todos.html                    # Todos
├── my-youtube.html                  # YouTube
└── my-characters.html               # My characters

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
npm run build          # Build everything
npm run build:scss     # Compile SCSS
npm run build:html     # Copy HTML files
npm run build:js       # Copy JavaScript
npm run build:img      # Copy images
npm run build:assets   # Copy assets
npm run build:fonts    # Copy fonts
```

## 🔌 API Integration

### Battle.net API Endpoints
- `/oauth/token` - Authentication
- `/data/wow/guild/{realm}/{guild}/roster` - Guild roster
- `/profile/wow/character/{realm}/{character}` - Character profile
- `/profile/wow/character/{realm}/{character}/equipment` - Equipment
- `/profile/wow/character/{realm}/{character}/character-media` - Character images
- `/profile/wow/character/{realm}/{character}/specializations` - Specs

### Caching Strategy
- **Guild roster**: 10 minutes
- **Character profiles**: 15 minutes
- **Equipment**: 15 minutes
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
- Dual-layer caching (memory + localStorage)
- Smart 404 filtering
- Batch API requests
- ~18-20% CSS size reduction

## 🔮 Future Enhancements

- Guild achievements and progression tracking
- Mythic+ scores (Raider.IO integration)
- PvP ratings display
- Guild calendar/events
- Member activity tracking
- Guild bank viewer
- Raid composition planner
- Member comparison tools

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
