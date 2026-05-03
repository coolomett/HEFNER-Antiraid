const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { scanGuild } = require('../utils/antiraid');
const config = require('../config');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('scan')
    .setDescription('🔍 Сканирование сервера на подозрительных ботов, участников и каналы'),

  async execute(interaction, client) {
    if (interaction.user.id !== config.OWNER_ID) {
      return interaction.reply({ content: '❌ Только владелец бота может использовать эту команду.', ephemeral: true });
    }

    await interaction.deferReply({ ephemeral: true });
    const guild = client.guilds.cache.get(config.GUILD_ID);
    const report = await scanGuild(guild);

    const embed = new EmbedBuilder()
      .setTitle('🔍 Результаты сканирования сервера')
      .setColor(report.suspiciousBots.length || report.suspiciousMembers.length ? 0xff4444 : 0x00cc88)
      .setTimestamp()
      .setFooter({ text: 'HEFNER AntiRaid | INSTANT' });

    if (report.suspiciousBots.length) {
      embed.addFields({
        name: `🤖 Подозрительные боты (${report.suspiciousBots.length})`,
        value: report.suspiciousBots.map(b => `\`${b.tag}\` (${b.id}) — ${b.reason}`).join('\n').slice(0, 1024),
      });
    } else {
      embed.addFields({ name: '🤖 Подозрительные боты', value: '✅ Не найдены' });
    }

    if (report.suspiciousMembers.length) {
      embed.addFields({
        name: `👤 Подозрительные участники (${report.suspiciousMembers.length})`,
        value: report.suspiciousMembers.map(m => `\`${m.tag}\` (${m.id}) — ${m.reason}`).join('\n').slice(0, 1024),
      });
    } else {
      embed.addFields({ name: '👤 Подозрительные участники', value: '✅ Не найдены' });
    }

    if (report.suspiciousChannels.length) {
      embed.addFields({
        name: `📢 Подозрительные каналы (${report.suspiciousChannels.length})`,
        value: report.suspiciousChannels.map(c => `\`${c.name}\` (${c.id})`).join('\n').slice(0, 1024),
      });
    } else {
      embed.addFields({ name: '📢 Подозрительные каналы', value: '✅ Не найдены' });
    }

    await interaction.editReply({ embeds: [embed] });
  },
};
