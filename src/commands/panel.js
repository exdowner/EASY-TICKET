const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    try {
      // ====== VERIFICAR SE É UM CANAL DE TEXTO ======
      if (!interaction.channel || !interaction.channel.isTextBased()) {
        return interaction.reply({
          content: '❌ Este comando só pode ser usado em um canal de texto!',
          ephemeral: true
        });
      }

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
          new ButtonBuilder()
            .setCustomId('open_ticket')
            .setLabel('🎫 Abrir Ticket')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('my_tickets')
            .setLabel('📋 Meus Tickets')
            .setStyle(ButtonStyle.Secondary)
        );

      // ====== ENVIAR O PAINEL ======
      await interaction.channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        content: '✅ Painel criado com sucesso!',
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Erro no /panel:', error);
      await interaction.reply({
        content: `❌ Erro ao criar painel: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
