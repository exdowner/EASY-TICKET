const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    const config = getConfig(interaction.guildId);
    
    if (!config || !config.categoryId || !config.supportRoleId) {
      return interaction.reply({
        content: '❌ Configure primeiro:\n`/config category`\n`/config support`',
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle('🎫 EASY TICKET')
      .setDescription('Clique no botão abaixo para abrir um ticket!')
      .setColor('#5865F2')
      .addFields(
        { name: '📋 Como funciona?', value: 'Clique em "Abrir Ticket" e escolha a categoria.', inline: false },
        { name: '⏱️ Resposta', value: 'Até 5 minutos', inline: true },
        { name: '🔒 Privacidade', value: 'Tickets são privados', inline: true }
      )
      .setFooter({ text: 'EASY TICKET © 2024' })
      .setTimestamp();

    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder().setCustomId('open_ticket').setLabel('🎫 Abrir Ticket').setStyle(ButtonStyle.Primary),
        new ButtonBuilder().setCustomId('my_tickets').setLabel('📋 Meus Tickets').setStyle(ButtonStyle.Secondary)
      );

    await interaction.channel.send({ embeds: [embed], components: [row] });
    await interaction.reply({ content: '✅ Painel criado!', ephemeral: true });
  }
};
