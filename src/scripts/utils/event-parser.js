/**
 * Natural language event parser
 * Parses text like:
 *   "I want to make a raid, The Voidspire August 8th 8pm heroic, 2 tanks, 2 healers and 19 dps"
 *   "I want to make a group, Lets push Mythic 15s tonight, Tonight 8pm 15s only need to push hard"
 */

// Raid aliases → canonical name
// Covers shorthand, misspellings, bad word order
const RAID_ALIASES = {
  // The Voidspire
  'the voidspire': 'The Voidspire',
  'voidspire': 'The Voidspire',
  'void spire': 'The Voidspire',
  'voidspier': 'The Voidspire',
  'voidsire': 'The Voidspire',
  'voidpsire': 'The Voidspire',
  'vs': 'The Voidspire',

  // March on Quel'Danas
  "march on quel'danas": "March on Quel'Danas",
  'march on queldanas': "March on Quel'Danas",
  'march queldanas': "March on Quel'Danas",
  'queldanas': "March on Quel'Danas",
  "quel'danas": "March on Quel'Danas",
  'quel danas': "March on Quel'Danas",
  'queldanes': "March on Quel'Danas",
  'quelldanas': "March on Quel'Danas",
  'qd': "March on Quel'Danas",
  'moqd': "March on Quel'Danas",

  // The Dreamrift
  'the dreamrift': 'The Dreamrift',
  'dreamrift': 'The Dreamrift',
  'dream rift': 'The Dreamrift',
  'dreamift': 'The Dreamrift',
  'dr': 'The Dreamrift',

  // Nerub-ar Palace
  'nerub-ar palace': 'Nerub-ar Palace',
  'nerubar palace': 'Nerub-ar Palace',
  'nerubar': 'Nerub-ar Palace',
  'nerub': 'Nerub-ar Palace',
  'nap': 'Nerub-ar Palace',
  'palace': 'Nerub-ar Palace',

  // Liberation of Undermine
  'liberation of undermine': 'Liberation of Undermine',
  'undermine': 'Liberation of Undermine',
  'liberation undermine': 'Liberation of Undermine',
  'lou': 'Liberation of Undermine',
  'undremine': 'Liberation of Undermine',
  'undermien': 'Liberation of Undermine',

  // Manaforge Omega
  'manaforge omega': 'Manaforge Omega',
  'manaforge': 'Manaforge Omega',
  'omega': 'Manaforge Omega',
  'mfo': 'Manaforge Omega',
  'manforge': 'Manaforge Omega',
};

const DIFFICULTIES = ['mythic', 'heroic', 'normal', 'lfr'];

const DAY_NAMES = {
  'monday': 1, 'tuesday': 2, 'wednesday': 3, 'thursday': 4,
  'friday': 5, 'saturday': 6, 'sunday': 0,
  'mon': 1, 'tue': 2, 'wed': 3, 'thu': 4, 'fri': 5, 'sat': 6, 'sun': 0
};

const MONTH_NAMES = {
  'january': 0, 'february': 1, 'march': 2, 'april': 3, 'may': 4, 'june': 5,
  'july': 6, 'august': 7, 'september': 8, 'october': 9, 'november': 10, 'december': 11,
  'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'jun': 5, 'jul': 6, 'aug': 7,
  'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
};

export function parseEventInput(text) {
  const lower = text.toLowerCase();

  // Determine type
  let type = null;
  if (/\braid\b/.test(lower)) type = 'raid';
  else if (/\bgroup\b/.test(lower)) type = 'group';
  else return { error: 'Start with "I want to make a raid" or "I want to make a group"' };

  // Strip the intent prefix
  let body = text.replace(/^.*?\b(raid|group)\b[,.]?\s*/i, '').trim();

  const result = {
    type,
    title: null,
    description: null,
    difficulty: null,
    date: null,
    dateText: null,
    tanks: null,
    healers: null,
    dps: null,
    maxPlayers: null
  };

  if (type === 'raid') {
    parseRaid(body, lower, result);
  } else {
    parseGroup(body, result);
  }

  return result;
}

function parseRaid(body, lower, result) {
  // Find raid name via aliases (longest match first to avoid partial hits)
  const sortedAliases = Object.keys(RAID_ALIASES).sort((a, b) => b.length - a.length);
  for (const alias of sortedAliases) {
    if (lower.includes(alias)) {
      result.title = RAID_ALIASES[alias];
      break;
    }
  }

  if (!result.title) {
    // Use text before the first date/role keyword as title
    const titleMatch = body.match(/^([^,]+?)(?=\s+(?:today|tonight|tomorrow|monday|tuesday|wednesday|thursday|friday|saturday|sunday|mon|tue|wed|thu|fri|sat|sun|january|february|march|april|may|june|july|august|september|october|november|december|\d{1,2}(?:st|nd|rd|th)|\d{1,2}\s*(?:am|pm)|\d+\s*(?:tank|heal|dps|t\b|h\b|d\b)))/i);
    if (titleMatch) result.title = titleMatch[1].trim();
    else result.title = body.split(',')[0].trim();
  }

  // Find difficulty
  for (const diff of DIFFICULTIES) {
    if (lower.includes(diff)) {
      result.difficulty = diff;
      break;
    }
  }
  if (!result.difficulty) result.difficulty = 'heroic';

  // Parse roles
  parseRoles(lower, result);

  // Parse date
  result.date = parseDate(body);
  result.dateText = result.date ? formatDatePreview(result.date) : null;

  // Extract description: everything after the last role mention
  const bodyLower = body.toLowerCase();
  const roleMatches = [...bodyLower.matchAll(/\d+\s*(?:dps|tanks?|healers?|heals?|d\b|t\b|h\b)/g)];
  if (roleMatches.length > 0) {
    const lastRole = roleMatches[roleMatches.length - 1];
    const endPos = lastRole.index + lastRole[0].length;
    const afterRole = body.substring(endPos).replace(/^[\s,.\-and]+/i, '').trim();
    if (afterRole.length > 3) {
      result.description = afterRole;
    }
  }

  if (!result.description) {
    result.description = "Let's all raid!";
  }
}

