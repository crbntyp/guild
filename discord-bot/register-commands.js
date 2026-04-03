const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Create a new raid event')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Which raid?')
        .setRequired(true)
        .addChoices(
          { name: 'The Voidspire', value: 'The Voidspire' },
          { name: "March on Quel'Danas", value: "March on Quel'Danas" },
          { name: 'The Dreamrift', value: 'The Dreamrift' }
        ))
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Date and time (e.g. 2026-04-10 20:00)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('difficulty')
        .setDescription('Difficulty level')
        .setRequired(true)
        .addChoices(
          { name: 'Normal', value: 'normal' },
          { name: 'Heroic', value: 'heroic' },
          { name: 'Mythic', value: 'mythic' }
        ))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Optional notes (e.g. Alt run, CE push, etc.)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('max_players')
        .setDescription('Total player slots (default: 20)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('tanks')
        .setDescription('Max tanks (default: 2)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('healers')
        .setDescription('Max healers (default: 4)')
        .setRequired(false))
    .addIntegerOption(option =>
      option.setName('dps')
        .setDescription('Max DPS (default: 14)')
        .setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('group')
    .setDescription('Create a group session (M+ keys, timewalking, dungeons, etc.)')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Session name (e.g. Wednesday M+ Push)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Date and time (e.g. 2026-04-10 20:00)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('description')
        .setDescription('Optional notes (e.g. High keys, bring consumes)')
        .setRequired(false))
    .toJSON(),

  new SlashCommandBuilder()
    .setName('link')
    .setDescription('Link your Discord account to Battle.net for raid signups and group building')
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(config.botToken);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        Buffer.from(config.botToken.split('.')[0], 'base64').toString(),
        config.guildId
      ),
      { body: commands }
    );
    console.log('Slash commands registered successfully!');
  } catch (error) {
    console.error('Error registering commands:', error);
  }
})();
