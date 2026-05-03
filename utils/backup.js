const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { getData, saveData } = require('./dataManager');

const BACKUP_DIR = path.join(__dirname, '..', 'backups');

if (!fs.existsSync(BACKUP_DIR)) fs.mkdirSync(BACKUP_DIR, { recursive: true });

/**
 * Creates a full server backup. Returns the backup ID.
 */
async function createBackup(guild) {
  const data = getData();
  if (data.backups.length >= 40) {
    throw new Error('Достигнут лимит в 40 бекапов. Удалите старые перед созданием нового.');
  }

  const backup = {
    id: uuidv4(),
    guildId: guild.id,
    guildName: guild.name,
    createdAt: new Date().toISOString(),
    channels: [],
    roles: [],
    emojis: [],
  };

  // Roles
  const roles = [...guild.roles.cache.values()].sort((a, b) => b.position - a.position);
  for (const role of roles) {
    if (role.managed || role.id === guild.id) continue;
    backup.roles.push({
      name: role.name,
      color: role.color,
      hoist: role.hoist,
      permissions: role.permissions.bitfield.toString(),
      mentionable: role.mentionable,
      position: role.position,
    });
  }

  // Channels
  const channels = [...guild.channels.cache.values()];
  for (const ch of channels) {
    const chData = {
      name: ch.name,
      type: ch.type,
      position: ch.position,
      topic: ch.topic || null,
      nsfw: ch.nsfw || false,
      parentName: ch.parent ? ch.parent.name : null,
      permissionOverwrites: [],
    };
    for (const [id, overwrite] of ch.permissionOverwrites.cache) {
      chData.permissionOverwrites.push({
        id, type: overwrite.type,
        allow: overwrite.allow.bitfield.toString(),
        deny: overwrite.deny.bitfield.toString(),
      });
    }
    backup.channels.push(chData);
  }

  // Emojis
  for (const emoji of guild.emojis.cache.values()) {
    backup.emojis.push({ name: emoji.name, url: emoji.imageURL() });
  }

  const filename = `backup_${backup.id}.hfbackup`;
  const filepath = path.join(BACKUP_DIR, filename);
  fs.writeFileSync(filepath, JSON.stringify(backup, null, 2), 'utf8');

  data.backups.push({ id: backup.id, name: guild.name, createdAt: backup.createdAt, file: filename });
  saveData();

  return backup.id;
}

/**
 * Restores guild from a backup by ID.
 */
async function restoreBackup(guild, backupId) {
  const data = getData();
  const entry = data.backups.find(b => b.id === backupId);
  if (!entry) throw new Error(`Бекап с ID \`${backupId}\` не найден.`);

  const filepath = path.join(BACKUP_DIR, entry.file);
  if (!fs.existsSync(filepath)) throw new Error('Файл бекапа не найден на диске.');

  const backup = JSON.parse(fs.readFileSync(filepath, 'utf8'));

  // Delete channels
  for (const ch of guild.channels.cache.values()) {
    await ch.delete().catch(() => {});
  }

  // Recreate categories first
  const categoryMap = {};
  const categories = backup.channels.filter(c => c.type === 4);
  for (const cat of categories) {
    try {
      const created = await guild.channels.create({
        name: cat.name, type: 4, position: cat.position,
      });
      categoryMap[cat.name] = created.id;
    } catch (_) {}
  }

  // Recreate other channels
  const others = backup.channels.filter(c => c.type !== 4);
  for (const ch of others) {
    try {
      await guild.channels.create({
        name: ch.name, type: ch.type, position: ch.position,
        topic: ch.topic, nsfw: ch.nsfw,
        parent: ch.parentName ? categoryMap[ch.parentName] : null,
      });
    } catch (_) {}
  }

  return backup;
}

/**
 * Deletes a backup by ID.
 */
function deleteBackup(backupId) {
  const data = getData();
  const idx = data.backups.findIndex(b => b.id === backupId);
  if (idx === -1) throw new Error(`Бекап \`${backupId}\` не найден.`);

  const entry = data.backups[idx];
  const filepath = path.join(BACKUP_DIR, entry.file);
  if (fs.existsSync(filepath)) fs.unlinkSync(filepath);

  data.backups.splice(idx, 1);
  saveData();
}

module.exports = { createBackup, restoreBackup, deleteBackup };
