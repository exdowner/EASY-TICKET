const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { updateConfig, getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config-geral')
    .setDescription('Configurações gerais do sistema')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
    .addIntegerOption(opt => opt
      .setName('limite')
      .setDescription('Limite de tickets por usuário (padrão: 3)')
      .setRequired(true)
      .setMinValue(1)
      .setMaxValue(10)),

  async execute(interaction) {
    try {
      const limite = interaction.options.getInteger('limite');
      const guildId = interaction.guildId;
      
      updateConfig(guildId, { maxTicketsPerUser: limite });
      
      const embed = new EmbedBuilder()
        .setTitle('✅ Configuração atualizada')
        .setDescription(`Limite de tickets por usuário: **${limite}**`)
        .setColor('#00FF00');

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('❌ Erro no /config-geral:', error);
      await interaction.reply({ content: `❌ Erro: ${error.message}`, ephemeral: true });
    }
  }
};
