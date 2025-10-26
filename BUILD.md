# Build Guide

## Development vs Production Builds

### Development Build
Use for local development with readable, debuggable code:
```bash
npm run build
```
or
```bash
npm run dev  # Includes live-reload and watch mode
```

### Production Build
Use for deployment with minified and obfuscated code:
```bash
npm run build:prod
```

**What production build does:**
- ✅ Minifies JavaScript (removes whitespace, shortens variable names)
- ✅ Obfuscates code (makes it difficult to read and reverse-engineer)
- ✅ Removes source maps
- ✅ Adds copyright notice
- ✅ String array encoding and rotation
- ✅ Control flow obfuscation

**File size impact:**
Files become 2-5x larger due to obfuscation overhead, but code is significantly harder to steal/understand.

## Individual Build Commands

| Command | Description |
|---------|-------------|
| `npm run build:scss` | Compile SCSS to CSS |
| `npm run build:html` | Copy HTML files to dist |
| `npm run build:js` | Copy JS files (dev - readable) |
| `npm run build:js:prod` | Minify + obfuscate JS (production) |
| `npm run build:img` | Copy images |
| `npm run build:assets` | Copy assets |
| `npm run build:fonts` | Copy Line Awesome fonts |

## Deployment

1. Run production build:
   ```bash
   npm run build:prod
   ```

2. Upload `dist/` folder contents to your web server via FTP/SFTP

3. Ensure `server.cjs` is running for OAuth and backend features:
   ```bash
   node server.cjs
   ```

## Build Configuration

### Obfuscation Settings
Edit `build-prod.cjs` to adjust obfuscation level:
- **Light obfuscation** (current): Readable but annoying
- **Medium obfuscation**: More protection, slower performance
- **Heavy obfuscation**: Maximum protection, noticeable performance impact

### Disable Obfuscation
To minify only without obfuscation, edit `package.json`:
```json
"build:js:prod": "terser src/scripts/**/*.js -o dist/scripts/ -m -c"
```

## Security Notes

**What is protected:**
- ✅ Code logic is obfuscated
- ✅ Variable and function names are mangled
- ✅ Strings are encoded in arrays
- ✅ Makes reverse-engineering time-consuming

**What is NOT protected:**
- ❌ Client-side code can never be fully secured
- ❌ Determined attackers can still deobfuscate
- ❌ HTML structure and CSS remain visible
- ❌ Network requests can be monitored

**Real protection comes from:**
- Backend API authentication (Battle.net OAuth)
- Server-side business logic
- Rate limiting
- Legal terms of service
