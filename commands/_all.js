const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');
const { getData, saveData } = require('../utils/dataManager');
const { setupAutomod } = require('../utils/automod');
const { log } = require('../utils/logger');
const config = require('../config');

function ownerOnly(interaction) {
  if (interaction.user.id !== config.OWNER_ID) {
    interaction.reply({ content: '❌ Только владелец бота.', ephemeral: true });
    return true;
  }
  return false;
}

// ── /lockdown ──────────────────────────────────────────────────────────────
const lockdown = {
  data: new SlashCommandBuilder().setName('lockdown').setDescription('🔒 Запретить писать всем участникам (кроме владельца сервера)'),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    const guild = client.guilds.cache.get(config.GUILD_ID);
    await interaction.deferReply({ ephemeral: true });
    for (const ch of guild.channels.cache.values()) {
      if (!ch.isTextBased()) continue;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: false }).catch(() => {});
    }
    getData().lockdown = true; saveData();
    await log(client, { title: '🔒 Локдаун включён', description: `Включил ${interaction.user.tag}`, color: 0xff8800 });
    await interaction.editReply({ content: '✅ Локдаун включён. Никто не может писать.' });
  },
};

// ── /unlockdown ────────────────────────────────────────────────────────────
const unlockdown = {
  data: new SlashCommandBuilder().setName('unlockdown').setDescription('🔓 Снять локдаун'),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    const guild = client.guilds.cache.get(config.GUILD_ID);
    await interaction.deferReply({ ephemeral: true });
    for (const ch of guild.channels.cache.values()) {
      if (!ch.isTextBased()) continue;
      await ch.permissionOverwrites.edit(guild.roles.everyone, { SendMessages: null }).catch(() => {});
    }
    getData().lockdown = false; saveData();
    await log(client, { title: '🔓 Локдаун снят', description: `Снял ${interaction.user.tag}`, color: 0x00cc88 });
    await interaction.editReply({ content: '✅ Локдаун снят.' });
  },
};

// ── /raidmode ──────────────────────────────────────────────────────────────
const raidmode = {
  data: new SlashCommandBuilder().setName('raidmode').setDescription('🚨 Включить режим рейда (запретить вход новым участникам)'),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    getData().raidMode = true; saveData();
    await log(client, { title: '🚨 Raid Mode включён', description: `Включил ${interaction.user.tag}`, color: 0xff0000, dmOwner: true });
    await interaction.reply({ content: '✅ Raid Mode включён. Новые участники будут кикнуты.', ephemeral: true });
  },
};

// ── /unraidmode ────────────────────────────────────────────────────────────
const unraidmode = {
  data: new SlashCommandBuilder().setName('unraidmode').setDescription('✅ Выключить режим рейда'),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    getData().raidMode = false; saveData();
    await log(client, { title: '✅ Raid Mode выключен', description: `Выключил ${interaction.user.tag}`, color: 0x00cc88 });
    await interaction.reply({ content: '✅ Raid Mode выключен.', ephemeral: true });
  },
};

// ── /trust ─────────────────────────────────────────────────────────────────
const trust = {
  data: new SlashCommandBuilder()
    .setName('trust')
    .setDescription('✅ Добавить бота или пользователя в доверенный список')
    .addUserOption(o => o.setName('user').setDescription('Пользователь или бот').setRequired(true)),
  async execute(interaction) {
    if (ownerOnly(interaction)) return;
    const user = interaction.options.getUser('user');
    const data = getData();
    const list = user.bot ? data.trustedBots : data.trustedUsers;
    if (list.some(u => u.id === user.id)) {
      return interaction.reply({ content: `⚠️ **${user.tag}** уже в доверенных.`, ephemeral: true });
    }
    list.push({ id: user.id, tag: user.tag, addedAt: new Date().toISOString() });
    saveData();
    await interaction.reply({ content: `✅ **${user.tag}** добавлен в доверенные.`, ephemeral: true });
  },
};

// ── /untrust ───────────────────────────────────────────────────────────────
const untrust = {
  data: new SlashCommandBuilder()
    .setName('untrust')
    .setDescription('❌ Убрать бота или пользователя из доверенных')
    .addUserOption(o => o.setName('user').setDescription('Пользователь или бот').setRequired(true)),
  async execute(interaction) {
    if (ownerOnly(interaction)) return;
    const user = interaction.options.getUser('user');
    const data = getData();
    const listKey = user.bot ? 'trustedBots' : 'trustedUsers';
    data[listKey] = data[listKey].filter(u => u.id !== user.id);
    saveData();
    await interaction.reply({ content: `✅ **${user.tag}** убран из доверенных.`, ephemeral: true });
  },
};

// ── /trusted ───────────────────────────────────────────────────────────────
const trusted = {
  data: new SlashCommandBuilder().setName('trusted').setDescription('📋 Список доверенных ботов и пользователей'),
  async execute(interaction) {
    if (ownerOnly(interaction)) return;
    const data = getData();
    const userList = data.trustedUsers.map(u => `👤 \`${u.tag}\` (${u.id})`).join('\n') || '_Нет_';
    const botList = data.trustedBots.map(b => `🤖 \`${b.tag}\` (${b.id})`).join('\n') || '_Нет_';
    await interaction.reply({
      content: `**✅ Доверенные пользователи:**\n${userList}\n\n**✅ Доверенные боты:**\n${botList}`,
      ephemeral: true,
    });
  },
};

