const { PermissionsBitField } = require('discord.js');
const { getData, saveData } = require('./dataManager');
const { log } = require('./logger');
const config = require('../config');

// Track recent joins for raid detection
const recentJoins = [];

/**
 * Check if a user/bot is trusted.
 */
function isTrusted(id) {
  const data = getData();
  return (
    id === config.OWNER_ID ||
    data.trustedUsers.some(u => u.id === id) ||
    data.trustedBots.some(b => b.id === id)
  );
}

/**
 * Check if a member is a bot.
 */
function isBot(member) {
  return member.user.bot;
}

/**
 * Suspicion check for usernames / bot names.
 */
function isSuspiciousName(name) {
  return config.SUSPICIOUS_NAME_PATTERNS.some(p => p.test(name));
}

/**
 * Suspicion check for channel names.
 */
function isSuspiciousChannelName(name) {
  return config.SUSPICIOUS_CHANNEL_PATTERNS.some(p => p.test(name));
}

/**
 * Detect zalgo text.
 */
function isZalgo(text) {
  return /[\u0300-\u036f\u0489]{3,}/.test(text);
}

/**
 * Detect Discord invite links (including translit).
 */
function hasInviteLink(text) {
  const normalized = text.toLowerCase().replace(/\s+/g, '');
  return (
    /discord\.gg\//.test(normalized) ||
    /discord\.com\/invite\//.test(normalized) ||
    /dsc\.gg\//.test(normalized) ||
    /d[i!1]sc[o0]rd/.test(normalized)
  );
}

/**
 * Detect non-standard Unicode fonts (mathematical bold, italic, etc.)
 */
function hasUnicodeFonts(text) {
  // Mathematical bold, italic, script, fraktur, etc.
  return /[\u{1D400}-\u{1D7FF}]/u.test(text);
}

/**
 * Detect markdown abuse (excessive ** or # ** #)
 */
function hasMarkdownAbuse(text) {
  return /(\*\*){3,}/.test(text) || /(#{1,6}\s*\*\*){2,}/.test(text);
}

/**
 * Check if text contains banned words.
 */
function hasBanWord(text) {
  const data = getData();
  const lower = text.toLowerCase();
  return data.banWords.some(w => lower.includes(w.toLowerCase()));
}

/**
 * Check if text contains banned URLs.
 */
function hasBanUrl(text) {
  const data = getData();
  const lower = text.toLowerCase();
  return data.banUrls.some(u => lower.includes(u.toLowerCase()));
}

/**
 * Perform a ban.
 * @param {GuildMember} member
 * @param {string} reason
 * @param {Client} client
 * @param {boolean} isBot
 */
async function performBan(member, reason, client, isBotMember = false) {
  if (isTrusted(member.id)) return false;
  if (member.id === config.OWNER_ID) return false;

  try {
    await member.ban({ reason: `[HEFNER AntiRaid] ${reason}`, deleteMessageSeconds: 604800 });

    const data = getData();
    data.stats.preventiveBans++;
    if (isBotMember) data.stats.botsBanned++;
    saveData();

    await log(client, {
      title: isBotMember ? '🤖 Бот забанен' : '🚫 Участник забанен',
      description: `**${member.user.tag}** (${member.id})\n**Причина:** ${reason}`,
      color: 0xff2222,
      dmOwner: true,
    });
    return true;
  } catch (e) {
    console.error('[BAN ERROR]', e.message);
    return false;
  }
}

/**
 * Handle new member join (anti-raid logic).
 */
async function handleMemberJoin(member, client) {
  const data = getData();
  const guild = member.guild;

  // Check if guild matches
  if (guild.id !== config.GUILD_ID) return;

  // Raid mode: kick immediately
  if (data.raidMode) {
    try {
      await member.kick('[HEFNER AntiRaid] Включён режим рейда — новые участники не допускаются.');
    } catch (_) {}
    return;
  }

  // Track join time for raid detection
  const now = Date.now();
  recentJoins.push(now);
  // Remove old entries
  while (recentJoins.length && recentJoins[0] < now - config.RAID_WINDOW_MS) recentJoins.shift();

  if (recentJoins.length >= config.RAID_JOIN_THRESHOLD) {
    data.raidMode = true;
    data.stats.raidsDetected++;
    saveData();
    await log(client, {
      title: '🚨 РЕЙД ОБНАРУЖЕН!',
      description: `**${recentJoins.length}** пользователей зашли за ${config.RAID_WINDOW_MS / 1000}с.\nАвтоматически включён **Raid Mode**.`,
      color: 0xff0000,
      dmOwner: true,
    });
  }

  // Suspicious name check
  if (isSuspiciousName(member.user.username)) {
    await performBan(member, `Подозрительное имя: ${member.user.username}`, client, member.user.bot);
    return;
  }

  // Bot-specific checks
  if (member.user.bot && !isTrusted(member.id)) {
    await log(client, {
      title: '⚠️ Незнакомый бот зашёл на сервер',
      description: `**${member.user.tag}** (${member.id}) — не в списке доверенных. Будет забанен при первом подозрении.`,
      color: 0xffaa00,
      dmOwner: true,
    });
  }
}

/**
 * Scan guild for suspicious bots and members. Returns report.
 */
async function scanGuild(guild) {
  const report = { suspiciousBots: [], suspiciousMembers: [], suspiciousChannels: [] };

  const members = await guild.members.fetch();
  for (const member of members.values()) {
    if (isTrusted(member.id)) continue;
    if (member.user.bot && isSuspiciousName(member.user.username)) {
      report.suspiciousBots.push({ tag: member.user.tag, id: member.id, reason: 'Подозрительное имя' });
    } else if (!member.user.bot && isSuspiciousName(member.user.username)) {
      report.suspiciousMembers.push({ tag: member.user.tag, id: member.id, reason: 'Подозрительное имя' });
    }
  }

  for (const ch of guild.channels.cache.values()) {
    if (isSuspiciousChannelName(ch.name)) {
      report.suspiciousChannels.push({ name: ch.name, id: ch.id });
    }
  }

  return report;
}

/**
 * Neutralize raid: delete suspicious channels, ban untrusted bots.
 */
async function neutralizeRaid(guild, client) {
  const data = getData();

  // 1. Delete suspicious channels in parallel
  const delPromises = [];
  for (const ch of guild.channels.cache.values()) {
    if (isSuspiciousChannelName(ch.name)) {
      delPromises.push(ch.delete('[HEFNER AntiRaid] Подозрительный канал').then(() => {
        data.stats.channelsDeleted++;
      }).catch(() => {}));
    }
  }
  await Promise.all(delPromises);
  saveData();

  // 2. Ban untrusted bots
  const members = await guild.members.fetch();
  const banPromises = [];
  for (const member of members.values()) {
    if (member.user.bot && !isTrusted(member.id)) {
      banPromises.push(performBan(member, 'Нейтрализация рейда — подозрительный бот', client, true));
    }
  }
  await Promise.all(banPromises);

  await log(client, {
    title: '✅ Рейд нейтрализован',
    description: 'Подозрительные каналы удалены, подозрительные боты забанены.',
    color: 0x00cc88,
    dmOwner: true,
  });
}

module.exports = {
  isTrusted, isBot, isSuspiciousName, isSuspiciousChannelName,
  isZalgo, hasInviteLink, hasUnicodeFonts, hasMarkdownAbuse,
  hasBanWord, hasBanUrl, performBan, handleMemberJoin, scanGuild, neutralizeRaid,
};
