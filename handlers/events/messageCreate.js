const {
  isZalgo, hasInviteLink, hasUnicodeFonts, hasMarkdownAbuse,
  hasBanWord, hasBanUrl, performBan, isTrusted,
} = require('../../utils/antiraid');
const { getData, saveData } = require('../../utils/dataManager');
const { log } = require('../../utils/logger');
const config = require('../../config');

module.exports = {
  name: 'messageCreate',
  async execute(message, client) {
    if (!message.guild || message.guild.id !== config.GUILD_ID) return;
    if (message.author.id === client.user.id) return;
    if (isTrusted(message.author.id)) return;

    const content = message.content;
    const data = getData();
    let reason = null;

    if (isZalgo(content)) reason = 'Zalgo-символы';
    else if (hasInviteLink(content)) reason = 'Discord-инвайт ссылка (включая транслит)';
    else if (hasUnicodeFonts(content)) reason = 'Нестандартный Unicode-шрифт';
    else if (hasMarkdownAbuse(content)) reason = 'Злоупотребление markdown';
    else if (hasBanWord(content)) reason = 'Запрещённое слово';
    else if (hasBanUrl(content)) reason = 'Запрещённый URL';

    if (reason) {
      try {
        await message.delete();
        data.stats.messagesDeleted++;
        saveData();
      } catch (_) {}

      await log(client, {
        title: '🗑️ Сообщение удалено',
        description: `**Автор:** ${message.author.tag} (${message.author.id})\n**Причина:** ${reason}\n**Канал:** <#${message.channelId}>`,
        color: 0xff8800,
      });

      // Ban bots instantly on first offense
      if (message.author.bot) {
        const member = message.member || await message.guild.members.fetch(message.author.id).catch(() => null);
        if (member) {
          await performBan(member, `Сообщение нарушает правила: ${reason}`, client, true);
        }
      }

      // Warn/timeout regular user
      else {
        const member = message.member;
        if (member) {
          try {
            await member.timeout(5 * 60 * 1000, `[HEFNER AntiRaid] ${reason}`);
          } catch (_) {}
          await message.channel.send({
            content: `<@${message.author.id}>, твоё сообщение удалено: **${reason}**. Повторное нарушение = бан.`,
          }).then(m => setTimeout(() => m.delete().catch(() => {}), 7000));
        }
      }
    }
  },
};
