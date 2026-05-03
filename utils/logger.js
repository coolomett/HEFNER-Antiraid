const { EmbedBuilder } = require('discord.js');
const config = require('../config');

/**
 * Sends a log embed to the log channel and optionally DMs the owner.
 * @param {Client} client
 * @param {object} opts
 */
async function log(client, { title, description, color = 0xff4444, dmOwner = false, fields = [] }) {
  const embed = new EmbedBuilder()
    .setTitle(`🛡️ ${title}`)
    .setDescription(description)
    .setColor(color)
    .setTimestamp()
    .setFooter({ text: 'HEFNER AntiRaid | INSTANT' });

  if (fields.length) embed.addFields(fields);

  // Log channel
  try {
    const guild = client.guilds.cache.get(config.GUILD_ID);
    if (guild) {
      const ch = guild.channels.cache.get(config.LOG_CHANNEL_ID);
      if (ch) await ch.send({ embeds: [embed] });
    }
  } catch (_) {}

  // DM owner
  if (dmOwner) {
    try {
      const owner = await client.users.fetch(config.OWNER_ID);
      if (owner) await owner.send({ embeds: [embed] });
    } catch (_) {}
  }

  console.log(`[LOG] ${title}: ${description}`);
}

module.exports = { log };
