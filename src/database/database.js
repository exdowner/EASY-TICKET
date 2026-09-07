const fs = require('fs');
const path = require('path');

// ====== TENTA VÁRIOS LOCAIS E CRIA ======
const possiblePaths = [
  '/tmp/easy-ticket-data',
  '/data/easy-ticket-data',
  path.join(__dirname, '..', 'data')
];

let DATA_DIR = null;
for (const p of possiblePaths) {
  try {
    if (!fs.existsSync(p)) {
      fs.mkdirSync(p, { recursive: true });
      console.log(`📁 Pasta criada: ${p}`);
    } else {
      console.log(`✅ Pasta existe: ${p}`);
    }
    DATA_DIR = p;
    break;
  } catch (e) {
    console.log(`❌ Falha em ${p}:`, e.message);
  }
}

// Fallback: pasta local
if (!DATA_DIR) {
  DATA_DIR = path.join(__dirname, '..', 'data');
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  console.log(`✅ Fallback: ${DATA_DIR}`);
}

const CONFIGS_FILE = path.join(DATA_DIR, 'configs.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');

// Inicializa os arquivos se não existirem
function initFiles() {
  [CONFIGS_FILE, TICKETS_FILE, LICENSES_FILE].forEach(file => {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([]));
      console.log(`📄 Arquivo criado: ${path.basename(file)}`);
    }
  });
}
initFiles();

// ====== FUNÇÕES ======
function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch (e) {
    console.error('❌ Erro ao ler:', e);
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (e) {
    console.error('❌ Erro ao escrever:', e);
    return false;
  }
}

// ====== CONFIGURAÇÕES ======
function getConfig(guildId) {
  const configs = readJSON(CONFIGS_FILE);
  return configs.find(c => c.guildId === guildId) || null;
}

function updateConfig(guildId, data) {
  let configs = readJSON(CONFIGS_FILE);
  const index = configs.findIndex(c => c.guildId === guildId);
  
  if (index !== -1) {
    configs[index] = { ...configs[index], ...data };
  } else {
    configs.push({ guildId, ...data });
  }
  
  writeJSON(CONFIGS_FILE, configs);
  return getConfig(guildId);
}

function incrementTicketCounter(guildId) {
  const config = getConfig(guildId);
  const current = config?.ticketCounter || 0;
  updateConfig(guildId, { ticketCounter: current + 1 });
  return current + 1;
}

// ====== TICKETS ======
function getTickets(guildId, userId = null) {
  const tickets = readJSON(TICKETS_FILE);
  let filtered = tickets.filter(t => t.guildId === guildId);
  if (userId) filtered = filtered.filter(t => t.userId === userId);
  return filtered;
}

function getTicket(channelId) {
  const tickets = readJSON(TICKETS_FILE);
  return tickets.find(t => t.channelId === channelId);
}

function createTicket(data) {
  const tickets = readJSON(TICKETS_FILE);
  tickets.push(data);
  writeJSON(TICKETS_FILE, tickets);
  return data;
}

function updateTicket(channelId, updates) {
  const tickets = readJSON(TICKETS_FILE);
  const index = tickets.findIndex(t => t.channelId === channelId);
  if (index === -1) return null;
  tickets[index] = { ...tickets[index], ...updates };
  writeJSON(TICKETS_FILE, tickets);
  return tickets[index];
}

// ====== LICENÇAS ======
function getLicenses() {
  return readJSON(LICENSES_FILE);
}

function saveLicenses(licenses) {
  writeJSON(LICENSES_FILE, licenses);
}

function generateLicense(guildId, buyerName, days = 30) {
  const licenses = getLicenses();
  const filtered = licenses.filter(l => l.guildId !== guildId);
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  
  const license = {
    code,
    guildId,
    buyerName,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString(),
    status: 'active'
  };
  
  filtered.push(license);
  saveLicenses(filtered);
  return license;
}

function verifyLicenseByCode(code) {
  const licenses = getLicenses();
  return licenses.find(l => 
    l.code === code && 
    l.status === 'active' &&
    new Date(l.expiresAt) > new Date()
  ) || null;
}

function verifyLicenseByGuild(guildId) {
  const licenses = getLicenses();
  return licenses.find(l => 
    l.guildId === guildId && 
    l.status === 'active' &&
    new Date(l.expiresAt) > new Date()
  ) || null;
}

module.exports = {
  getConfig,
  updateConfig,
  incrementTicketCounter,
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  generateLicense,
  verifyLicenseByCode,
  verifyLicenseByGuild
};
