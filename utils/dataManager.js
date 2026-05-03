const fs = require('fs');
const path = require('path');

const DATA_PATH = path.join(__dirname, '..', 'data.json');

const DEFAULT_DATA = {
  trustedUsers: [],       // [{ id, tag, addedAt }]
  trustedBots: [],        // [{ id, tag, addedAt }]
  banWords: [],           // string[]
  banUrls: [],            // string[]
  backups: [],            // [{ id, name, createdAt, file }]
  stats: {
    preventiveBans: 0,
    botsBanned: 0,
    channelsDeleted: 0,
    messagesDeleted: 0,
    raidsDetected: 0,
  },
  lockdown: false,
  raidMode: false,
  startTime: Date.now(),
};

let data = null;

async function initData() {
  if (!fs.existsSync(DATA_PATH)) {
    data = JSON.parse(JSON.stringify(DEFAULT_DATA));
    saveData();
    console.log('[DATA] data.json создан.');
  } else {
    data = JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    // Merge missing keys
    for (const key of Object.keys(DEFAULT_DATA)) {
      if (data[key] === undefined) data[key] = DEFAULT_DATA[key];
    }
    console.log('[DATA] data.json загружен.');
  }
}

function saveData() {
  fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2), 'utf8');
}

function getData() {
  return data;
}

function resetData() {
  data = JSON.parse(JSON.stringify(DEFAULT_DATA));
  data.startTime = Date.now();
  saveData();
}

module.exports = { initData, saveData, getData, resetData };
