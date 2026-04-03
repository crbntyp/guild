const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const mysql = require('mysql2/promise');
const crypto = require('crypto');
const config = require('./config');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
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

/**
 * Post an M+ session embed to the channel
 */
async function postSessionEmbed(session, title, description) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const sessionDate = new Date(session.session_date);
  const timestamp = Math.floor(sessionDate.getTime() / 1000);

  const sessionDescription = session.description
    ? `${description}\n\n> ${session.description}`
    : description;

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setDescription(sessionDescription)
    .setColor(0xA335EE)
    .addFields(
      { name: 'Date', value: `<t:${timestamp}:F>`, inline: true },
      { name: 'Countdown', value: `<t:${timestamp}:R>`, inline: true },
      { name: '\u200b', value: `**[SIGN UP!](${config.appUrl}/groups.html?server=${session.discord_guild_id || ''}&name=${encodeURIComponent(session.discord_guild_name || '')})**`, inline: false }
    )
    .setFooter({ text: 'gld__ M+ Group Builder' })
    .setTimestamp();

  try {
    const message = await channel.send({ embeds: [embed] });
    const pool = await getDb();
    await pool.execute(
      'UPDATE mplus_sessions SET discord_message_id = ? WHERE id = ?',
      [message.id, session.id]
    );
    return message;
  } catch (error) {
    console.error('Error posting session embed:', error);
  }
}

/**
 * Check if a member can create raids or groups based on server settings
 * @param {string} type - 'raid' or 'group'
 */
async function canCreate(interaction, type) {
  const guildId = interaction.guildId;
  const member = interaction.member;

  // Server owner can always create
  if (member.id === interaction.guild?.ownerId) return true;

  // Check for drpd-help role
  if (member.roles.cache.some(r => r.name.toLowerCase() === 'drpd-help')) return true;

  // Check server settings for min role
  const pool = await getDb();
  const [settings] = await pool.execute('SELECT raid_min_role_position, group_min_role_position FROM server_settings WHERE guild_id = ?', [guildId]);

  if (settings.length === 0) return false;

  const minPosition = type === 'raid' ? settings[0].raid_min_role_position : settings[0].group_min_role_position;
  if (!minPosition) return false;

  const highestRole = member.roles.cache.reduce((max, r) => r.position > max ? r.position : max, 0);
  return highestRole >= minPosition;
}

