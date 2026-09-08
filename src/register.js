const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const commands = [
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

  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets'),

  new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Liberar um servidor para usar o bot (SÓ O DONO)'),

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
    console.log('✅ Comandos registrados: config, panel, unlock, config-edit');
  } catch (error) {
    console.error('❌ Erro:', error.message);
  }
})();
