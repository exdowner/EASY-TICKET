const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { updateConfig, getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-embed')
    .setDescription('Personalizar o embed do painel')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
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

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      const config = getConfig(guildId) || { embedConfig: {} };
      
      const embed = new EmbedBuilder().setColor('#00FF00');

      if (sub === 'titulo') {
        const texto = interaction.options.getString('texto');
        if (!config.embedConfig) config.embedConfig = {};
        config.embedConfig.title = texto;
        updateConfig(guildId, { embedConfig: config.embedConfig });
        embed.setTitle('✅ Título atualizado').setDescription(`Novo título: **${texto}**`);
      } 
      else if (sub === 'descricao') {
        const texto = interaction.options.getString('texto');
        if (!config.embedConfig) config.embedConfig = {};
        config.embedConfig.description = texto;
        updateConfig(guildId, { embedConfig: config.embedConfig });
        embed.setTitle('✅ Descrição atualizada').setDescription(`Nova descrição: ${texto}`);
      }
      else if (sub === 'cor') {
        const hex = interaction.options.getString('hex');
        if (!/^#?[0-9A-Fa-f]{6}$/.test(hex)) {
          return interaction.reply({ content: '❌ Cor inválida! Use formato #RRGGBB (ex: #5865F2)', ephemeral: true });
        }
        if (!config.embedConfig) config.embedConfig = {};
        config.embedConfig.color = hex.startsWith('#') ? hex : `#${hex}`;
        updateConfig(guildId, { embedConfig: config.embedConfig });
        embed.setTitle('✅ Cor atualizada').setDescription(`Nova cor: ${hex}`);
      }
      else if (sub === 'imagem') {
        const url = interaction.options.getString('url');
        if (!config.embedConfig) config.embedConfig = {};
        config.embedConfig.image = url;
        updateConfig(guildId, { embedConfig: config.embedConfig });
        embed.setTitle('✅ Imagem adicionada').setDescription(`URL: ${url}`);
      }
      else if (sub === 'thumbnail') {
        const url = interaction.options.getString('url');
        if (!config.embedConfig) config.embedConfig = {};
        config.embedConfig.thumbnail = url;
        updateConfig(guildId, { embedConfig: config.embedConfig });
        embed.setTitle('✅ Thumbnail adicionada').setDescription(`URL: ${url}`);
      }
      else if (sub === 'footer') {
        const texto = interaction.options.getString('texto');
        if (!config.embedConfig) config.embedConfig = {};
        config.embedConfig.footer = texto;
        updateConfig(guildId, { embedConfig: config.embedConfig });
        embed.setTitle('✅ Rodapé atualizado').setDescription(`Novo rodapé: ${texto}`);
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('❌ Erro no /config-embed:', error);
      await interaction.reply({ content: `❌ Erro: ${error.message}`, ephemeral: true });
    }
  }
};
