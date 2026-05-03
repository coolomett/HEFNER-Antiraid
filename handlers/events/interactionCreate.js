const config = require('../../config');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction, client) {
    if (!interaction.isChatInputCommand()) return;
    if (interaction.guildId !== config.GUILD_ID) {
      return interaction.reply({ content: '❌ Этот бот привязан к другому серверу.', ephemeral: true });
    }

    const command = client.commands.get(interaction.commandName);
    if (!command) return;

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`[CMD ERROR] /${interaction.commandName}:`, err);
      const msg = { content: '❌ Ошибка при выполнении команды.', ephemeral: true };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(msg).catch(() => {});
      } else {
        await interaction.reply(msg).catch(() => {});
      }
    }
  },
};
