const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
  // ====== CONFIG ======
  new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurar o EASY TICKET')
    .addSubcommand(sub => sub
      .setName('category')
      .setDescription('Define a categoria para criar tickets')
      .addChannelOption(opt => opt.setName('categoria').setDescription('Categoria').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('support')
      .setDescription('Define o cargo da equipe')
      .addRoleOption(opt => opt.setName('cargo').setDescription('Cargo da equipe').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('logs')
      .setDescription('Define o canal de logs')
      .addChannelOption(opt => opt.setName('canal').setDescription('Canal de logs').setRequired(true))),

  // ====== PANEL ======
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets'),

  // ====== GERAR ======
  new SlashCommandBuilder()
    .setName('gerar')
    .setDescription('Gerar uma licença (SÓ O DONO)')
    .addStringOption(opt => opt
      .setName('tipo')
      .setDescription('Tipo de licença')
      .setRequired(true)
      .addChoices(
        { name: '📅 30 Dias', value: '30' },
        { name: '📅 60 Dias', value: '60' },
        { name: '📅 90 Dias', value: '90' },
        { name: '♾️ Vitalício', value: 'vitalicio' }
      )),

  // ====== VERIFICAR ======
  new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Verificar e ativar sua licença')
    .addStringOption(opt => opt.setName('codigo').setDescription('Código da licença').setRequired(true)),

  // ====== CONFIG-EDIT ======
  new SlashCommandBuilder()
    .setName('config-edit')
    .setDescription('Editar configurações do sistema')
];

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
