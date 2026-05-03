const fs = require('fs');
const path = require('path');
const { REST, Routes } = require('discord.js');
const config = require('../config');

async function loadCommands(client) {
  const commandsPath = path.join(__dirname, '..', 'commands');
  const commandFiles = fs.readdirSync(commandsPath).filter(f => f.endsWith('.js'));
  const commands = [];

  for (const file of commandFiles) {
    const command = require(path.join(commandsPath, file));
    if (!command.data || !command.execute) continue;
    client.commands.set(command.data.name, command);
    commands.push(command.data.toJSON());
    console.log(`[CMD] Загружена команда: /${command.data.name}`);
  }

  const rest = new REST({ version: '10' }).setToken(config.TOKEN);
  try {
    console.log('[CMD] Регистрирую slash-команды...');
    await rest.put(
      Routes.applicationGuildCommands(config.CLIENT_ID, config.GUILD_ID),
      { body: commands }
    );
    console.log('[CMD] Slash-команды зарегистрированы.');
  } catch (err) {
    console.error('[CMD] Ошибка регистрации команд:', err);
  }
}

module.exports = { loadCommands };