// Handle slash commands
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'settings') {
    const member = interaction.member;
    const isOwner = member.id === interaction.guild?.ownerId;
    const hasDrpdHelp = member.roles.cache.some(r => r.name.toLowerCase() === 'drpd-help');

    if (!isOwner && !hasDrpdHelp) {
      await interaction.reply({ content: 'Only the server owner or members with the **drpd-help** role can change settings.', ephemeral: true });
      return;
    }

    const type = interaction.options.getString('type');
    const role = interaction.options.getRole('min-role');
    const pool = await getDb();

    if (type === 'raid') {
      await pool.execute(
        `INSERT INTO server_settings (guild_id, raid_min_role_id, raid_min_role_name, raid_min_role_position)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE raid_min_role_id = VALUES(raid_min_role_id), raid_min_role_name = VALUES(raid_min_role_name), raid_min_role_position = VALUES(raid_min_role_position)`,
        [interaction.guildId, role.id, role.name, role.position]
      );
      await interaction.reply({
        content: `Raid settings updated. Members with **${role.name}** or higher can now create raids.`,
        ephemeral: true
      });
    } else {
      await pool.execute(
        `INSERT INTO server_settings (guild_id, group_min_role_id, group_min_role_name, group_min_role_position)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE group_min_role_id = VALUES(group_min_role_id), group_min_role_name = VALUES(group_min_role_name), group_min_role_position = VALUES(group_min_role_position)`,
        [interaction.guildId, role.id, role.name, role.position]
      );
      await interaction.reply({
        content: `Group settings updated. Members with **${role.name}** or higher can now create groups.`,
        ephemeral: true
      });
    }
    return;
  }

  if (interaction.commandName === 'group') {
    // Check permissions
    if (!(await canCreate(interaction, 'group'))) {
      await interaction.reply({ content: 'You don\'t have permission to create groups. Ask your server owner to run `/settings` to configure permissions.', ephemeral: true });
      return;
    }

    const title = interaction.options.getString('title');
    const dateStr = interaction.options.getString('date');
    const description = interaction.options.getString('description') || null;

    const sessionDate = new Date(dateStr);
    if (isNaN(sessionDate.getTime())) {
      await interaction.reply({ content: 'Invalid date format. Use: `YYYY-MM-DD HH:MM` (e.g. `2026-04-10 20:00`)', ephemeral: true });
      return;
    }

    try {
      await interaction.deferReply();

      const pool = await getDb();
      const utcDate = sessionDate.toISOString().slice(0, 19).replace('T', ' ');
      const guildId = interaction.guildId;
      const guildName = interaction.guild?.name || '';

      const discordUserId = interaction.user.id;

      // Check if Discord account is linked to BNet
      const [links] = await pool.execute('SELECT bnet_user_id FROM discord_bnet_links WHERE discord_id = ?', [discordUserId]);
      const linkedBnetId = links.length > 0 ? links[0].bnet_user_id : null;

      const [result] = await pool.execute(
        `INSERT INTO mplus_sessions (title, description, session_date, status, created_by_battletag, created_by_discord_id, owner_bnet_id, discord_guild_id, discord_guild_name, discord_message_id)
         VALUES (?, ?, ?, 'open', ?, ?, ?, ?, ?, NULL)`,
        [title, description, utcDate, `Discord:${interaction.user.tag}`, discordUserId, linkedBnetId, guildId, guildName]
      );

      const sessionId = result.insertId;
      const [sessions] = await pool.execute('SELECT * FROM mplus_sessions WHERE id = ?', [sessionId]);
      const session = sessions[0];
      session.discord_guild_name = guildName;

      await postSessionEmbed(session, `${title}`, 'Sign up and get assigned to a group!');

      // If not linked, DM them a one-time link to pair Discord + BNet
      if (!linkedBnetId) {
        const linkToken = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

        await pool.execute(
          `INSERT INTO pending_discord_links (discord_id, token, expires_at) VALUES (?, ?, ?)
           ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
          [discordUserId, linkToken, expiresAt]
        );

        const linkUrl = `${config.appUrl}/groups.html?link_discord=${discordUserId}&link_token=${linkToken}`;
        try {
          await interaction.user.send({
            embeds: [
              new EmbedBuilder()
                .setTitle('One quick thing before you go!')
                .setDescription(
                  `Hey! You just created **${title}** — nice one.\n\n` +
                  `To build and manage your groups on the web (drag players into teams, auto-assign, the fun stuff), ` +
                  `we need to know your Discord account and your Battle.net account belong to the same person.\n\n` +
                  `**Why?** So only *you* can manage the events you create. Nobody else gets access to your created group.\n\n` +
                  `**What happens?** You click the link below, log in with Battle.net (the same way you log into the app), ` +
                  `and we pair the two accounts together. That's it — one time only. Every group or raid you create from Discord after this will just work.\n\n` +
                  `**What do we store?** Just your Discord ID and Battle.net ID side by side. No passwords, no personal data, no funny business. ` +
                  `You can read the full privacy policy at crbntyp.com/gld/privacy.html`
                )
                .setColor(0xA335EE)
                .addFields({ name: '\u200b', value: `**[Link my accounts](${linkUrl})**` })
                .setFooter({ text: 'This link is unique to you and expires in 7 days.' })
            ]
          });
        } catch (dmError) {
          console.log('Could not DM user:', dmError.message);
        }

        await interaction.editReply(`**${title}** created for <t:${Math.floor(sessionDate.getTime() / 1000)}:F>. Posted to <#${config.channelId}>. **Check your DMs** to link your Battle.net account for group management.`);
      } else {
        await interaction.editReply(`**${title}** created for <t:${Math.floor(sessionDate.getTime() / 1000)}:F>. Posted to <#${config.channelId}>.`);
      }
    } catch (error) {
      console.error('Error creating session:', error);
      const reply = interaction.deferred ? interaction.editReply : interaction.reply;
      await reply.call(interaction, { content: 'Failed to create event. Check the logs.', ephemeral: true });
    }
  }

  if (interaction.commandName === 'link') {
    const discordUserId = interaction.user.id;
    const pool = await getDb();

    // Check if already linked
    const [existing] = await pool.execute('SELECT bnet_user_id, battletag FROM discord_bnet_links WHERE discord_id = ?', [discordUserId]);
    if (existing.length > 0) {
      await interaction.reply({
        content: `You're already linked to **${existing[0].battletag}**. You're all set!`,
        ephemeral: true
      });
      return;
    }

    // Create pending link
    const linkToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 19).replace('T', ' ');

    await pool.execute(
      `INSERT INTO pending_discord_links (discord_id, token, expires_at) VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE token = VALUES(token), expires_at = VALUES(expires_at)`,
      [discordUserId, linkToken, expiresAt]
    );

    const linkUrl = `${config.appUrl}/groups.html?link_discord=${discordUserId}&link_token=${linkToken}`;

    try {
      await interaction.user.send({
        embeds: [
          new EmbedBuilder()
            .setTitle('Link your Battle.net account')
            .setDescription(
              `Hey! To get the most out of gld__, link your Discord and Battle.net accounts.\n\n` +
              `This lets you:\n` +
              `• Sign up for raids and groups from the web app\n` +
              `• Create and manage events you own\n` +
              `• See server-specific content\n\n` +
              `Click the link below and log in with Battle.net. One time only, takes 10 seconds.`
            )
            .setColor(0xA335EE)
            .addFields({ name: '\u200b', value: `**[Link my accounts](${linkUrl})**` })
            .setFooter({ text: 'This link is unique to you and expires in 7 days.' })
        ]
      });
      await interaction.reply({ content: 'Check your DMs for the link!', ephemeral: true });
    } catch (dmError) {
      await interaction.reply({
        content: 'I couldn\'t DM you. Make sure your DMs are open and try again.',
        ephemeral: true
      });
    }
    return;
  }

  if (interaction.commandName === 'raid') {
    // Check permissions
    if (!(await canCreate(interaction, 'raid'))) {
      await interaction.reply({ content: 'You don\'t have permission to create raids. Ask your server owner to run `/settings` to configure permissions.', ephemeral: true });
      return;
    }

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

/**
 * Post M+ signup notification
 */
async function postMplusSignupNotification(sessionId, characterName, role) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const pool = await getDb();
  const [sessions] = await pool.execute('SELECT * FROM mplus_sessions WHERE id = ?', [sessionId]);
  if (sessions.length === 0) return;

  const session = sessions[0];
  const [signups] = await pool.execute(
    'SELECT COUNT(*) as count FROM mplus_signups WHERE session_id = ?',
    [sessionId]
  );
  const count = signups[0].count;

  const roleEmoji = role === 'tank' ? '🛡️' : role === 'healer' ? '💚' : '⚔️';

  await channel.send(
    `${roleEmoji} **${characterName}** signed up for **${session.title}** — ${count} signed up`
  );
}

