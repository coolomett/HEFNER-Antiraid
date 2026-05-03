const { SlashCommandBuilder } = require('discord.js');
const { getData, saveData } = require('../utils/dataManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('purge')
    .setDescription('🗑️ Полностью очистить текущий канал от всех сообщений'),

  async execute(interaction, client) {
    if (interaction.user.id !== config.OWNER_ID) {
      return interaction.reply({ content: '❌ Только владелец бота.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const channel = interaction.channel;
    let total = 0;

    // Bulk delete in batches of 100, then 1-by-1 for old messages
    let fetched;
    do {
      fetched = await channel.messages.fetch({ limit: 100 });
      if (!fetched.size) break;

      // Discord can only bulk-delete messages < 14 days old
      const fresh = fetched.filter(m => Date.now() - m.createdTimestamp < 12096e5);
      const old = fetched.filter(m => Date.now() - m.createdTimestamp >= 12096e5);

      if (fresh.size > 1) await channel.bulkDelete(fresh, true).catch(() => {});
      else if (fresh.size === 1) await fresh.first().delete().catch(() => {});

      for (const msg of old.values()) await msg.delete().catch(() => {});

      total += fetched.size;
    } while (fetched.size >= 2);

    const data = getData();
    data.stats.messagesDeleted += total;
    saveData();

    await interaction.editReply({ content: `✅ Канал очищен. Удалено: **${total}** сообщений.` });
  },
};
