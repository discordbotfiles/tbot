const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
require('dotenv').config();

const commands = [];

const commandsPath = path.join(__dirname, 'cmds');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));

  // Only push slash commands (those with data.toJSON)
  if (command.data && typeof command.data.toJSON === 'function') {
    commands.push(command.data.toJSON());
  }
}

const rest = new REST().setToken(process.env.BOT_TOKEN);

(async () => {
  try {
    console.log(`🔄 Registering ${commands.length} slash commands...`);

    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );

    console.log('✅ Slash commands deployed successfully.');
  } catch (error) {
    console.error('❌ Error registering commands:', error);
  }
})();
