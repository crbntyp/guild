const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const config = require('./config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

let db;

// Raid image URLs (large versions from Blizzard render CDN)
const RAID_IMAGES = {
  'The Voidspire': 'https://render.worldofwarcraft.com/us/zones/the-voidspire-large.jpg',
  "March on Quel'Danas": 'https://render.worldofwarcraft.com/us/zones/march-on-queldanas-large.jpg',
  'The Dreamrift': 'https://render.worldofwarcraft.com/us/zones/the-dreamrift-large.jpg'
};

async function getDb() {
  if (!db) {
    db = await mysql.createPool({
      host: config.db.host,
      user: config.db.user,
      password: config.db.password,
      database: config.db.database,
      waitForConnections: true,
      connectionLimit: 5
    });
  }
  return db;
}

// Difficulty colors
const DIFFICULTY_COLORS = {
  normal: 0x1EFF00,
  heroic: 0xA335EE,
  mythic: 0xFF8000
};

/**
 * Post a raid embed to the designated channel
 */
async function postRaidEmbed(raid, title, description) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) {
    console.error('Could not find channel:', config.channelId);
    return;
  }

  const raidDate = new Date(raid.raid_date);
  const timestamp = Math.floor(raidDate.getTime() / 1000);

  const raidImage = RAID_IMAGES[raid.title] || null;
  const raidDescription = raid.description
    ? `${description}\n\n> ${raid.description}`
    : description;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(raidDescription)
    .setColor(DIFFICULTY_COLORS[raid.difficulty] || 0xA335EE)
    .addFields(
      { name: 'Difficulty', value: raid.difficulty.charAt(0).toUpperCase() + raid.difficulty.slice(1), inline: true },
      { name: 'Date', value: `<t:${timestamp}:F>`, inline: true },
      { name: 'Countdown', value: `<t:${timestamp}:R>`, inline: true },
      { name: 'Roster', value: `0/${raid.max_players} — 🛡️ ${raid.max_tanks} 💚 ${raid.max_healers} ⚔️ ${raid.max_dps}`, inline: false },
      { name: '\u200b', value: `**[SIGN UP!](${config.appUrl}/raids.html?server=${raid.discord_guild_id || ''}&name=${encodeURIComponent(raid.discord_guild_name || '')})**`, inline: false }
    )
    .setFooter({ text: 'gld__ Raid Signup' })
    .setTimestamp();

  if (raidImage) {
    embed.setImage(raidImage);
  }

  try {
    const message = await channel.send({ embeds: [embed] });

    // Store the Discord message ID for future updates
    const pool = await getDb();
    await pool.execute(
      'UPDATE raids SET discord_message_id = ? WHERE id = ?',
      [message.id, raid.id]
    );

    return message;
  } catch (error) {
    console.error('Error posting raid embed:', error);
  }
}

/**
 * Post a signup notification to the channel
 */
async function postSignupNotification(raidId, characterName, role, isReserve) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const pool = await getDb();
  const [raids] = await pool.execute('SELECT * FROM raids WHERE id = ?', [raidId]);
  if (raids.length === 0) return;

  const raid = raids[0];
  const [signups] = await pool.execute(
    'SELECT COUNT(*) as count FROM raid_signups WHERE raid_id = ? AND is_reserve = 0 AND status != ?',
    [raidId, 'declined']
  );
  const count = signups[0].count;

  const reserveText = isReserve ? ' (Reserve)' : '';
  const roleEmoji = role === 'tank' ? '🛡️' : role === 'healer' ? '💚' : '⚔️';

  await channel.send(
    `${roleEmoji} **${characterName}** signed up for **${raid.title}** (${raid.difficulty})${reserveText} — ${count}/${raid.max_players}`
  );
}

/**
 * Post a raid full notification
 */
async function postRaidFullNotification(raidId) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const pool = await getDb();
  const [raids] = await pool.execute('SELECT * FROM raids WHERE id = ?', [raidId]);
  if (raids.length === 0) return;

  const raid = raids[0];
  const raidDate = new Date(raid.raid_date);
  const timestamp = Math.floor(raidDate.getTime() / 1000);

  const embed = new EmbedBuilder()
    .setTitle(`${raid.title} is FULL!`)
    .setDescription(`Roster is complete for ${raid.difficulty} on <t:${timestamp}:F>. Reserve spots still available.`)
    .setColor(0x10B981)
    .setURL(`${config.appUrl}/raids.html`)
    .setTimestamp();

  await channel.send({ embeds: [embed] });
}

