const Config = require('../models/Config');
const Ticket = require('../models/Ticket');

// ====== CONFIGURAÇÕES ======
async function getConfig(guildId) {
  return await Config.findOne({ guildId });
}

async function updateConfig(guildId, data) {
  return await Config.findOneAndUpdate(
    { guildId },
    { ...data, guildId },
    { upsert: true, new: true }
  );
}

async function incrementTicketCounter(guildId) {
  const config = await Config.findOneAndUpdate(
    { guildId },
    { $inc: { ticketCounter: 1 } },
    { upsert: true, new: true }
  );
  return config.ticketCounter;
}

// ====== TICKETS ======
async function getTickets(guildId, userId = null) {
  const filter = { guildId };
  if (userId) filter.userId = userId;
  return await Ticket.find(filter);
}

async function getTicket(channelId) {
  return await Ticket.findOne({ channelId });
}

async function createTicket(data) {
  const ticket = new Ticket(data);
  return await ticket.save();
}

async function updateTicket(channelId, updates) {
  return await Ticket.findOneAndUpdate(
    { channelId },
    updates,
    { new: true }
  );
}

// ====== UNLOCK (SALVAR SERVIDOR LIBERADO) ======
async function unlockGuild(guildId) {
  return await Config.findOneAndUpdate(
    { guildId },
    { guildId, unlocked: true },
    { upsert: true, new: true }
  );
}

async function isUnlocked(guildId) {
  const config = await Config.findOne({ guildId });
  return config?.unlocked === true;
}

module.exports = {
  getConfig,
  updateConfig,
  incrementTicketCounter,
  getTickets,
  getTicket,
  createTicket,
  updateTicket,
  unlockGuild,
  isUnlocked
};
