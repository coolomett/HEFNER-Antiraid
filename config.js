module.exports = {
  // ============================
  //  ВСТАВЬ СВОИ ДАННЫЕ СЮДА
  // ============================
  TOKEN: 'ВАШ_ТОКЕН_БОТА',
  CLIENT_ID: 'ID_ВАШЕГО_БОТА',

  // ID владельца бота (ты)
  OWNER_ID: 'ВАШ_DISCORD_ID',

  // ID сервера, к которому привязан бот
  GUILD_ID: 'ID_ВАШЕГО_СЕРВЕРА',

  // ID канала для логов
  LOG_CHANNEL_ID: 'ID_КАНАЛА_ЛОГОВ',
  // ============================

  // Порог для авто-рейдмода: N новых пользователей за RAID_WINDOW мс
  RAID_JOIN_THRESHOLD: 5,
  RAID_WINDOW_MS: 10000,

  // Макс. количество бекапов
  MAX_BACKUPS: 40,

  // Подозрительные паттерны в именах каналов
  SUSPICIOUS_CHANNEL_PATTERNS: [
    /cr4sh/i, /nuked/i, /owned/i, /rekt/i, /hacked/i, /raid/i,
    /destroyed/i, /pwned/i, /0wn3d/i, /c[r4]4sh/i, /fr33/i,
  ],

  // Подозрительные паттерны в именах пользователей
  SUSPICIOUS_NAME_PATTERNS: [
    /r[a4]id/i, /nuk[e3]/i, /cr[a4]sh/i, /h[a4]ck/i, /sp[a4]m/i, /b[o0]t/i,
  ],
};
