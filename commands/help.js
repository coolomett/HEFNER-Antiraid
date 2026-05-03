const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('help')
    .setDescription('📖 Полный справочник по функционалу и командам HEFNER AntiRaid'),

  async execute(interaction) {
    const embeds = [
      new EmbedBuilder()
        .setTitle('🛡️ HEFNER AntiRaid | INSTANT — Справочник')
        .setDescription('Полная документация по всем командам и функциям бота.')
        .setColor(0x5865F2)
        .addFields(
          { name: '📊 Информация', value: [
            '`/help` — Этот справочник',
            '`/status` — Статус бота: аптайм, статистика, режимы',
            '`/trusted` — Список доверенных ботов и пользователей',
            '`/banwords` — Список запрещённых слов',
            '`/bannedurls` — Список запрещённых URL',
          ].join('\n') },
          { name: '🔍 Сканирование', value: [
            '`/scan` — Сканирование сервера на подозрительных ботов и участников',
          ].join('\n') },
          { name: '💾 Бекапы', value: [
            '`/backup` — Создать бекап сервера (макс. 40)',
            '`/backups` — Список всех бекапов с ID',
            '`/restore <ID>` — Восстановить сервер из бекапа',
            '`/delbackup <ID>` — Удалить бекап',
          ].join('\n') },
        )
        .setFooter({ text: 'HEFNER AntiRaid | INSTANT • Страница 1/3' }),

      new EmbedBuilder()
        .setTitle('🛡️ HEFNER AntiRaid | INSTANT — Справочник')
        .setColor(0x5865F2)
        .addFields(
          { name: '🔒 Управление сервером', value: [
            '`/lockdown` — Запретить писать всем, кроме владельца',
            '`/unlockdown` — Снять локдаун',
            '`/raidmode` — Запретить вход новым участникам',
            '`/unraidmode` — Снять режим рейда',
            '`/purge` — Очистить весь канал от сообщений',
          ].join('\n') },
          { name: '👥 Доверенные', value: [
            '`/trust @user` — Добавить бота/пользователя в доверенный список',
            '`/untrust @user` — Убрать из доверенных',
          ].join('\n') },
          { name: '📝 Фильтры слов и URL', value: [
            '`/addbanword <слово>` — Добавить слово в список банвордов',
            '`/delbanword <слово>` — Удалить слово из списка',
            '`/addbanurl <url>` — Добавить URL в чёрный список',
            '`/delbanurl <url>` — Удалить URL из чёрного списка',
          ].join('\n') },
        )
        .setFooter({ text: 'HEFNER AntiRaid | INSTANT • Страница 2/3' }),

      new EmbedBuilder()
        .setTitle('🛡️ HEFNER AntiRaid | INSTANT — Справочник')
        .setColor(0x5865F2)
        .addFields(
          { name: '⚙️ Прочее', value: [
            '`/automodreset` — Сбросить все правила AutoMod Discord',
            '`/reset` — Сбросить настройки бота к заводским (очищает data.json)',
          ].join('\n') },
          { name: '🔐 Защита (автоматическая)', value: [
            '• **Анти-рейд** — автоматический ban ботов при подозрении, авто-raidmode при массовом входе',
            '• **Анти-инвайт** — удаление discord.gg ссылок, включая транслит ("d i s c o r d")',
            '• **Залго** — блокировка сообщений с zalgo-символами',
            '• **Unicode шрифты** — блокировка математических/необычных шрифтов',
            '• **Markdown-абьюз** — блокировка (**) и (# ** #) спама',
            '• **Подозрительные каналы** — мгновенное удаление каналов типа "cr4sh3d"',
            '• **AutoMod Discord** — правила работают даже когда бот оффлайн',
          ].join('\n') },
        )
        .setFooter({ text: 'HEFNER AntiRaid | INSTANT • Страница 3/3' }),
    ];

    await interaction.reply({ embeds, ephemeral: true });
  },
};
