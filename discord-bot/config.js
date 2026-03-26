module.exports = {
  // Discord
  botToken: process.env.DISCORD_BOT_TOKEN || '',
  guildId: process.env.DISCORD_GUILD_ID || '822549525506949180',
  channelId: process.env.DISCORD_CHANNEL_ID || '1486762469455298700',

  // MySQL
  db: {
    host: 'localhost',
    user: 'gld_user',
    password: 'GldPass123!',
    database: 'gld'
  },

  // App URL for raid signup links
  appUrl: 'https://crbntyp.com/gld'
};