// ── /reset ─────────────────────────────────────────────────────────────────
const reset = {
  data: new SlashCommandBuilder().setName('reset').setDescription('⚠️ Сбросить настройки бота к заводским (очищает data.json)'),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    require('../utils/dataManager').resetData();
    await setupAutomod(client);
    await log(client, { title: '⚠️ Сброс настроек', description: 'data.json очищен, AutoMod пересоздан.', color: 0xff8800 });
    await interaction.reply({ content: '✅ Настройки сброшены.', ephemeral: true });
  },
};

// ── /addbanword ────────────────────────────────────────────────────────────
const addbanword = {
  data: new SlashCommandBuilder()
    .setName('addbanword')
    .setDescription('📝 Добавить слово в список банвордов')
    .addStringOption(o => o.setName('word').setDescription('Слово').setRequired(true)),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    const word = interaction.options.getString('word').toLowerCase();
    const data = getData();
    if (data.banWords.includes(word)) return interaction.reply({ content: `⚠️ Слово \`${word}\` уже есть.`, ephemeral: true });
    data.banWords.push(word); saveData();
    await setupAutomod(client);
    await interaction.reply({ content: `✅ Слово \`${word}\` добавлено. AutoMod обновлён.`, ephemeral: true });
  },
};

// ── /delbanword ────────────────────────────────────────────────────────────
const delbanword = {
  data: new SlashCommandBuilder()
    .setName('delbanword')
    .setDescription('🗑️ Удалить слово из списка банвордов')
    .addStringOption(o => o.setName('word').setDescription('Слово').setRequired(true)),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    const word = interaction.options.getString('word').toLowerCase();
    const data = getData();
    data.banWords = data.banWords.filter(w => w !== word); saveData();
    await setupAutomod(client);
    await interaction.reply({ content: `✅ Слово \`${word}\` удалено. AutoMod обновлён.`, ephemeral: true });
  },
};

// ── /banwords ──────────────────────────────────────────────────────────────
const banwords = {
  data: new SlashCommandBuilder().setName('banwords').setDescription('📋 Список запрещённых слов'),
  async execute(interaction) {
    if (ownerOnly(interaction)) return;
    const data = getData();
    const list = data.banWords.length ? data.banWords.map(w => `\`${w}\``).join(', ') : '_Нет_';
    await interaction.reply({ content: `**🚫 Банворды:**\n${list}`, ephemeral: true });
  },
};

// ── /addbanurl ─────────────────────────────────────────────────────────────
const addbanurl = {
  data: new SlashCommandBuilder()
    .setName('addbanurl')
    .setDescription('🔗 Добавить URL в чёрный список')
    .addStringOption(o => o.setName('url').setDescription('URL').setRequired(true)),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    const url = interaction.options.getString('url').toLowerCase();
    const data = getData();
    if (data.banUrls.includes(url)) return interaction.reply({ content: `⚠️ URL уже есть.`, ephemeral: true });
    data.banUrls.push(url); saveData();
    await setupAutomod(client);
    await interaction.reply({ content: `✅ URL \`${url}\` добавлен. AutoMod обновлён.`, ephemeral: true });
  },
};

// ── /delbanurl ─────────────────────────────────────────────────────────────
const delbanurl = {
  data: new SlashCommandBuilder()
    .setName('delbanurl')
    .setDescription('🗑️ Удалить URL из чёрного списка')
    .addStringOption(o => o.setName('url').setDescription('URL').setRequired(true)),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    const url = interaction.options.getString('url').toLowerCase();
    const data = getData();
    data.banUrls = data.banUrls.filter(u => u !== url); saveData();
    await setupAutomod(client);
    await interaction.reply({ content: `✅ URL \`${url}\` удалён. AutoMod обновлён.`, ephemeral: true });
  },
};

// ── /bannedurls ────────────────────────────────────────────────────────────
const bannedurls = {
  data: new SlashCommandBuilder().setName('bannedurls').setDescription('📋 Список запрещённых URL'),
  async execute(interaction) {
    if (ownerOnly(interaction)) return;
    const data = getData();
    const list = data.banUrls.length ? data.banUrls.map(u => `\`${u}\``).join('\n') : '_Нет_';
    await interaction.reply({ content: `**🔗 Запрещённые URL:**\n${list}`, ephemeral: true });
  },
};

// ── /automodreset ──────────────────────────────────────────────────────────
const automodreset = {
  data: new SlashCommandBuilder().setName('automodreset').setDescription('⚙️ Удалить все правила AutoMod Discord и создать заново'),
  async execute(interaction, client) {
    if (ownerOnly(interaction)) return;
    await interaction.deferReply({ ephemeral: true });
    await setupAutomod(client);
    await interaction.editReply({ content: '✅ Все правила AutoMod сброшены и воссозданы.' });
  },
};

module.exports = {
  lockdown, unlockdown, raidmode, unraidmode,
  trust, untrust, trusted, reset,
  addbanword, delbanword, banwords,
  addbanurl, delbanurl, bannedurls,
  automodreset,
};
