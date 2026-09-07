const mongoose = require('mongoose');

const ConfigSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  categoryId: String,
  supportRoleId: String,
  logChannelId: String,
  ticketCounter: { type: Number, default: 0 },
  maxTicketsPerUser: { type: Number, default: 3 },
  embedConfig: {
    title: { type: String, default: '🎫 EASY TICKET' },
    description: { type: String, default: 'Clique no botão abaixo para abrir um ticket!' },
    color: { type: String, default: '#5865F2' },
    image: { type: String, default: '' },
    thumbnail: { type: String, default: '' },
    footer: { type: String, default: 'EASY TICKET © 2024' }
  },
  categories: { type: Array, default: [] }
}, { timestamps: true });

module.exports = mongoose.model('Config', ConfigSchema);
