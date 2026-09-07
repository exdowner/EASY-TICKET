const fs = require('fs');
const path = require('path');

// ====== PASTA PERSISTENTE NO RENDER ======
// O Render mantém a pasta /tmp por mais tempo
const DATA_DIR = process.env.RENDER ? '/tmp/easy-ticket-data' : path.join(__dirname, '..', 'data');
const CONFIGS_FILE = path.join(DATA_DIR, 'configs.json');
const TICKETS_FILE = path.join(DATA_DIR, 'tickets.json');

// Criar pasta se não existir
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
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

// ====== EXPORTAR ======
module.exports = {
  getConfig,
  updateConfig,
  incrementTicketCounter,
  getTickets,
  getTicket,
  createTicket,
  updateTicket
};
