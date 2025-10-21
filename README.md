# WoW Guild Roster Site

A World of Warcraft guild roster website powered by the Battle.net API, showing real-time guild member information for **Geez-yer-shoes-n-jaykit** cross-realm guild (EU).

## Features

### Guild Roster Display
- Real-time guild roster data from Battle.net API
- **Cross-realm support** - displays characters from multiple connected realms (Tarren Mill, Silvermoon, Frostmane)
- Character cards with large character portraits (inset renders)
- Class-colored borders and character names
- **Realm badges** - shows character's home realm on each card
- Class icon in header beside character name
- Detailed member info with icons:
  - Class icon + Class name
  - Race icon + Race name (gender-specific)
  - Specialization icon + Spec name
  - Faction icon + Faction name
  - Item level display
- Search and filter members by name or class
- Sort by item level, rank, name, level, or class
- Responsive grid layout for all screen sizes
- Smart filtering - automatically excludes invalid characters (404s)

### Character Details Modal
- Click any character card to view detailed information
- Full character render (main-raw) with transparent background
- Level, class, race, gender, realm, and active specialization
- Accurate item level from Battle.net API
- Achievement points
- Full equipment grid with item thumbnails
- WoW-style item tooltips showing stats, sockets, and quality
- **Interactive character carousel** - browse all guild members
- Keyboard navigation (arrow keys) to switch between characters
- Auto-centering on selected character

### Visual Polish
- Dark WoW-themed UI with authentic class colors
- Icon system with graceful fallbacks
- Item quality color-coding (Poor, Common, Rare, Epic, Legendary)
- Smooth animations and hover effects
- Loading states and error handling

### Performance
- Smart caching system (LocalStorage with TTL)
- Automatic OAuth token management
- Batch API requests with rate limiting
- Minimal redundant API calls

## Tech Stack

- **Frontend**: Vanilla JavaScript (ES6 Modules)
- **Styling**: SCSS with WoW class colors and dark theme
- **API**: Battle.net REST API
- **Icons**: Wowhead CDN (class, race, spec icons)
- **Build**: Sass, Live Server, CPX
- **Font**: Muli from Google Fonts

## Project Structure

```
src/
├── assets/
│   ├── fonts/                      # Empty (removed custom fonts)
│   └── icons/                      # Local placeholders only
├── img/
│   ├── logo.png                    # Guild logo
│   └── placeholder.png             # Fallback placeholder
├── scripts/
│   ├── api/
│   │   ├── battlenet-client.js    # Battle.net OAuth & API client
│   │   └── wow-api.js              # WoW-specific API endpoints
│   ├── services/
│   │   ├── cache-service.js        # LocalStorage caching with TTL
│   │   ├── guild-service.js        # Guild roster management
│   │   └── character-service.js    # Character profile/equipment data
│   ├── components/
│   │   └── guild-roster.js         # Roster UI, modals, equipment display
│   ├── utils/
│   │   ├── wow-constants.js        # Class colors and names
│   │   ├── wow-icons.js            # Wowhead CDN icon URLs
│   │   ├── item-quality.js         # Item quality colors and slots
│   │   └── helpers.js              # Utility functions
│   ├── config.js                   # API configuration (auto-detects environment)
│   └── main.js                     # App initialization
├── styles/
│   └── main.scss                   # Complete WoW-themed styles
└── index.html                      # Main HTML page
```

## Setup

### Prerequisites

- Node.js (v14 or higher)
- npm
- Battle.net Developer Account (already configured)

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

### Configuration

The Battle.net API credentials are already configured in `src/scripts/config.js`:
- **Region**: EU
- **Guild**: Geez-yer-shoes-n-jaykit
- **Realm**: Tarren Mill (guild home realm)
- **Cross-realm support**: Automatically handles members from Silvermoon, Frostmane, and Tarren Mill

**IMPORTANT**: For production, move credentials to environment variables and add `src/scripts/config.js` to `.gitignore` or use a proper secrets management solution.

## Development

Start the development server:
```bash
npm run dev
```

This will:
- Build all assets
- Start live server at `http://localhost:8080`
- Watch for changes and auto-reload

## Build Commands

```bash
# Build everything
npm run build

# Build individual components
npm run build:scss    # Compile SCSS
npm run build:html    # Copy HTML
npm run build:js      # Copy JavaScript
npm run build:img     # Copy images
npm run build:assets  # Copy icon assets
npm run build:fonts   # Copy icon fonts

# Clean dist folder
npm run clean
```

## Battle.net API

### Endpoints Used

- `/oauth/token` - OAuth client credentials access tokens
- `/data/wow/guild/{realm}/{guild}/roster` - Guild member list
- `/profile/wow/character/{realm}/{character}` - Character profiles (includes item level)
- `/profile/wow/character/{realm}/{character}/equipment` - Character gear with item details
- `/profile/wow/character/{realm}/{character}/specializations` - Character specs
- `/profile/wow/character/{realm}/{character}/character-media` - Character avatars & renders
- `/data/wow/playable-race/{id}` - Race information for gender-specific icons