/**
 * Post a withdraw notification
 */
async function postWithdrawNotification(raidId, characterName, role) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const pool = await getDb();
  const [raids] = await pool.execute('SELECT * FROM raids WHERE id = ?', [raidId]);
  if (raids.length === 0) return;

  const raid = raids[0];
  const roleEmoji = role === 'tank' ? '🛡️' : role === 'healer' ? '💚' : '⚔️';

  await channel.send(
    `${roleEmoji} **${characterName}** withdrew from **${raid.title}** (${raid.difficulty}) — spot opened`
  );
}

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'raid') {
    const title = interaction.options.getString('title');
    const dateStr = interaction.options.getString('date');
    const difficulty = interaction.options.getString('difficulty') || 'heroic';
    const description = interaction.options.getString('description') || null;
    const maxPlayers = interaction.options.getInteger('max_players') || 20;
    const tanks = interaction.options.getInteger('tanks') || 2;
    const healers = interaction.options.getInteger('healers') || 4;
    const dps = interaction.options.getInteger('dps') || 14;

    // Parse date
    const raidDate = new Date(dateStr);
    if (isNaN(raidDate.getTime())) {
      await interaction.reply({ content: 'Invalid date format. Use: `YYYY-MM-DD HH:MM` (e.g. `2026-04-10 20:00`)', ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply();

      const pool = await getDb();
      const utcDate = raidDate.toISOString().slice(0, 19).replace('T', ' ');

      const guildId = interaction.guildId;
      const guildName = interaction.guild?.name || '';

      const [result] = await pool.execute(
        `INSERT INTO raids (title, description, raid_date, max_players, max_tanks, max_healers, max_dps, difficulty, status, created_by_battletag, discord_guild_id, discord_guild_name)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open', ?, ?, ?)`,
        [title, description, utcDate, maxPlayers, tanks, healers, dps, difficulty, `Discord:${interaction.user.tag}`, guildId, guildName]
      );

      const raidId = result.insertId;

      // Fetch the created raid
      const [raids] = await pool.execute('SELECT * FROM raids WHERE id = ?', [raidId]);
      const raid = raids[0];

      // Post embed to raid channel
      await postRaidEmbed(raid, `New Raid: ${title}`, `A new ${difficulty} raid has been scheduled. Sign up now!`);

      await interaction.editReply(`Raid **${title}** (${difficulty}) created for <t:${Math.floor(raidDate.getTime() / 1000)}:F>. Posted to <#${config.channelId}>`);
    } catch (error) {
      console.error('Error creating raid:', error);
      const reply = interaction.deferred ? interaction.editReply : interaction.reply;
      await reply.call(interaction, { content: 'Failed to create raid. Check the logs.', ephemeral: true });
    }
  }
});

client.once('ready', () => {
  console.log(`🤖 gld bot online as ${client.user.tag}`);
});

client.login(config.botToken);

// Internal HTTP server for PHP webhook notifications
const http = require('http');

const webhookServer = http.createServer(async (req, res) => {
  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end('Method not allowed');
    return;
  }

  let body = '';
  req.on('data', chunk => body += chunk);
  req.on('end', async () => {
    try {
      const data = JSON.parse(body);

      if (data.event === 'signup') {
        await postSignupNotification(data.raid_id, data.character_name, data.role, data.is_reserve);
      } else if (data.event === 'raid_full') {
        await postRaidFullNotification(data.raid_id);
      } else if (data.event === 'withdraw') {
        await postWithdrawNotification(data.raid_id, data.character_name, data.role);
      }

      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ ok: true }));
    } catch (error) {
      console.error('Webhook error:', error);
      res.writeHead(500);
      res.end(JSON.stringify({ error: error.message }));
    }
  });
});

webhookServer.listen(3002, '127.0.0.1', () => {
  console.log('📡 Webhook server listening on http://127.0.0.1:3002');
});
