const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, PermissionsBitField } = require('discord.js');
const { 
  getConfig, 
  getTicket, 
  getTickets, 
  createTicket, 
  updateTicket,
  incrementTicketCounter,
  verifyLicenseByGuild
} = require('../database/database');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ====== VERIFICAR LICENÇA ======
    const publicCommands = ['verificar', 'gerar'];
    
    if (interaction.isCommand() && !publicCommands.includes(interaction.commandName)) {
      const license = verifyLicenseByGuild(interaction.guildId);
      
      if (!license) {
        return interaction.reply({
          content: '🔐 **Servidor não licenciado!**\n\n' +
                   'Para liberar o EASY TICKET neste servidor, use:\n' +
                   '`/verificar CODIGO`\n\n' +
                   'Entre em contato para adquirir uma licença.',
          ephemeral: true
        });
      }
    }

    // ====== BOTÕES E SELECT MENU ======
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const config = getConfig(interaction.guildId);
    if (!config) {
      return interaction.reply({ 
        content: '❌ Servidor não configurado! Use /config', 
        ephemeral: true 
      });
    }

    // ====== PEGAR CATEGORIAS PERSONALIZADAS ======
    const categories = config.categories || [
      { label: '🛒 Venda de Bot', value: 'venda', description: 'Comprar um bot' },
      { label: '🔧 Suporte Técnico', value: 'suporte', description: 'Ajuda com bots' },
      { label: '❓ Dúvidas', value: 'duvida', description: 'Tirar dúvidas' },
      { label: '⚠️ Reclamação', value: 'reclamacao', description: 'Reportar problema' }
    ];

    // ====== BOTÃO: ABRIR TICKET ======
    if (interaction.customId === 'open_ticket') {
      const maxTickets = config.maxTicketsPerUser || 3;
      const userTickets = getTickets(interaction.guildId, interaction.user.id)
        .filter(t => t.status === 'open' || t.status === 'claimed');

      if (userTickets.length >= maxTickets) {
        return interaction.reply({ 
          content: `❌ Você já tem ${maxTickets} tickets abertos!`, 
          ephemeral: true 
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('🎫 Selecionar Categoria')
        .setDescription('Escolha a categoria do seu ticket:')
        .setColor('#5865F2');

      const row = {
        type: 1,
        components: [{
          type: 3,
          custom_id: 'ticket_category',
          placeholder: 'Selecione uma categoria...',
          min_values: 1,
          max_values: 1,
          options: categories.map(cat => ({ 
            label: cat.label, 
            value: cat.value,
            description: cat.description || ''
          }))
        }]
      };

      return interaction.reply({ 
        embeds: [embed], 
        components: [row], 
        ephemeral: true 
      });
    }

    // ====== BOTÃO: MEUS TICKETS ======
    if (interaction.customId === 'my_tickets') {
      const tickets = getTickets(interaction.guildId, interaction.user.id)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5);

      if (tickets.length === 0) {
        return interaction.reply({ 
          content: '📭 Você não tem nenhum ticket.', 
          ephemeral: true 
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Meus Tickets')
        .setColor('#5865F2');

      tickets.forEach((ticket, i) => {
        const status = ticket.status === 'open' ? '🟢 Aberto' :
                       ticket.status === 'claimed' ? '🟡 Em atendimento' : '🔴 Fechado';
        embed.addFields({
          name: `${i+1}. ${ticket.categoryLabel || 'Sem categoria'}`,
          value: `Status: ${status}\nCriado: ${new Date(ticket.createdAt).toLocaleString()}`,
          inline: false
        });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ====== BOTÃO: FECHAR TICKET ======
    if (interaction.customId === 'close_ticket') {
      const ticket = getTicket(interaction.channelId);
      
      if (!ticket || (ticket.status !== 'open' && ticket.status !== 'claimed')) {
        return interaction.reply({ 
          content: '❌ Ticket inválido!', 
          ephemeral: true 
        });
      }

      const hasPermission = interaction.member.roles.cache.has(config.supportRoleId) ||
                            interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!hasPermission && ticket.userId !== interaction.user.id) {
        return interaction.reply({ 
          content: '❌ Apenas a equipe ou o dono podem fechar.', 
          ephemeral: true 
        });
      }

      await interaction.reply({ 
        embeds: [new EmbedBuilder()
          .setTitle('🔒 Fechando...')
          .setDescription('Em 5 segundos')
          .setColor('#FF0000')
        ] 
      });

      setTimeout(async () => {
        const messages = await interaction.channel.messages.fetch({ limit: 100 });
        const transcript = messages.reverse().map(msg => 
          `[${msg.createdAt.toLocaleString()}] ${msg.author.tag}: ${msg.content}`
        ).join('\n');

        updateTicket(interaction.channelId, {
          status: 'closed',
          closedAt: new Date().toISOString(),
          transcript: transcript
        });

        if (config.logChannelId) {
          const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
          if (logChannel) {
            const logEmbed = new EmbedBuilder()
              .setTitle('📝 Ticket Fechado')
              .addFields(
                { name: 'Usuário', value: `<@${ticket.userId}>`, inline: true },
                { name: 'Categoria', value: ticket.categoryLabel || 'N/A', inline: true },
                { name: 'Fechado por', value: interaction.user.tag, inline: true }
              )
              .setColor('#FF0000')
              .setTimestamp();

            await logChannel.send({
              embeds: [logEmbed],
              files: [{
                attachment: Buffer.from(transcript),
                name: `transcript-${ticket.channelId}.txt`
              }]
            });
          }
        }

        await interaction.channel.delete();
      }, 5000);
    }

    // ====== BOTÃO: REIVINDICAR ======
    if (interaction.customId === 'claim_ticket') {
      const ticket = getTicket(interaction.channelId);
      
      if (!ticket || ticket.status !== 'open') {
        return interaction.reply({ 
          content: '❌ Ticket não disponível!', 
          ephemeral: true 
        });
      }

      const hasPermission = interaction.member.roles.cache.has(config.supportRoleId) ||
                            interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!hasPermission) {
        return interaction.reply({ 
          content: '❌ Apenas a equipe pode reivindicar!', 
          ephemeral: true 
        });
      }

      updateTicket(interaction.channelId, {
        status: 'claimed',
        claimedBy: interaction.user.id,
        claimedByName: interaction.user.tag
      });

      const embed = new EmbedBuilder()
        .setTitle('👋 Ticket Reivindicado')
        .setDescription(`${interaction.user} está atendendo!`)
        .setColor('#00FF00');

      return interaction.reply({ embeds: [embed] });
    }

    // ====== SELECT MENU: CATEGORIA ======
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
      const category = interaction.values[0];
      
      // Encontrar a categoria selecionada
      const selectedCategory = categories.find(c => c.value === category);
      const categoryLabel = selectedCategory ? selectedCategory.label : category;

      const ticketCount = incrementTicketCounter(interaction.guildId);

      const channel = await interaction.guild.channels.create({
        name: `ticket-${ticketCount}`,
        type: ChannelType.GuildText,
        parent: config.categoryId,
        permissionOverwrites: [
          { id: interaction.guild.id, deny: [PermissionsBitField.Flags.ViewChannel] },
          { 
            id: interaction.user.id, 
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] 
          },
          { 
            id: config.supportRoleId, 
            allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages] 
          }
        ]
      });

      const ticketData = {
        guildId: interaction.guildId,
        channelId: channel.id,
        userId: interaction.user.id,
        userName: interaction.user.username,
        userTag: interaction.user.tag,
        category: category,
        categoryLabel: categoryLabel,
        status: 'open',
        createdAt: new Date().toISOString()
      };
      createTicket(ticketData);

      const embed = new EmbedBuilder()
        .setTitle('🎫 Ticket Aberto')
        .setDescription(`**Categoria:** ${categoryLabel}\n**Usuário:** ${interaction.user}`)
        .addFields(
          { name: '📝 Instruções', value: 'Descreva seu problema para agilizar o atendimento.' },
          { name: '⏱️ Resposta', value: 'Até 5 minutos' }
        )
        .setColor('#00FF00')
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId('claim_ticket')
            .setLabel('👋 Reivindicar')
            .setStyle(ButtonStyle.Primary),
          new ButtonBuilder()
            .setCustomId('close_ticket')
            .setLabel('🔒 Fechar')
            .setStyle(ButtonStyle.Danger)
        );

      await channel.send({
        content: `${interaction.user} ${config.supportRoleId ? `<@&${config.supportRoleId}>` : ''}`,
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({ 
        content: `✅ Ticket criado! ${channel}`, 
        ephemeral: true 
      });

      if (config.logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(config.logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('🎫 Ticket Criado')
            .addFields(
              { name: 'Usuário', value: interaction.user.tag, inline: true },
              { name: 'Categoria', value: categoryLabel, inline: true },
              { name: 'Canal', value: channel.toString(), inline: true }
            )
            .setColor('#00FF00')
            .setTimestamp();
          await logChannel.send({ embeds: [logEmbed] });
        }
      }
    }
  }
};