### Rate Limiting

The API has rate limits. The app implements:
- Smart caching (5-15 minute TTL)
- LocalStorage persistence
- Automatic token refresh

### CORS

The Battle.net API allows CORS requests from browsers, so no backend proxy is needed for development.

## Features Explained

### Icon System
Icons are dynamically loaded from **Wowhead CDN**:
- **Class Icons**: 13 class icons (Warrior, Paladin, Hunter, etc.) from Wowhead
- **Race Icons**: Gender-specific icons for all playable races from Wowhead
- **Spec Icons**: Specialization icons for all retail WoW specs from Wowhead
- **Item Icons**: Equipment thumbnails from Battle.net Media endpoints

**Character Images from Battle.net**:
- **Inset renders**: Character portrait images
- **Main-raw renders**: Full body character renders with transparent background
- **Avatar images**: Small character avatar thumbnails

**Fallback System**: Line Awesome icon fonts provide fallbacks if Wowhead icons fail to load.

**Local Assets**: Only placeholder images and fonts are stored locally.

### Character Cards
Each character card displays:
1. **Large character portrait** (180px height) - inset render from Battle.net
2. **Realm badge** (bottom right) - shows character's home realm
3. **Header section**:
   - Class icon beside character name
   - Character level
   - Class-colored border
4. **Details section** with icons:
   - Class icon + Class name (e.g., Warrior)
   - Race icon + Race name (gender-specific, e.g., Human)
   - Spec icon + Spec name (e.g., Arms)
   - Faction icon + Faction name (Alliance/Horde)
   - la-shield-alt icon + Item level (from character profile API)

### Equipment Display (Modal)
When clicking a character:
1. Fetches character profile, equipment, specializations, and media
2. Displays full character render (main-raw asset with transparent background)
3. Equipment grid with 16+ item slots
4. Item thumbnails loaded from Battle.net media endpoints with authentication
5. Each item shows:
   - Quality-colored border (grey/green/blue/purple/orange)
   - Item level (iLvl)
   - Slot name (Head, Chest, Weapon, etc.)
6. Hover tooltips show:
   - Item stats
   - Sockets and gems
   - Durability
   - Binding type
   - Required level

### Caching Strategy
- **Guild roster**: 10 minutes (reduces frequent roster checks)
- **Character profiles**: 15 minutes (balances freshness with API limits)
- **Equipment**: 15 minutes (gear doesn't change often)
- **Specializations**: Not cached (to avoid LocalStorage quota issues)
- **OAuth tokens**: Cached until expiry (typically 24 hours)

### Cross-Realm Character Support
- **Composite key system**: Characters uniquely identified by `name + realm` combination
- Handles duplicate character names across different realms (e.g., "Nervë" on Silvermoon vs "Nervë" on Frostmane)
- Separate data storage for each character:
  - Item levels tracked per character-realm pair
  - Gender data stored per character-realm pair
  - Equipment and specs fetched from correct realm
- Realm information displayed throughout UI:
  - Roster cards show realm badge
  - Character detail modal shows realm badge
  - Carousel displays realm name

### Error Handling
- Smart 404 filtering - automatically removes characters that don't exist
- Graceful fallbacks for missing media/icons
- Automatic OAuth token refresh on 401 errors
- Suppressed console errors for expected 404s (cleaner debugging)
- Console logging for debugging (can be disabled for production)

## Customization

### Change Guild
Edit `src/scripts/config.js`:
```javascript
guild: {
  realm: 'your-realm',
  name: 'your-guild-name',
  realmSlug: 'your-realm',
  nameSlug: 'your-guild-name'
}
```

### Change Theme Colors
Edit `src/styles/main.scss`:
```scss
:root {
  --color-primary: #0078FF;  // Change main color
  --color-bg: #1a1a1a;       // Change background
  // etc...
}
```

### Class Colors
Class colors are defined in `src/scripts/utils/wow-constants.js` using official Blizzard colors.

## Future Enhancements

Ideas for expansion:
- Battle.net OAuth login for user profiles
- Guild achievements display
- Raid progression tracking
- Member activity/online status
- Guild bank integration
- Mythic+ scores (via Raider.IO API)
- PvP ratings
- Guild news feed
- Member comparison tools

## Security Notes

- Client ID and Secret are currently in source code
- For production: Use environment variables or backend proxy
- Consider implementing a backend API to hide credentials
- The current setup is fine for development/personal use

## Credits

- **API**: Battle.net / Blizzard Entertainment
- **Framework**: Carbontype by Jonny Pyper
- **Icons**: Line Awesome
- **Guild**: Geez-yer-shoes-n-jaykit (Tarren Mill EU)

## License

ISC

## Support

For issues or questions:
- Check Battle.net API docs: https://develop.battle.net/documentation
- WoW API forums: https://us.forums.blizzard.com/en/blizzard/c/api-discussion
