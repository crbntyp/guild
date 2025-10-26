#!/usr/bin/env node
/**
 * Clean Console Messages
 * Removes console.log and console.warn statements except page initialization messages
 */

const fs = require('fs').promises;
const path = require('path');

const SRC_DIR = path.join(__dirname, 'src', 'scripts');

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

async function cleanFile(filePath) {
  const relativePath = path.relative(SRC_DIR, filePath);
  const content = await fs.readFile(filePath, 'utf8');
  const lines = content.split('\n');

  let cleaned = false;
  const newLines = lines.map((line, index) => {
    // Keep page initialization messages
    if (line.includes('console.log') && line.includes('⚡') && line.includes('initialized')) {
      return line;
    }

    // Keep console.error
    if (line.includes('console.error')) {
      return line;
    }

    // Remove console.log and console.warn
    if (line.includes('console.log') || line.includes('console.warn')) {
      cleaned = true;
      return '';
    }

    return line;
  });

  if (cleaned) {
    // Remove consecutive empty lines
    const finalLines = [];
    let lastWasEmpty = false;

    for (const line of newLines) {
      if (line.trim() === '') {
        if (!lastWasEmpty) {
          finalLines.push(line);
          lastWasEmpty = true;
        }
      } else {
        finalLines.push(line);
        lastWasEmpty = false;
      }
    }

    await fs.writeFile(filePath, finalLines.join('\n'));
    console.log(`✓ Cleaned: ${relativePath}`);
    return true;
  }

  return false;
}

async function clean() {
  console.log('🧹 Cleaning console messages...\n');

  try {
    const files = await getAllFiles(SRC_DIR);
    console.log(`Found ${files.length} JavaScript files\n`);

    let cleanedCount = 0;
    for (const file of files) {
      if (await cleanFile(file)) {
        cleanedCount++;
      }
    }

    console.log(`\n✅ Cleaned ${cleanedCount} files`);
    console.log('Kept: console.error statements and page initialization messages (⚡)');
  } catch (error) {
    console.error('\n❌ Clean failed:', error);
    process.exit(1);
  }
}

clean();
