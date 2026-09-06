const fs = require('fs');
const path = require('path');

const LICENSES_FILE = path.join(__dirname, '..', 'data', 'licenses.json');

// Criar pasta data se não existir
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Ler licenças
function getLicenses() {
  try {
    if (!fs.existsSync(LICENSES_FILE)) {
      fs.writeFileSync(LICENSES_FILE, JSON.stringify([]));
      return [];
    }
    return JSON.parse(fs.readFileSync(LICENSES_FILE, 'utf8'));
  } catch (error) {
    return [];
  }
}

// Salvar licenças
function saveLicenses(licenses) {
  fs.writeFileSync(LICENSES_FILE, JSON.stringify(licenses, null, 2));
}

// Gerar licença
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

// Verificar licença por código
function verifyLicenseByCode(code) {
  const licenses = getLicenses();
  const license = licenses.find(l => 
    l.code === code && 
    l.status === 'active' &&
    new Date(l.expiresAt) > new Date()
  );
  return license || null;
}

// Verificar licença por servidor
function verifyLicenseByGuild(guildId) {
  const licenses = getLicenses();
  const license = licenses.find(l => 
    l.guildId === guildId && 
    l.status === 'active' &&
    new Date(l.expiresAt) > new Date()
  );
  return license || null;
}

module.exports = {
  getLicenses,
  generateLicense,
  verifyLicenseByCode,
  verifyLicenseByGuild
};
