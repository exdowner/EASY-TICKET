const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    // Defer a resposta para evitar timeout e duplicidade
    await interaction.deferReply({ ephemeral: true });

    try {
      const config = await getConfig(interaction.guildId);
      
      if (!config || !config.categoryId || !config.supportRoleId) {
        return interaction.editReply({
          content: '❌ Configure primeiro:\n`/config category`\n`/config support`'
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

      await interaction.channel.send({
        embeds: [embed],
        components: [row]
      });

      await interaction.editReply({
        content: '✅ Painel criado com sucesso!'
      });

    } catch (error) {
      console.error('❌ Erro no /panel:', error);
      // Se já tiver respondido, usa editReply, senão reply
      if (interaction.deferred) {
        await interaction.editReply({ content: `❌ Erro ao criar painel: ${error.message}` });
      } else {
        await interaction.reply({ content: `❌ Erro: ${error.message}`, ephemeral: true });
      }
    }
  }
};
