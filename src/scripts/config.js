// Battle.net API Configuration
// Note: In production, these should be environment variables
// For now, they're hardcoded for development purposes

const config = {
  battlenet: {
    clientId: '86af3b20703442e78f9a90778846ce3b',
    clientSecret: 'xHpqmVAnuwV8DFcMQncEYxCio35MSUHq',
    region: 'eu',
    // Auto-detect environment: localhost for dev, live URL for production
    redirectUri: (window.location.hostname === 'localhost' ||
                  window.location.hostname === '127.0.0.1')
      ? 'http://localhost:8080/'
      : window.location.hostname.startsWith('192.168.')
        ? `http://${window.location.host}/`
        : 'https://carbontype.co/guild/',

    // API endpoints by region
    endpoints: {
      eu: {
        oauth: 'https://oauth.battle.net',
        api: 'https://eu.api.blizzard.com'
      },
      us: {
        oauth: 'https://oauth.battle.net',
        api: 'https://us.api.blizzard.com'
      },
      kr: {
        oauth: 'https://oauth.battle.net',
        api: 'https://kr.api.blizzard.com'
      },
      tw: {
        oauth: 'https://oauth.battle.net',
        api: 'https://tw.api.blizzard.com'
      }
    }
  },

  guild: {
    realm: 'tarren-mill',
    name: 'geez-yer-shoes-n-jaykit',
    // Normalized for API calls (lowercase, hyphens)
    realmSlug: 'tarren-mill',
    nameSlug: 'geez-yer-shoes-n-jaykit',
    // Connected realm ID for Tarren Mill (EU)
    connectedRealmId: 1084
  },

  // Cache settings
  cache: {
    ttl: 300000, // 5 minutes in milliseconds
    guildRosterTTL: 600000, // 10 minutes for guild roster
    characterTTL: 900000 // 15 minutes for character data
  },

  // API settings
  api: {
    locale: 'en_GB',
    namespace: {
      static: 'static-eu',
      dynamic: 'dynamic-eu',
      profile: 'profile-eu'
    }
  }
};

// Helper to get the correct API URLs
config.getOAuthUrl = () => config.battlenet.endpoints[config.battlenet.region].oauth;
config.getApiUrl = () => config.battlenet.endpoints[config.battlenet.region].api;

export default config;
