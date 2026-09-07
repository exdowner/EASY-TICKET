const { REST, Routes } = require('discord.js');
const { SlashCommandBuilder } = require('discord.js');
require('dotenv').config();

// ====== PEGA DO AMBIENTE ======
const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

// ====== COMANDOS ======
const commands = [
  // ====== COMANDO CONFIG ======
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

  // ====== COMANDO PANEL ======
  new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets'),

  // ====== COMANDO GERAR ======
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

  // ====== COMANDO VERIFICAR ======
  new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Verificar e ativar sua licença')
    .addStringOption(opt => opt.setName('codigo').setDescription('Código da licença').setRequired(true)),

  // ====== COMANDO CONFIG-EMBED ======
  new SlashCommandBuilder()
    .setName('config-embed')
    .setDescription('Personalizar o embed do painel')
    .addSubcommand(sub => sub
      .setName('titulo')
      .setDescription('Muda o título do painel')
      .addStringOption(opt => opt.setName('texto').setDescription('Novo título').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('descricao')
      .setDescription('Muda a descrição do painel')
      .addStringOption(opt => opt.setName('texto').setDescription('Nova descrição').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('cor')
      .setDescription('Muda a cor do embed (ex: #5865F2)')
      .addStringOption(opt => opt.setName('hex').setDescription('Código hexadecimal').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('imagem')
      .setDescription('Adiciona uma imagem ao embed')
      .addStringOption(opt => opt.setName('url').setDescription('URL da imagem').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('thumbnail')
      .setDescription('Adiciona uma thumbnail ao embed')
      .addStringOption(opt => opt.setName('url').setDescription('URL da thumbnail').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('footer')
      .setDescription('Muda o rodapé do embed')
      .addStringOption(opt => opt.setName('texto').setDescription('Texto do rodapé').setRequired(true))),

  // ====== COMANDO CONFIG-CATEGORIAS ======
  new SlashCommandBuilder()
    .setName('config-categorias')
    .setDescription('Personalizar as categorias do ticket')
    .addSubcommand(sub => sub
      .setName('add')
      .setDescription('Adicionar uma nova categoria')
      .addStringOption(opt => opt.setName('label').setDescription('Nome da categoria').setRequired(true))
      .addStringOption(opt => opt.setName('value').setDescription('Identificador (sem espaços)').setRequired(true))
      .addStringOption(opt => opt.setName('description').setDescription('Descrição da categoria').setRequired(false)))
    .addSubcommand(sub => sub
      .setName('remove')
      .setDescription('Remover uma categoria')
      .addStringOption(opt => opt.setName('value').setDescription('Identificador da categoria').setRequired(true)))
    .addSubcommand(sub => sub
      .setName('list')
      .setDescription('Listar todas as categorias')),

  // ====== COMANDO CONFIG-GERAL ======
  new SlashCommandBuilder()
    .setName('config-geral')
    .setDescription('Configurações gerais do sistema')
    .addIntegerOption(opt => opt
      .setName('limite')
      .setDescription('Limite de tickets por usuário (padrão: 3)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10))
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
    console.log('📝 Detalhes:');
    console.log('  - /config category | support | logs');
    console.log('  - /panel');
    console.log('  - /gerar [30 | 60 | 90 | vitalicio]');
    console.log('  - /verificar [codigo]');
    console.log('  - /config-embed titulo | descricao | cor | imagem | thumbnail | footer');
    console.log('  - /config-categorias add | remove | list');
    console.log('  - /config-geral limite');
  } catch (error) {
    console.error('❌ Erro ao registrar comandos:', error.message);
    if (error.code === 0) {
      console.log('⚠️ Verifique se o TOKEN e CLIENT_ID estão corretos');
      console.log(`TOKEN: ${TOKEN ? '✅ OK' : '❌ FALTANDO'}`);
      console.log(`CLIENT_ID: ${CLIENT_ID ? '✅ OK' : '❌ FALTANDO'}`);
    }
  }
})();
