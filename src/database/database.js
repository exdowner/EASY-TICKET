const fs = require('fs');
const path = require('path');

// Criar pasta data se não existir
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Arquivos de dados
const CONFIGS_FILE = path.join(dataDir, 'configs.json');
const TICKETS_FILE = path.join(dataDir, 'tickets.json');

// ============ FUNÇÕES AUXILIARES ============
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

// ============ CONFIGURAÇÕES ============
function getConfig(guildId) {
  const configs = readJSON(CONFIGS_FILE);
  return configs.find(c => c.guildId === guildId) || null;
}

function setConfig(guildId, data) {
  let configs = readJSON(CONFIGS_FILE);
  const index = configs.findIndex(c => c.guildId === guildId);
  
  if (index !== -1) {
    configs[index] = { guildId, ...data };
  } else {
    configs.push({ guildId, ...data });
  }
  
  return writeJSON(CONFIGS_FILE, configs);
}

function updateConfig(guildId, updates) {
  const config = getConfig(guildId);
  if (!config) {
    return setConfig(guildId, updates);
  }
  return setConfig(guildId, { ...config, ...updates });
}

// ============ TICKETS ============
function getTickets(guildId, userId = null) {
  const tickets = readJSON(TICKETS_FILE);
  let filtered = tickets.filter(t => t.guildId === guildId);
  
  if (userId) {
    filtered = filtered.filter(t => t.userId === userId);
  }
  
  return filtered;
}

function getTicket(channelId) {
  const tickets = readJSON(TICKETS_FILE);
  return tickets.find(t => t.channelId === channelId);
}

function createTicket(data) {
  const tickets = readJSON(TICKETS_FILE);
  tickets.push(data);
  return writeJSON(TICKETS_FILE, tickets);
}

function updateTicket(channelId, updates) {
  const tickets = readJSON(TICKETS_FILE);
  const index = tickets.findIndex(t => t.channelId === channelId);
  
  if (index === -1) return false;
  
  tickets[index] = { ...tickets[index], ...updates };
  return writeJSON(TICKETS_FILE, tickets);
}

function deleteTicket(channelId) {
  let tickets = readJSON(TICKETS_FILE);
  tickets = tickets.filter(t => t.channelId !== channelId);
  return writeJSON(TICKETS_FILE, tickets);
}

function getTicketCounter(guildId) {
  const config = getConfig(guildId);
  return config?.ticketCounter || 0;
}

function incrementTicketCounter(guildId) {
  const config = getConfig(guildId);
  const current = config?.ticketCounter || 0;
  updateConfig(guildId, { ticketCounter: current + 1 });
  return current + 1;
}

// ============ EXPORTAR ============
module.exports = {
  getConfig,
  setConfig,
  updateConfig,
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  deleteTicket,
  getTicketCounter,
  incrementTicketCounter,
  readJSON,
  writeJSON
};
