const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { updateConfig, getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-categorias')
    .setDescription('Personalizar as categorias do ticket')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
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

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      const config = getConfig(guildId) || { categories: [] };
      
      const embed = new EmbedBuilder().setColor('#5865F2');

      if (sub === 'add') {
        const label = interaction.options.getString('label');
        const value = interaction.options.getString('value').toLowerCase().replace(/\s/g, '_');
        const description = interaction.options.getString('description') || 'Sem descrição';
        
        if (!config.categories) config.categories = [];
        config.categories.push({ label, value, description });
        updateConfig(guildId, { categories: config.categories });
        
        embed.setTitle('✅ Categoria adicionada')
          .setDescription(`**${label}** (ID: \`${value}\`)\n${description}`);
      }
      else if (sub === 'remove') {
        const value = interaction.options.getString('value');
        if (!config.categories) config.categories = [];
        const filtered = config.categories.filter(c => c.value !== value);
        
        if (filtered.length === config.categories.length) {
          return interaction.reply({ content: '❌ Categoria não encontrada!', ephemeral: true });
        }
        
        config.categories = filtered;
        updateConfig(guildId, { categories: config.categories });
        embed.setTitle('✅ Categoria removida').setDescription(`ID: \`${value}\``);
      }
      else if (sub === 'list') {
        const categories = config.categories || [];
        if (categories.length === 0) {
          return interaction.reply({ content: '📭 Nenhuma categoria configurada.', ephemeral: true });
        }
        
        categories.forEach((cat, i) => {
          embed.addFields({
            name: `${i+1}. ${cat.label}`,
            value: `ID: \`${cat.value}\`\nDescrição: ${cat.description || 'N/A'}`,
            inline: false
          });
        });
        embed.setTitle('📋 Categorias Configuradas');
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('❌ Erro no /config-categorias:', error);
      await interaction.reply({ content: `❌ Erro: ${error.message}`, ephemeral: true });
    }
  }
};
