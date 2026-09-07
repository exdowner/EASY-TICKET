const mongoose = require('mongoose');

const LicenseSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true },
  guildId: { type: String, required: true, unique: true },
  buyerName: String,
  createdAt: { type: Date, default: Date.now },
  expiresAt: Date,
  status: {
    type: String,
    enum: ['active', 'expired', 'revoked'],
    default: 'active'
  }
});

module.exports = mongoose.model('License', LicenseSchema);
