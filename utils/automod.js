const { AutoModerationRuleEventType, AutoModerationActionType, AutoModerationRuleTriggerType } = require('discord.js');
const { getData } = require('./dataManager');
const { log } = require('./logger');

/**
 * Fully resets and recreates all AutoMod rules for the guild.
 */
async function setupAutomod(client) {
  const guild = client.guilds.cache.get(require('../config').GUILD_ID);
  if (!guild) return;

  // Delete ALL existing automod rules
  try {
    const rules = await guild.autoModerationRules.fetch();
    for (const rule of rules.values()) {
      await rule.delete().catch(() => {});
    }
  } catch (_) {}

  const data = getData();
  const logChannelId = require('../config').LOG_CHANNEL_ID;

  const actions = [
    { type: AutoModerationActionType.BlockMessage },
    ...(logChannelId
      ? [{ type: AutoModerationActionType.SendAlertMessage, metadata: { channel: logChannelId } }]
      : []),
    { type: AutoModerationActionType.Timeout, metadata: { durationSeconds: 60 } },
  ];

  // 1. Block keywords (banWords)
  if (data.banWords.length > 0) {
    await guild.autoModerationRules.create({
      name: 'HEFNER | Ban Words',
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Keyword,
      triggerMetadata: { keywordFilter: data.banWords },
      actions,
      enabled: true,
    }).catch(() => {});
  }

  // 2. Block discord invite links
  await guild.autoModerationRules.create({
    name: 'HEFNER | Block Invites',
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Keyword,
    triggerMetadata: {
      keywordFilter: [
        'discord.gg/*', 'discord.com/invite/*', 'dsc.gg/*',
        // Translit variations
        'd i s c o r d*', 'disc ord*', 'd!sc*', 'dlscord*', 'discоrd*',
      ],
      regexPatterns: [
        'discord[\\s\\S]{0,5}\\.gg',
        'discord[\\s\\S]{0,5}invite',
        'd[\\s\\-_]{0,3}i[\\s\\-_]{0,3}s[\\s\\-_]{0,3}c[\\s\\-_]{0,3}o[\\s\\-_]{0,3}r[\\s\\-_]{0,3}d',
      ],
    },
    actions,
    enabled: true,
  }).catch(() => {});

  // 3. Block spam
  await guild.autoModerationRules.create({
    name: 'HEFNER | Anti-Spam',
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.MentionSpam,
    triggerMetadata: { mentionTotalLimit: 5 },
    actions,
    enabled: true,
  }).catch(() => {});

  // 4. Block bad URLs
  if (data.banUrls.length > 0) {
    await guild.autoModerationRules.create({
      name: 'HEFNER | Ban URLs',
      eventType: AutoModerationRuleEventType.MessageSend,
      triggerType: AutoModerationRuleTriggerType.Keyword,
      triggerMetadata: { keywordFilter: data.banUrls },
      actions,
      enabled: true,
    }).catch(() => {});
  }

  // 5. Zalgo / markdown abuse
  await guild.autoModerationRules.create({
    name: 'HEFNER | Zalgo & Markdown',
    eventType: AutoModerationRuleEventType.MessageSend,
    triggerType: AutoModerationRuleTriggerType.Keyword,
    triggerMetadata: {
      regexPatterns: [
        // Zalgo: combining diacritical marks
        '[\\u0300-\\u036f\\u0489]{3,}',
        // Excessive bold/italic markdown
        '(\\*\\*){3,}',
        '(#{1,6}\\s*\\*\\*){2,}',
      ],
    },
    actions,
    enabled: true,
  }).catch(() => {});

  await log(client, {
    title: 'AutoMod обновлён',
    description: 'Все правила AutoMod были сброшены и воссозданы заново.',
    color: 0x00cc88,
  });
}

module.exports = { setupAutomod };
