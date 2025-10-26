#!/usr/bin/env node
/**
 * Production Build Script
 * Copies, minifies, and obfuscates JavaScript files
 */

const fs = require('fs').promises;
const path = require('path');
const { minify } = require('terser');
const JavaScriptObfuscator = require('javascript-obfuscator');

const SRC_DIR = path.join(__dirname, 'src', 'scripts');
const DIST_DIR = path.join(__dirname, 'dist', 'scripts');

// Light obfuscation settings - makes code annoying but keeps it functional
const OBFUSCATOR_OPTIONS = {
  compact: true,
  controlFlowFlattening: false, // Keep false for better performance
  deadCodeInjection: false,
  debugProtection: false,
  debugProtectionInterval: 0,
  disableConsoleOutput: false, // Keep console.logs for debugging
  identifierNamesGenerator: 'hexadecimal',
  log: false,
  numbersToExpressions: true,
  renameGlobals: false,
  selfDefending: false,
  simplify: true,
  splitStrings: true,
  splitStringsChunkLength: 10,
  stringArray: true,
  stringArrayCallsTransform: true,
  stringArrayEncoding: ['base64'],
  stringArrayIndexShift: true,
  stringArrayRotate: true,
  stringArrayShuffle: true,
  stringArrayWrappersCount: 2,
  stringArrayWrappersChainedCalls: true,
  stringArrayWrappersParametersMaxCount: 4,
  stringArrayWrappersType: 'function',
  stringArrayThreshold: 0.75,
  transformObjectKeys: true,
  unicodeEscapeSequence: false
};

// Terser minification options
const TERSER_OPTIONS = {
  compress: {
    dead_code: true,
    drop_console: false, // Keep console for now, can set to true later
    drop_debugger: true,
    keep_classnames: false,
    keep_fnames: false
  },
  mangle: {
    toplevel: false,
    keep_classnames: false,
    keep_fnames: false
  },
  format: {
    comments: false,
    preamble: '/*! Copyright 2025 - crbntyp/guild */'
  }
};

async function getAllFiles(dir, files = []) {
  const entries = await fs.readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      await getAllFiles(fullPath, files);
    } else if (entry.name.endsWith('.js')) {
      files.push(fullPath);
    }
  }

  return files;
}

async function ensureDir(dir) {
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function processFile(srcPath) {
  const relativePath = path.relative(SRC_DIR, srcPath);
  const distPath = path.join(DIST_DIR, relativePath);

  console.log(`Processing: ${relativePath}`);

  // Ensure output directory exists
  await ensureDir(path.dirname(distPath));

  // Read source file
  const code = await fs.readFile(srcPath, 'utf8');

  // Step 1: Minify with Terser
  console.log('  → Minifying...');
  const minified = await minify(code, TERSER_OPTIONS);

  if (minified.error) {
    console.error(`  ✗ Minification error: ${minified.error}`);
    return;
  }

  // Step 2: Light obfuscation
  console.log('  → Obfuscating...');
  const obfuscated = JavaScriptObfuscator.obfuscate(minified.code, OBFUSCATOR_OPTIONS);

  // Write to dist
  await fs.writeFile(distPath, obfuscated.getObfuscatedCode());

  // Log file sizes
  const originalSize = Buffer.byteLength(code, 'utf8');
  const finalSize = Buffer.byteLength(obfuscated.getObfuscatedCode(), 'utf8');
  const reduction = ((1 - finalSize / originalSize) * 100).toFixed(1);

  console.log(`  ✓ ${originalSize} bytes → ${finalSize} bytes (${reduction}% reduction)`);
}

async function build() {
  console.log('🏗️  Building production JavaScript...\n');

  try {
    // Get all JS files
    const files = await getAllFiles(SRC_DIR);
    console.log(`Found ${files.length} JavaScript files\n`);

    // Process each file
    for (const file of files) {
      await processFile(file);
    }

    console.log('\n✅ Production build complete!');
    console.log(`📦 Output: ${DIST_DIR}\n`);
  } catch (error) {
    console.error('\n❌ Build failed:', error);
    process.exit(1);
  }
}

build();
