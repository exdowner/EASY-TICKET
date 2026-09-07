const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionsBitField } = require('discord.js');
const { getConfig } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('panel')
    .setDescription('Criar painel de tickets')
    .setDefaultMemberPermissions(PermissionsBitField.Flags.Administrator),

  async execute(interaction) {
    try {
      const guildId = interaction.guildId;
      console.log(`📋 /panel executado no servidor ${guildId}`);
      
      const config = getConfig(guildId);
      console.log(`📊 Config do servidor:`, config);
      
      if (!config) {
        console.log(`❌ Servidor ${guildId} sem configuração`);
        return interaction.reply({
          content: '❌ Servidor não configurado! Use `/config` primeiro.',
          ephemeral: true
        });
      }

      // ====== VERIFICA SE TEM CATEGORIA ======
      if (!config.categoryId) {
        console.log(`❌ Servidor ${guildId} sem categoria`);
        return interaction.reply({
          content: '❌ Categoria não definida! Use `/config category`.',
          ephemeral: true
        });
      }

      // ====== VERIFICA SE TEM CARGO ======
      if (!config.supportRoleId) {
        console.log(`❌ Servidor ${guildId} sem cargo de suporte`);
        return interaction.reply({
          content: '❌ Cargo de suporte não definido! Use `/config support`.',
          ephemeral: true
        });
      }

      // ====== VERIFICA SE A CATEGORIA EXISTE ======
      const category = await interaction.guild.channels.fetch(config.categoryId).catch(err => {
        console.log(`❌ Erro ao buscar categoria ${config.categoryId}:`, err.message);
        return null;
      });
      
      if (!category) {
        console.log(`❌ Categoria ${config.categoryId} não encontrada no servidor ${guildId}`);
        return interaction.reply({
          content: '❌ A categoria configurada foi deletada! Use `/config category` novamente.',
          ephemeral: true
        });
      }

      // ====== VERIFICA SE O CARGO EXISTE ======
      const role = await interaction.guild.roles.fetch(config.supportRoleId).catch(err => {
        console.log(`❌ Erro ao buscar cargo ${config.supportRoleId}:`, err.message);
        return null;
      });
      
      if (!role) {
        console.log(`❌ Cargo ${config.supportRoleId} não encontrado no servidor ${guildId}`);
        return interaction.reply({
          content: '❌ O cargo de suporte foi deletado! Use `/config support` novamente.',
          ephemeral: true
        });
      }

      console.log(`✅ Servidor ${guildId} configurado e validado`);

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
