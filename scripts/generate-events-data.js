/**
 * Events Data Generator
 *
 * This script fetches World of Warcraft event data from Wowhead and generates
 * a complete events database with schedules, categories, and occurrences.
 *
 * Run once per week/month to update the events database.
 *
 * Usage: node scripts/generate-events-data.js
 */

import fetch from 'node-fetch';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Output file
const OUTPUT_FILE = path.join(__dirname, '..', 'data', 'events-generated.json');
const WOWHEAD_EVENTS_URL = 'https://www.wowhead.com/events';

/**
 * Fetch Wowhead events page and extract JSON data
 */
async function fetchWowheadEvents() {
  console.log('📡 Fetching Wowhead events page...');

  const response = await fetch(WOWHEAD_EVENTS_URL, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch Wowhead events: ${response.status}`);
  }

  const html = await response.text();

  // Find the JSON script tag: <script type="application/json" id="data.page.listPage.listviews">
  const jsonMatch = html.match(/<script type="application\/json" id="data\.page\.listPage\.listviews">([\s\S]*?)<\/script>/);

  if (!jsonMatch) {
    throw new Error('Could not find events JSON script tag in Wowhead page');
  }

  // Parse the JSON directly
  const sections = JSON.parse(jsonMatch[1]);

  // Get all events from all sections (holidays, calendar, etc.)
  let allEventsData = [];

  sections.forEach(section => {
    if (section.data && Array.isArray(section.data)) {
      allEventsData = allEventsData.concat(section.data);
    }
  });

  // Remove duplicates by ID
  const uniqueEvents = Array.from(new Map(allEventsData.map(event => [event.id, event])).values());

  console.log(`✅ Found ${uniqueEvents.length} unique events`);

  return uniqueEvents;
}

/**
 * Parse and clean event data
 */
function parseEventData(rawEvents) {
  console.log('🔄 Parsing event data...');

  const cleanedEvents = rawEvents.map(event => {
    // Parse occurrences if they exist
    let occurrences = [];
    if (event.occurrences && Array.isArray(event.occurrences)) {
      occurrences = event.occurrences.map(occ => ({
        start: occ.start ? new Date(occ.start.replace(/\\/g, '')).toISOString() : null,
        end: occ.end ? new Date(occ.end.replace(/\\/g, '')).toISOString() : null
      })).filter(occ => occ.start && occ.end); // Only keep valid occurrences
    }

    return {
      id: event.id,
      name: event.name,
      categoryName: event.categoryName || 'Unknown',
      category: event.category || 0,
      filterType: event.filtertype || null,
      startDate: event.startDate || null,
      endDate: event.endDate || null,
      duration: event.duration0 || event.duration1 || null,
      occurrences: occurrences,
      popularity: event.popularity || 0
    };
  });

  console.log(`✅ Parsed ${cleanedEvents.length} events`);

  return cleanedEvents;
}

/**
 * Group events by category
 */
function groupEventsByCategory(events) {
  const categories = {};

  events.forEach(event => {
    const categoryName = event.categoryName || 'Other';

    if (!categories[categoryName]) {
      categories[categoryName] = [];
    }

    categories[categoryName].push(event);
  });

  return categories;
}

/**
 * Main function
 */
async function main() {
  console.log('🎮 WoW Events Data Generator\n');
  console.log('='.repeat(50));

  try {
    // Fetch raw events from Wowhead
    const rawEvents = await fetchWowheadEvents();

    // Parse and clean the data
    const events = parseEventData(rawEvents);

    // Group by category for stats
    const categorized = groupEventsByCategory(events);

    // Generate output
    const output = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      totalEvents: events.length,
      categories: Object.keys(categorized).reduce((acc, cat) => {
        acc[cat] = categorized[cat].length;
        return acc;
      }, {}),
      events: events
    };

    // Write to file
    console.log('\n📝 Writing to file...');
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(output, null, 2), 'utf8');

    console.log(`✅ Successfully wrote ${events.length} events to ${OUTPUT_FILE}`);
    console.log('\n📊 Event Categories:');
    Object.entries(output.categories).forEach(([cat, count]) => {
      console.log(`   ${cat}: ${count}`);
    });

    console.log('\n' + '='.repeat(50));
    console.log('✨ Done!');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    process.exit(1);
  }
}

main();
