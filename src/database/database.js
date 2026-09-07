const fs = require('fs');
const path = require('path');

// ====== PASTA PERSISTENTE ======
const DATA_DIR = process.env.RENDER ? '/tmp/easy-ticket-data' : path.join(__dirname, '..', 'data');
const CONFIGS_FILE = path.join(DATA_DIR, 'configs.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');
const LICENSES_FILE = path.join(DATA_DIR, 'licenses.json');

// ====== CRIAR PASTA SE NÃO EXISTIR ======
if (!fs.existsSync(DATA_DIR)) {
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Pasta criada: ${DATA_DIR}`);
  } catch (e) {
    console.error('❌ Erro ao criar pasta:', e);
  }
}

// ====== FUNÇÕES AUXILIARES ======
function readJSON(file) {
  try {
    if (!fs.existsSync(file)) {
      fs.writeFileSync(file, JSON.stringify([]));
      return [];
    }
    const data = fs.readFileSync(file, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('❌ Erro ao ler arquivo:', error);
    return [];
  }
}

function writeJSON(file, data) {
  try {
    fs.writeFileSync(file, JSON.stringify(data, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Erro ao escrever arquivo:', error);
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
    code: code,
    guildId: guildId,
    buyerName: buyerName,
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
  const license = licenses.find(l => 
    l.code === code && 
    l.status === 'active' &&
    new Date(l.expiresAt) > new Date()
  );
  return license || null;
}

function verifyLicenseByGuild(guildId) {
  const licenses = getLicenses();
  const license = licenses.find(l => 
    l.guildId === guildId && 
    l.status === 'active' &&
    new Date(l.expiresAt) > new Date()
  );
  return license || null;
}

// ====== EXPORTAR ======
module.exports = {
  getConfig,
  updateConfig,
  incrementTicketCounter,
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  getLicenses,
  generateLicense,
  verifyLicenseByCode,
  verifyLicenseByGuild
};
