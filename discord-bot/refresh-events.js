/**
 * Refresh Events Data
 * Fetches latest WoW events from Wowhead and writes to the gld static site.
 * Designed to run as a daily cron job on the VPS.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const OUTPUT_FILE = '/var/www/crbntyp/gld/data/events-generated.json';

function fetch(url) {
  return new Promise((resolve, reject) => {
    https.get(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; gld-bot/1.0)' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(data));
    }).on('error', reject);
  });
}

async function generateEvents() {
  console.log(`[${new Date().toISOString()}] Refreshing events data...`);

  try {
    const html = await fetch('https://www.wowhead.com/events');

    // Extract JSON data from page
    const jsonMatch = html.match(/<script type="application\/json" id="data\.page\.listPage\.listviews">([\s\S]*?)<\/script>/);
    if (!jsonMatch) {
      throw new Error('Could not find events JSON in Wowhead page');
    }

    const rawData = JSON.parse(jsonMatch[1]);
    // Wowhead returns an array of listviews — events data is in the first element
    const eventsList = Array.isArray(rawData) ? (rawData[0]?.data || []) : (rawData?.data || []);

    if (eventsList.length === 0) {
      throw new Error('No events found in Wowhead data');
    }

    // Process events
    const events = [];
    const seenIds = new Set();

    for (const event of eventsList) {
      if (seenIds.has(event.id)) continue;
      seenIds.add(event.id);

      // Parse occurrences
      const occurrences = [];
      if (event.occurrences && Array.isArray(event.occurrences)) {
        for (const occ of event.occurrences) {
          // Handle both formats: {start, end} as date strings or {timestamp, end} as unix
          if (occ.start && occ.end) {
            occurrences.push({
              start: new Date(occ.start.replace(/\//g, '-')).toISOString(),
              end: new Date(occ.end.replace(/\//g, '-')).toISOString()
            });
          } else if (occ.timestamp && occ.end) {
            occurrences.push({
              start: new Date(occ.timestamp * 1000).toISOString(),
              end: new Date(occ.end * 1000).toISOString()
            });
          }
        }
      }

      // Determine category name
      let categoryName = 'Uncategorized';
      if (event.category === 1) categoryName = 'Holidays';
      else if (event.category === 2) categoryName = 'Recurring';

      events.push({
        id: event.id,
        name: event.name || `[#${event.id}]`,
        categoryName,
        category: event.category || 0,
        filterType: event.filtertype || event.filterType || -1,
        startDate: event.startDate || null,
        endDate: event.endDate || null,
        duration: event.duration0 || event.duration || 0,
        occurrences,
        popularity: event.popularity || 0
      });
    }

    // Count categories
    const categoryCounts = {};
    events.forEach(e => {
      categoryCounts[e.categoryName] = (categoryCounts[e.categoryName] || 0) + 1;
    });

    const output = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      totalEvents: events.length,
      eventsWithOccurrences: events.filter(e => e.occurrences.length > 0).length,
      eventsWithValidNames: events.filter(e => !e.name.match(/^\[#\d+\]$/)).length,
      categoryCounts,
      events
    };

    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(output, null, 2));

    // Fix permissions
    try {
      const { execSync } = require('child_process');
      execSync(`chown www-data:www-data ${OUTPUT_FILE} && chmod 644 ${OUTPUT_FILE}`);
    } catch (e) {}

    console.log(`[${new Date().toISOString()}] Done! ${events.length} events written to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error:`, error.message);
    process.exit(1);
  }
}

generateEvents();
