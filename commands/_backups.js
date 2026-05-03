const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { createBackup, restoreBackup, deleteBackup } = require('../utils/backup');
const { getData } = require('../utils/dataManager');
const config = require('../config');

function ownerOnly(interaction) {
  if (interaction.user.id !== config.OWNER_ID) {
    interaction.reply({ content: '❌ Только владелец бота может использовать эту команду.', ephemeral: true });
    return true;
  }
  return false;
}

// /backup
const backupCmd = {
  data: new SlashCommandBuilder()
    .setName('backup')
    .setDescription('💾 Создать бекап текущего состояния сервера'),

  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    await interaction.deferReply({ ephemeral: true });
    const guild = client.guilds.cache.get(config.GUILD_ID);
    try {
      const id = await createBackup(guild);
      await interaction.editReply({ content: `✅ Бекап создан!\n**ID:** \`${id}\`\nФормат: \`.hfbackup\`, папка: \`backups/\`` });
    } catch (e) {
      await interaction.editReply({ content: `❌ ${e.message}` });
    }
  },
};

// /backups
const backupsCmd = {
  data: new SlashCommandBuilder()
    .setName('backups')
    .setDescription('📋 Список всех бекапов сервера'),

  async execute(interaction) {
    if (ownerOnly(interaction)) return;
    const data = getData();
    if (!data.backups.length) {
      return interaction.reply({ content: '📭 Бекапов нет.', ephemeral: true });
    }
    const list = data.backups.map((b, i) =>
      `**${i + 1}.** \`${b.id}\`\n📅 ${b.createdAt} — ${b.name}`
    ).join('\n\n');
    const embed = new EmbedBuilder()
      .setTitle(`💾 Бекапы сервера (${data.backups.length}/40)`)
      .setDescription(list.slice(0, 4096))
      .setColor(0x5865F2)
      .setFooter({ text: 'HEFNER AntiRaid | INSTANT' });
    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};

// /restore
const restoreCmd = {
  data: new SlashCommandBuilder()
    .setName('restore')
    .setDescription('♻️ Восстановить сервер из бекапа')
    .addStringOption(o => o.setName('id').setDescription('ID бекапа').setRequired(true)),

  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    const id = interaction.options.getString('id');
    await interaction.deferReply({ ephemeral: true });
    const guild = client.guilds.cache.get(config.GUILD_ID);
    try {
      await restoreBackup(guild, id);
      await interaction.editReply({ content: `✅ Сервер восстановлен из бекапа \`${id}\`!` });
    } catch (e) {
      await interaction.editReply({ content: `❌ ${e.message}` });
    }
  },
};

// /delbackup
const delbackupCmd = {
  data: new SlashCommandBuilder()
    .setName('delbackup')
    .setDescription('🗑️ Удалить бекап по ID')
    .addStringOption(o => o.setName('id').setDescription('ID бекапа').setRequired(true)),

  async execute(interaction) {
    if (ownerOnly(interaction)) return;
    const id = interaction.options.getString('id');
    try {
      deleteBackup(id);
      await interaction.reply({ content: `✅ Бекап \`${id}\` удалён.`, ephemeral: true });
    } catch (e) {
      await interaction.reply({ content: `❌ ${e.message}`, ephemeral: true });
    }
  },
};

module.exports = { backupCmd, backupsCmd, restoreCmd, delbackupCmd };
