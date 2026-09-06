const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// ====== PEGA DO AMBIENTE ======
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ====== COMANDOS ======
const commands = [
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurar o EASY TICKET')
    .addSubcommand(sub => sub
      .setName('category')
      .setDescription('Define a categoria')
      .addChannelOption(opt => opt.setName('categoria').setDescription('Categoria').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('support')
      .setDescription('Define o cargo da equipe')
      .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('logs')
      .setDescription('Define o canal de logs')
      .addChannelOption(opt => opt.setName('canal').setDescription('Canal').setRequired(true))),
  
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets'),
  
  new SlashCommandBuilder()
    .setName('gerar')
    .setDescription('Gerar uma licença (SÓ O DONO)')
    .addStringOption(opt => opt.setName('servidor').setDescription('ID do servidor').setRequired(true))
    .addStringOption(opt => opt.setName('comprador').setDescription('Nome do comprador').setRequired(true))
    .addIntegerOption(opt => opt.setName('dias').setDescription('Dias de validade').setRequired(false)),
  
  new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Verificar e ativar sua licença')
    .addStringOption(opt => opt.setName('codigo').setDescription('Código da licença').setRequired(true))
];

// ====== REGISTRAR ======
const rest = new REST({ version: '10' }).setToken(TOKEN);

(async () => {
  try {
    console.log('🔄 Registrando comandos...');
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands.map(cmd => cmd.toJSON()) }
    );
    console.log('✅ Comandos registrados com sucesso!');
    console.log(`📋 Comandos: ${commands.map(c => c.name).join(', ')}`);
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
})();
