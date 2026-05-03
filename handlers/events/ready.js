const { ActivityType } = require('discord.js');
const { setupAutomod } = require('../../utils/automod');
const { log } = require('../../utils/logger');
const config = require('../../config');

module.exports = {
  name: 'ready',
  once: true,
  async execute(client) {
    console.log(`[BOT] Вошёл как ${client.user.tag}`);

    // Status
    client.user.setPresence({
      activities: [{ name: 'Стоит на защите HEFNER SQUAD!', type: ActivityType.Playing }],
      status: 'online',
    });

    // Setup automod
    await setupAutomod(client);

    await log(client, {
      title: '✅ Бот запущен',
      description: `**HEFNER AntiRaid | INSTANT** запущен и готов к работе.\n\`${client.user.tag}\``,
      color: 0x00cc88,
      dmOwner: true,
    });

    // Scan for suspicious channels on start
    const guild = client.guilds.cache.get(config.GUILD_ID);
    if (guild) {
      for (const ch of guild.channels.cache.values()) {
        if (require('../../utils/antiraid').isSuspiciousChannelName(ch.name)) {
          await log(client, {
            title: '⚠️ Подозрительный канал при запуске',
            description: `Обнаружен канал \`${ch.name}\` (${ch.id})`,
            color: 0xffaa00,
          });
        }
      }
    }
  },
};
