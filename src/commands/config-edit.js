const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { updateConfig, getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-edit')
    .setDescription('Editar configurações do sistema')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    try {
      const config = getConfig(interaction.guildId);
      
      // ====== MENU PRINCIPAL ======
      const embed = new EmbedBuilder()
        .setTitle('⚙️ Configurações - EASY TICKET')
        .setDescription('Clique no botão abaixo para editar:')
        .setColor('#5865F2')
        .addFields(
          { name: '📝 Título', value: config?.embedConfig?.title || '🎫 EASY TICKET', inline: true },
          { name: '📄 Descrição', value: config?.embedConfig?.description || 'Clique no botão abaixo para abrir um ticket!', inline: true },
          { name: '🎨 Cor', value: config?.embedConfig?.color || '#5865F2', inline: true }
        );

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('edit_title')
            .setLabel('📝 Título')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_description')
            .setLabel('📄 Descrição')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('edit_color')
            .setLabel('🎨 Cor')
            .setStyle(ButtonStyle.Primary)
        );

      const row2 = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('add_category')
            .setLabel('➕ Adicionar Categoria')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId('remove_category')
            .setLabel('➖ Remover Categoria')
            .setStyle(ButtonStyle.Danger),
          new ButtonBuilder()
            .setCustomId('list_categories')
            .setLabel('📋 Listar Categorias')
            .setStyle(ButtonStyle.Secondary)
        );

      await interaction.reply({
        embeds: [embed],
        components: [row, row2],
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Erro no /config-edit:', error);
      await interaction.reply({
        content: `❌ Erro: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
