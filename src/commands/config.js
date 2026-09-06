const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { updateConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('config')
    .setDescription('Configurar o EASY TICKET')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator)
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

  async execute(interaction) {
    try {
      const sub = interaction.options.getSubcommand();
      const guildId = interaction.guildId;
      
      const embed = new EmbedBuilder()
        .setColor('#00FF00')
        .setTimestamp();

      if (sub === 'category') {
        const category = interaction.options.getChannel('categoria');
        updateConfig(guildId, { categoryId: category.id });
        embed.setTitle('✅ Categoria Definida')
          .setDescription(`📁 **${category.name}** (ID: \`${category.id}\`)`);
      } 
      else if (sub === 'support') {
        const role = interaction.options.getRole('cargo');
        updateConfig(guildId, { supportRoleId: role.id });
        embed.setTitle('✅ Cargo de Suporte Definido')
          .setDescription(`👤 **${role.name}** (ID: \`${role.id}\`)`);
      } 
      else if (sub === 'logs') {
        const channel = interaction.options.getChannel('canal');
        updateConfig(guildId, { logChannelId: channel.id });
        embed.setTitle('✅ Canal de Logs Definido')
          .setDescription(`📝 **${channel.name}** (ID: \`${channel.id}\`)`);
      }

      await interaction.reply({ embeds: [embed], ephemeral: true });

    } catch (error) {
      console.error('❌ Erro no /config:', error);
      await interaction.reply({
        content: `❌ Erro ao configurar: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
