const { isSuspiciousChannelName, neutralizeRaid } = require('../../utils/antiraid');
const { log } = require('../../utils/logger');
const { getData, saveData } = require('../../utils/dataManager');
const config = require('../../config');

module.exports = {
  name: 'channelCreate',
  async execute(channel, client) {
    if (!channel.guild || channel.guild.id !== config.GUILD_ID) return;

    if (isSuspiciousChannelName(channel.name)) {
      const data = getData();
      data.stats.channelsDeleted++;
      saveData();

      try {
        await channel.delete('[HEFNER AntiRaid] Подозрительное название канала');
      } catch (_) {}

      await log(client, {
        title: '🚨 Подозрительный канал удалён',
        description: `Канал \`${channel.name}\` был немедленно удалён.`,
        color: 0xff0000,
        dmOwner: true,
      });
    }
  },
};