/**
 * Post M+ withdraw notification
 */
async function postMplusWithdrawNotification(sessionId, characterName, role) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const pool = await getDb();
  const [sessions] = await pool.execute('SELECT * FROM mplus_sessions WHERE id = ?', [sessionId]);
  if (sessions.length === 0) return;

  const session = sessions[0];
  const roleEmoji = role === 'tank' ? '🛡️' : role === 'healer' ? '💚' : '⚔️';

  await channel.send(
    `${roleEmoji} **${characterName}** withdrew from **${session.title}**`
  );
}

/**
 * Post session created notification (from web app)
 */
async function postSessionCreatedNotification(sessionId) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const pool = await getDb();
  const [sessions] = await pool.execute('SELECT * FROM mplus_sessions WHERE id = ?', [sessionId]);
  if (sessions.length === 0) return;

  const session = sessions[0];
  await postSessionEmbed(session, `${session.title}`, 'Sign up and get assigned to a group!');
}

/**
 * Post raid created notification (from web app)
 */
async function postRaidCreatedNotification(raidId) {
  const channel = client.channels.cache.get(config.channelId);
  if (!channel) return;

  const pool = await getDb();
  const [raids] = await pool.execute('SELECT * FROM raids WHERE id = ?', [raidId]);
  if (raids.length === 0) return;

  const raid = raids[0];
  await postRaidEmbed(raid, `New Raid: ${raid.title}`, `A new ${raid.difficulty} raid has been scheduled. Sign up now!`);
}

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
      } else if (data.event === 'session_created') {
        await postSessionCreatedNotification(data.session_id);
      } else if (data.event === 'raid_created') {
        await postRaidCreatedNotification(data.raid_id);
      } else if (data.event === 'mplus_signup') {
        await postMplusSignupNotification(data.session_id, data.character_name, data.role);
      } else if (data.event === 'mplus_withdraw') {
        await postMplusWithdrawNotification(data.session_id, data.character_name, data.role);
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
