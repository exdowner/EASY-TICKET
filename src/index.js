const { Client, GatewayIntentBits, Collection } = require('discord.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cron = require('node-cron');
const mongoose = require('mongoose');
require('dotenv').config();

// ============ MONGODB ============
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('✅ MongoDB conectado'))
  .catch(err => console.error('❌ Erro MongoDB:', err));

// ============ SERVIDOR WEB ============
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => res.send('🚀 EASY TICKET online!'));
app.get('/health', (req, res) => res.json({ status: 'online', uptime: process.uptime() }));

app.listen(PORT, () => console.log(`🌐 Web rodando na porta ${PORT}`));

// ============ CRON ============
cron.schedule('*/14 * * * *', () => {
  fetch(`http://localhost:${PORT}/health`).catch(() => {});
  console.log('🔄 Keep-alive');
});

// ============ DISCORD ============
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers
  ]
});

// Carregar comandos
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  console.log(`📁 Comando: ${command.data.name}`);
}

// Carregar eventos
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const event = require(path.join(eventsPath, file));
  if (event.once) client.once(event.name, (...args) => event.execute(...args, client));
  else client.on(event.name, (...args) => event.execute(...args, client));
}

// Interações
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;
  const command = client.commands.get(interaction.commandName);
  if (!command) return;
  
  try {
    await command.execute(interaction);
  } catch (error) {
    console.error('❌ Erro no comando:', error);
    if (!interaction.replied && !interaction.deferred) {
      await interaction.reply({ 
        content: '❌ Erro ao executar o comando!', 
        ephemeral: true 
      });
    }
  }
});

client.login(process.env.TOKEN);
console.log('🚀 EASY TICKET iniciando...');