function parseGroup(body, result) {
  // Split on comma — first part is title, rest is date + description
  const parts = body.split(/,\s*/);
  result.title = parts[0].trim();

  if (parts.length >= 2) {
    const rest = parts.slice(1).join(', ');
    result.date = parseDate(rest);
    result.dateText = result.date ? formatDatePreview(result.date) : null;

    // Description: everything after the time (e.g. "9pm") in the rest
    const timeMatch = rest.match(/\d{1,2}\s*(?:am|pm)|\d{1,2}:\d{2}/i);
    if (timeMatch) {
      const afterTime = rest.substring(timeMatch.index + timeMatch[0].length).replace(/^[\s,]+/, '').trim();
      if (afterTime.length > 2) {
        result.description = afterTime;
      }
    }
  } else {
    result.date = parseDate(body);
    result.dateText = result.date ? formatDatePreview(result.date) : null;
  }
}

function parseRoles(text, result) {
  // Match patterns: "2 tanks", "4 healers", "14 dps", "2t", "4h", "14d"
  const tankMatch = text.match(/(\d+)\s*(?:tanks?|t\b)/);
  const healerMatch = text.match(/(\d+)\s*(?:healers?|heals?|h\b)/);
  const dpsMatch = text.match(/(\d+)\s*(?:dps|d\b)/);

  result.tanks = tankMatch ? parseInt(tankMatch[1]) : 2;
  result.healers = healerMatch ? parseInt(healerMatch[1]) : 4;
  result.dps = dpsMatch ? parseInt(dpsMatch[1]) : 14;
  result.maxPlayers = result.tanks + result.healers + result.dps;
}

function parseDate(text) {
  const lower = text.toLowerCase();
  const now = new Date();
  let date = null;

  // Tonight / today
  if (/\btonight\b|\btoday\b/.test(lower)) {
    date = new Date(now);
  }

  // Tomorrow
  if (/\btomorrow\b/.test(lower)) {
    date = new Date(now);
    date.setDate(date.getDate() + 1);
  }

  // Day name (next occurrence)
  if (!date) {
    for (const [name, dayNum] of Object.entries(DAY_NAMES)) {
      const regex = new RegExp(`\\b${name}\\b`, 'i');
      if (regex.test(lower)) {
        date = new Date(now);
        const currentDay = date.getDay();
        let daysAhead = dayNum - currentDay;
        if (daysAhead <= 0) daysAhead += 7;
        date.setDate(date.getDate() + daysAhead);
        break;
      }
    }
  }

  // Month + day: "August 8th", "April 10", "8th August"
  if (!date) {
    for (const [name, monthNum] of Object.entries(MONTH_NAMES)) {
      // "August 8th" or "August 8"
      const regex1 = new RegExp(`\\b${name}\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`, 'i');
      // "8th August" or "8 August"
      const regex2 = new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+${name}\\b`, 'i');

      let match = lower.match(regex1) || lower.match(regex2);
      if (match) {
        date = new Date(now.getFullYear(), monthNum, parseInt(match[1]));
        if (date < now) date.setFullYear(date.getFullYear() + 1);
        break;
      }
    }
  }

  // Fallback: just a date like "10/04" or "2026-04-10"
  if (!date) {
    const isoMatch = lower.match(/(\d{4})-(\d{2})-(\d{2})/);
    if (isoMatch) {
      date = new Date(parseInt(isoMatch[1]), parseInt(isoMatch[2]) - 1, parseInt(isoMatch[3]));
    }
  }

  if (!date) return null;

  // Parse time
  let hours = 20; // default 8pm
  let minutes = 0;

  // "8pm", "8:30pm", "20:00", "8 pm"
  const timeMatch12 = lower.match(/\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)\b/);
  const timeMatch24 = lower.match(/\b(\d{1,2}):(\d{2})\b/);

  if (timeMatch12) {
    hours = parseInt(timeMatch12[1]);
    minutes = timeMatch12[2] ? parseInt(timeMatch12[2]) : 0;
    if (timeMatch12[3] === 'pm' && hours < 12) hours += 12;
    if (timeMatch12[3] === 'am' && hours === 12) hours = 0;
  } else if (timeMatch24) {
    hours = parseInt(timeMatch24[1]);
    minutes = parseInt(timeMatch24[2]);
  }

  date.setHours(hours, minutes, 0, 0);
  return date;
}

function formatDatePreview(date) {
  return date.toLocaleDateString('en-GB', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  }) + ' at ' + date.toLocaleTimeString('en-GB', {
    hour: '2-digit', minute: '2-digit'
  });
}
