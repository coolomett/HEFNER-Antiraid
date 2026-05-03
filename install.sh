#!/bin/bash
# ============================================================
#  HEFNER AntiRaid | INSTANT — Установка на Ubuntu 22.04
# ============================================================
set -e

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  🛡️  HEFNER AntiRaid | INSTANT — Установка"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# 1. Обновление системы
echo "[1/6] Обновление системы..."
apt-get update -y && apt-get upgrade -y

# 2. Установка Node.js 20
echo "[2/6] Установка Node.js 20..."
if ! command -v node &> /dev/null; then
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
  apt-get install -y nodejs
fi
node -v && npm -v

# 3. Копирование файлов бота
echo "[3/6] Копирование файлов бота в /opt/hefner-antiraid..."
mkdir -p /opt/hefner-antiraid
cp -r ./* /opt/hefner-antiraid/
mkdir -p /opt/hefner-antiraid/backups

# 4. Установка зависимостей
echo "[4/6] Установка npm-зависимостей..."
cd /opt/hefner-antiraid
npm install --production

# 5. Установка systemd-службы
echo "[5/6] Установка службы systemd..."
cp /opt/hefner-antiraid/hefner-antiraid.service /etc/systemd/system/hefner-antiraid.service
systemctl daemon-reload
systemctl enable hefner-antiraid
systemctl start hefner-antiraid

# 6. Готово
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✅ Установка завершена!"
echo ""
echo "  ⚠️  ВАЖНО: Не забудь заполнить config.js:"
echo "      TOKEN, CLIENT_ID, OWNER_ID, GUILD_ID, LOG_CHANNEL_ID"
echo ""
echo "  Команды управления службой:"
echo "  • systemctl status hefner-antiraid  — статус"
echo "  • systemctl restart hefner-antiraid — перезапуск"
echo "  • systemctl stop hefner-antiraid    — остановить"
echo "  • journalctl -u hefner-antiraid -f  — логи"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
