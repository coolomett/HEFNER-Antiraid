# 🛡️ HEFNER AntiRaid | INSTANT

Профессиональный Discord-бот защиты от рейдов для сервера **HEFNER SQUAD**.

---

## ⚡ Быстрый старт

### 1. Заполни `config.js`
```js
TOKEN:         'токен бота из Discord Developer Portal'
CLIENT_ID:     'ID приложения/бота'
OWNER_ID:      'твой Discord ID (владелец)'
GUILD_ID:      'ID сервера'
LOG_CHANNEL_ID:'ID канала для логов'
```

### 2. Установка на Ubuntu 22.04 (дедик)
```bash
chmod +x install.sh
sudo bash install.sh
```
Скрипт автоматически:
- Установит Node.js 20
- Скопирует бота в `/opt/hefner-antiraid`
- Создаст и запустит системную службу `hefner-antiraid`

### 3. Управление службой
```bash
systemctl status hefner-antiraid    # статус
systemctl restart hefner-antiraid   # перезапуск
journalctl -u hefner-antiraid -f    # логи в реальном времени
```

---

## 📁 Структура проекта
```
hefner-antiraid/
├── index.js                  # Точка входа
├── config.js                 # ⚠️ Конфигурация (заполни!)
├── data.json                 # Данные бота (создаётся автоматически)
├── package.json
├── install.sh                # Скрипт установки
├── hefner-antiraid.service   # systemd-служба
├── backups/                  # Бекапы сервера (.hfbackup)
├── commands/                 # Slash-команды
├── handlers/
│   ├── commandHandler.js
│   ├── eventHandler.js
│   └── events/               # Обработчики событий
└── utils/
    ├── antiraid.js           # Ядро защиты
    ├── automod.js            # Управление AutoMod
    ├── backup.js             # Система бекапов
    ├── dataManager.js        # Управление data.json
    └── logger.js             # Логирование
```

---

## 🛡️ Защита (автоматическая)

| Угроза | Действие |
|---|---|
| Массовый вход (≥5 за 10с) | Авто-включение Raid Mode + DM владельцу |
| Подозрительный бот | Бан при первом нарушении |
| Discord-инвайт | Удаление сообщения + таймаут |
| Транслит инвайта | `d i s c o r d .g g` → удаление |
| Zalgo-символы | Удаление + таймаут |
| Unicode-шрифты | Удаление + таймаут |
| Markdown-абьюз | Удаление + таймаут |
| Банворд/BanURL | Удаление + таймаут |
| Канал "cr4sh3d" | Мгновенное удаление |
| AutoMod | Работает даже когда бот оффлайн |

---

## 📋 Команды

| Команда | Описание |
|---|---|
| `/help` | Полный справочник |
| `/status` | Статус, аптайм, статистика |
| `/scan` | Сканирование сервера |
| `/backup` | Создать бекап |
| `/backups` | Список бекапов |
| `/restore <ID>` | Восстановить бекап |
| `/delbackup <ID>` | Удалить бекап |
| `/purge` | Очистить весь канал |
| `/lockdown` / `/unlockdown` | Блокировка сервера |
| `/raidmode` / `/unraidmode` | Режим рейда |
| `/trust` / `/untrust` | Доверенные |
| `/trusted` | Список доверенных |
| `/addbanword` / `/delbanword` / `/banwords` | Банворды |
| `/addbanurl` / `/delbanurl` / `/bannedurls` | Чёрный список URL |
| `/automodreset` | Пересоздать AutoMod |
| `/reset` | Заводской сброс |

---

## 💾 Бекапы
- Формат: `.hfbackup` (JSON)
- Хранятся в папке `backups/`
- Максимум: **40 бекапов**
- Сохраняют: каналы, категории, роли, эмодзи
