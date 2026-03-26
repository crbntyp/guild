const { REST, Routes, SlashCommandBuilder } = require('discord.js');
const config = require('./config');

const commands = [
  new SlashCommandBuilder()
    .setName('raid')
    .setDescription('Create a new raid event')
    .addStringOption(option =>
      option.setName('title')
        .setDescription('Raid name (e.g. The Voidspire)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('date')
        .setDescription('Date and time (e.g. 2026-04-10 20:00)')
        .setRequired(true))
    .addStringOption(option =>
      option.setName('difficulty')
        .setDescription('Difficulty level')
        .setRequired(false)
        .addChoices(
          { name: 'Normal', value: 'normal' },
          { name: 'Heroic', value: 'heroic' },
          { name: 'Mythic', value: 'mythic' }
        ))
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
    .toJSON()
];

const rest = new REST({ version: '10' }).setToken(config.botToken);

(async () => {
  try {
    console.log('Registering slash commands...');
    await rest.put(
      Routes.applicationGuildCommands(
        // Extract application ID from bot token (first part before the dot)
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
