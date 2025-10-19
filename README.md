# Carbontype Framework

A minimal, clean web application framework with modern build tooling and live-reload development environment.

## Features

- Clean HTML5/CSS3/JavaScript structure
- SCSS compilation with live reload
- Automatic file watching and syncing
- Line Awesome icon library integration
- Interactive component examples
- Responsive design patterns
- Modern development workflow

## Prerequisites

- Node.js (v14 or higher)
- npm

## Installation

```bash
npm install
```

## Available Scripts

### Development

Start the development server with live reload and file watching:

```bash
npm run dev
```

This will:
- Build all assets (SCSS, HTML, JS, images, fonts)
- Watch for changes in SCSS, HTML, JS, and image files
- Automatically rebuild and sync changes to `dist/`
- Start a live server at `http://localhost:8080`
- Auto-reload browser on any file changes

### Building

Build the entire project for production:

```bash
npm run build
```

This runs all build tasks in sequence:
1. Compile SCSS to CSS
2. Copy HTML files
3. Copy JavaScript files
4. Copy images
5. Copy Line Awesome icon fonts

### Individual Build Tasks

#### Build Styles
```bash
npm run build:scss
```
Compiles SCSS files from `src/styles/` to `dist/styles/` without source maps.

#### Build HTML
```bash
npm run build:html
```
Copies HTML files from `src/` to `dist/`.

#### Build JavaScript
```bash
npm run build:js
```
Copies JavaScript files from `src/scripts/` to `dist/scripts/`.

#### Build Images
```bash
npm run build:img
```
Copies images from `src/img/` to `dist/img/` maintaining directory structure.

#### Build Fonts
```bash
npm run build:fonts
```
Copies Line Awesome icon fonts to `dist/fonts/`.

### Watch Tasks

Watch individual file types for changes (automatically run by `npm run dev`):

- `npm run watch:scss` - Watch and compile SCSS files on change
- `npm run watch:html` - Watch and copy HTML files on change
- `npm run watch:js` - Watch and copy JavaScript files on change
- `npm run watch:img` - Watch and copy images on change

### Serve

Start a local server without watching for changes:

```bash
npm run serve
```

Serves the `dist/` directory at `http://localhost:8080` with auto-reload.

### Clean

Remove all built files from the `dist/` directory:

```bash
npm run clean
```

## Project Structure

```
frmwrk__/
├── src/
│   ├── img/            # Images and assets
│   │   └── assets/     # Logo and static assets
│   ├── scripts/        # JavaScript files
│   │   └── main.js     # Main application logic
│   ├── styles/         # SCSS stylesheets
│   │   └── main.scss   # Main stylesheet
│   └── index.html      # Main HTML file
├── dist/               # Build output (auto-generated, gitignored)
│   ├── fonts/          # Icon fonts
│   ├── img/            # Processed images
│   ├── scripts/        # Compiled JavaScript
│   ├── styles/         # Compiled CSS
│   └── index.html      # Built HTML
├── .gitignore          # Git ignore rules
├── package.json        # Dependencies and scripts
└── README.md           # This file
```

## Technologies Used

- **Sass** - CSS preprocessor for modular stylesheets
- **Line Awesome** - Icon library (1000+ icons)
- **CPX** - File copying and watching utility
- **Live Server** - Development server with live reload
- **Concurrently** - Run multiple npm scripts simultaneously

## Development Workflow

1. **Start development server**: `npm run dev`
2. **Edit files** in the `src/` directory
3. **Watch changes** automatically sync to `dist/` and reload browser
4. **Build for production**: `npm run build`

### File Watching

The development server watches for changes in:
- `src/styles/**/*.scss` → Compiles to `dist/styles/`
- `src/**/*.html` → Copies to `dist/`
- `src/scripts/**/*.js` → Copies to `dist/scripts/`
- `src/img/**/*` → Copies to `dist/img/`

All changes trigger automatic browser reload via live-server.

## Example Components

The framework includes example implementations:
- Interactive button with console logging
- Responsive card components
- Modern CSS variables for theming
- Icon integration examples

## Browser Support

Modern browsers that support:
- CSS Grid
- CSS Custom Properties (variables)
- ES6 JavaScript

## Author

Jonny Pyper / Carbontype

## License

ISC
