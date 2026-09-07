const Config = require('../models/Config');
const Ticket = require('../models/Ticket');
const License = require('../models/License');

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

// ====== LICENÇAS ======
async function generateLicense(guildId, buyerName, days = 30) {
  await License.deleteMany({ guildId });
  
  const code = Math.random().toString(36).substring(2, 10).toUpperCase();
  const license = new License({
    code,
    guildId,
    buyerName,
    expiresAt: new Date(Date.now() + days * 24 * 60 * 60 * 1000),
    status: 'active'
  });
  return await license.save();
}

async function verifyLicenseByCode(code) {
  return await License.findOne({
    code,
    status: 'active',
    expiresAt: { $gt: new Date() }
  });
}

async function verifyLicenseByGuild(guildId) {
  console.log(`🔍 [VERIFY] Procurando licença para: ${guildId}`);
  
  try {
    const license = await License.findOne({
      guildId: guildId,
      status: 'active',
      expiresAt: { $gt: new Date() }
    });
    
    if (license) {
      console.log(`✅ [VERIFY] Licença ENCONTRADA: ${license.code}`);
      console.log(`   📅 Expira em: ${license.expiresAt}`);
      console.log(`   👤 Comprador: ${license.buyerName}`);
    } else {
      console.log(`❌ [VERIFY] Licença NÃO encontrada para ${guildId}`);
      
      const anyLicense = await License.findOne({ guildId: guildId });
      if (anyLicense) {
        console.log(`⚠️ [VERIFY] Licença encontrada mas com status: ${anyLicense.status}`);
        console.log(`   📅 Expira em: ${anyLicense.expiresAt}`);
      } else {
        console.log(`📭 [VERIFY] Nenhuma licença cadastrada para ${guildId}`);
      }
    }
    
    return license;
  } catch (error) {
    console.error(`❌ [VERIFY] Erro ao buscar licença:`, error);
    return null;
  }
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
