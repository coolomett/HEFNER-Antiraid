const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { getData } = require('../utils/dataManager');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('status')
    .setDescription('📊 Статус бота: аптайм, статистика, режимы'),

  async execute(interaction, client) {
    const data = getData();
    const guild = client.guilds.cache.get(config.GUILD_ID);

    const uptimeMs = Date.now() - data.startTime;
    const d = Math.floor(uptimeMs / 86400000);
    const h = Math.floor((uptimeMs % 86400000) / 3600000);
    const m = Math.floor((uptimeMs % 3600000) / 60000);
    const uptime = `${d}д ${h}ч ${m}м`;

    const webhooks = guild ? (await guild.fetchWebhooks().catch(() => new Map())).size : 'N/A';
    const memberCount = guild ? guild.memberCount : 'N/A';

    const embed = new EmbedBuilder()
      .setTitle('🛡️ HEFNER AntiRaid | Статус')
      .setColor(0x5865F2)
      .addFields(
        { name: '⏱️ Аптайм', value: uptime, inline: true },
        { name: '🔒 Локдаун', value: data.lockdown ? '✅ Включён' : '❌ Выключен', inline: true },
        { name: '🚨 Рейд-мод', value: data.raidMode ? '✅ Включён' : '❌ Выключен', inline: true },
        { name: '🚫 Превентивных банов', value: `${data.stats.preventiveBans}`, inline: true },
        { name: '🤖 Ботов забанено', value: `${data.stats.botsBanned}`, inline: true },
        { name: '👥 Участников на сервере', value: `${memberCount}`, inline: true },
        { name: '🗑️ Каналов удалено', value: `${data.stats.channelsDeleted}`, inline: true },
        { name: '💬 Сообщений удалено', value: `${data.stats.messagesDeleted}`, inline: true },
        { name: '🚨 Рейдов зафиксировано', value: `${data.stats.raidsDetected}`, inline: true },
        { name: '🔗 Вебхуков на сервере', value: `${webhooks}`, inline: true },
        { name: '✅ Доверенных пользователей', value: `${data.trustedUsers.length}`, inline: true },
        { name: '✅ Доверенных ботов', value: `${data.trustedBots.length}`, inline: true },
      )
      .setTimestamp()
      .setFooter({ text: 'HEFNER AntiRaid | INSTANT' });

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};
