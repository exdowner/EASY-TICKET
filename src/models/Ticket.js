const mongoose = require('mongoose');

const TicketSchema = new mongoose.Schema({
  guildId: String,
  channelId: String,
  userId: String,
  userName: String,
  userTag: String,
  category: String,
  categoryLabel: String,
  status: {
    type: String,
    enum: ['open', 'claimed', 'closed', 'resolved'],
    default: 'open'
  },
  claimedBy: String,
  claimedByName: String,
  transcript: String,
  createdAt: { type: Date, default: Date.now },
  closedAt: Date
});

module.exports = mongoose.model('Ticket', TicketSchema);
