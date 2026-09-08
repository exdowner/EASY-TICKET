const { 
  EmbedBuilder, 
  ActionRowBuilder, 
  ButtonBuilder, 
  ButtonStyle, 
  StringSelectMenuBuilder,
  ChannelType, 
  PermissionsBitField 
} = require('discord.js');

const { 
  getConfig, 
  getTicket, 
  getTickets, 
  createTicket, 
  updateTicket,
  updateConfig,
  incrementTicketCounter,
  isUnlocked
} = require('../database/database');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    // ====== COMANDOS PÚBLICOS ======
    const publicCommands = ['unlock'];
    
    if (interaction.isCommand() && !publicCommands.includes(interaction.commandName)) {
      const unlocked = await isUnlocked(interaction.guildId);
      if (!unlocked) {
        return interaction.reply({
          content: '🔐 **Servidor bloqueado!**\n\nPeça ao dono do bot para liberar este servidor.',
          ephemeral: true
        });
      }
    }

    // ====== BOTÕES E SELECT MENU ======
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const config = await getConfig(interaction.guildId);
    if (!config) {
      return interaction.reply({ 
        content: '❌ Servidor não configurado! Use /config', 
        ephemeral: true 
      });
    }

    // ====== BOTÃO: EDIT TÍTULO ======
    if (interaction.customId === 'edit_title') {
      await interaction.reply({
        content: '📝 **Digite o novo título:**',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (message) => {
        try {
          const content = message.content.trim();
          await message.delete().catch(() => {});

          const cfg = await getConfig(interaction.guildId) || { embedConfig: {} };
          if (!cfg.embedConfig) cfg.embedConfig = {};
          cfg.embedConfig.title = content;

          await updateConfig(interaction.guildId, { embedConfig: cfg.embedConfig });
          await interaction.followUp({ content: `✅ Título atualizado para: **${content}**`, ephemeral: true });
        } catch (err) {
          console.error(err);
          await interaction.followUp({ content: '❌ Erro ao atualizar o título.', ephemeral: true });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true }).catch(() => {});
        }
      });
      return;
    }

    // ====== BOTÃO: EDIT DESCRIÇÃO ======
    if (interaction.customId === 'edit_description') {
      await interaction.reply({
        content: '📄 **Digite a nova descrição:**',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (message) => {
        try {
          const content = message.content.trim();
          await message.delete().catch(() => {});

          const cfg = await getConfig(interaction.guildId) || { embedConfig: {} };
          if (!cfg.embedConfig) cfg.embedConfig = {};
          cfg.embedConfig.description = content;

          await updateConfig(interaction.guildId, { embedConfig: cfg.embedConfig });
          await interaction.followUp({ content: `✅ Descrição atualizada para:\n${content}`, ephemeral: true });
        } catch (err) {
          console.error(err);
          await interaction.followUp({ content: '❌ Erro ao atualizar a descrição.', ephemeral: true });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true }).catch(() => {});
        }
      });
      return;
    }

    // ====== BOTÃO: EDIT COR ======
    if (interaction.customId === 'edit_color') {
      await interaction.reply({
        content: '🎨 **Digite a nova cor:** (Ex: #5865F2)',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (message) => {
        try {
          const content = message.content.trim();
          await message.delete().catch(() => {});

          if (!/^#?[0-9A-Fa-f]{6}$/.test(content)) {
            return interaction.followUp({ content: '❌ Cor inválida! Use #RRGGBB', ephemeral: true });
          }

          const cfg = await getConfig(interaction.guildId) || { embedConfig: {} };
          if (!cfg.embedConfig) cfg.embedConfig = {};
          cfg.embedConfig.color = content.startsWith('#') ? content : `#${content}`;

          await updateConfig(interaction.guildId, { embedConfig: cfg.embedConfig });
          await interaction.followUp({ content: `✅ Cor atualizada para: ${cfg.embedConfig.color}`, ephemeral: true });
        } catch (err) {
          console.error(err);
          await interaction.followUp({ content: '❌ Erro ao atualizar a cor.', ephemeral: true });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true }).catch(() => {});
        }
      });
      return;
    }

    // ====== BOTÃO: ADICIONAR CATEGORIA ======
    if (interaction.customId === 'add_category') {
      await interaction.reply({
        content: '➕ **Adicionar categoria:**\nEnvie no formato:\n`Nome | identificador`',
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (message) => {
        try {
          const content = message.content.trim();
          await message.delete().catch(() => {});

          const parts = content.split('|').map(s => s.trim());
          if (parts.length < 2) {
            return interaction.followUp({ content: '❌ Formato inválido! Use: `Nome | identificador`', ephemeral: true });
          }

          const [label, value] = parts;
          const cfg = await getConfig(interaction.guildId) || { categories: [] };
          if (!cfg.categories) cfg.categories = [];

          cfg.categories.push({ 
            label, 
            value: value.toLowerCase().replace(/\s/g, '_'),
            description: '' 
          });

          await updateConfig(interaction.guildId, { categories: cfg.categories });
          await interaction.followUp({ content: `✅ Categoria adicionada: **${label}** (ID: \`${value}\`)`, ephemeral: true });
        } catch (err) {
          console.error(err);
          await interaction.followUp({ content: '❌ Erro ao adicionar categoria.', ephemeral: true });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true }).catch(() => {});
        }
      });
      return;
    }

    // ====== BOTÃO: REMOVER CATEGORIA ======
    if (interaction.customId === 'remove_category') {
      const categories = config?.categories || [];
      if (categories.length === 0) {
        return interaction.reply({ content: '📭 Não há categorias para remover.', ephemeral: true });
      }

      await interaction.reply({
        content: `📋 **Categorias disponíveis:**\n${categories.map((cat, i) => `${i + 1}. ${cat.label} (\`${cat.value}\`)`).join('\n')}\n\n**Digite o ID da categoria que deseja remover:**`,
        ephemeral: true
      });

      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });

      collector.on('collect', async (message) => {
        try {
          const categoryId = message.content.trim();
          await message.delete().catch(() => {});

          const cfg = await getConfig(interaction.guildId);
          const originalLength = (cfg?.categories || []).length;
          const filtered = (cfg?.categories || []).filter(c => c.value !== categoryId);

          if (filtered.length === originalLength) {
            return interaction.followUp({ content: `❌ Categoria \`${categoryId}\` não encontrada!`, ephemeral: true });
          }

          await updateConfig(interaction.guildId, { categories: filtered });
          await interaction.followUp({ content: `✅ Categoria \`${categoryId}\` removida!`, ephemeral: true });
        } catch (err) {
          console.error(err);
          await interaction.followUp({ content: '❌ Erro ao remover categoria.', ephemeral: true });
        }
      });

      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true }).catch(() => {});
        }
      });
      return;
    }

    // ====== BOTÃO: LISTAR CATEGORIAS ======
    if (interaction.customId === 'list_categories') {
      const categories = config?.categories || [];
      if (categories.length === 0) {
        return interaction.reply({ content: '📭 Nenhuma categoria configurada.', ephemeral: true });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Categorias')
        .setColor('#5865F2');

      categories.forEach((cat, i) => {
        embed.addFields({ 
          name: `${i + 1}. ${cat.label}`, 
          value: `ID: \`${cat.value}\``, 
          inline: false 
        });
      });

      return interaction.reply({ embeds: [embed], ephemeral: true });
    }    // ====== CATEGORIAS PADRÃO ======
    const categories = config.categories?.length > 0 
      ? config.categories 
      : [
          { label: '🛒 Venda de Bot', value: 'venda', description: 'Comprar um bot' },
          { label: '🔧 Suporte Técnico', value: 'suporte', description: 'Ajuda com bots' },
          { label: '❓ Dúvidas', value: 'duvida', description: 'Tirar dúvidas' },
          { label: '⚠️ Reclamação', value: 'reclamacao', description: 'Reportar problema' }
        ];

    // ====== BOTÃO: ABRIR TICKET ======
    if (interaction.customId === 'open_ticket') {
      try {
        const maxTickets = config.maxTicketsPerUser || 3;
        const userTickets = await getTickets(interaction.guildId, interaction.user.id);
        const openTickets = userTickets.filter(t => t.status === 'open' || t.status === 'claimed');

        if (openTickets.length >= maxTickets) {
          return interaction.reply({ 
            content: `❌ Você já tem ${maxTickets} tickets abertos!`, 
            ephemeral: true 
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('🎫 Selecionar Categoria')
          .setDescription('Escolha a categoria do seu ticket:')
          .setColor('#5865F2');

        const select = new StringSelectMenuBuilder()
          .setCustomId('ticket_category')
          .setPlaceholder('Selecione uma categoria...')
          .addOptions(
            categories.map(cat => ({
              label: cat.label.slice(0, 100),
              value: cat.value,
              description: (cat.description || '').slice(0, 100) || undefined
            }))
          );

        const row = new ActionRowBuilder().addComponents(select);

        return interaction.reply({ 
          embeds: [embed], 
          components: [row], 
          ephemeral: true 
        });
      } catch (error) {
        console.error('❌ Erro no open_ticket:', error);
        return interaction.reply({
          content: '❌ Erro ao abrir ticket. Tente novamente.',
          ephemeral: true
        });
      }
    }

    // ====== BOTÃO: MEUS TICKETS ======
    if (interaction.customId === 'my_tickets') {
      try {
        const tickets = await getTickets(interaction.guildId, interaction.user.id);
        const sorted = tickets.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        const recent = sorted.slice(0, 5);

        if (recent.length === 0) {
          return interaction.reply({ 
            content: '📭 Você não tem nenhum ticket.', 
            ephemeral: true 
          });
        }

        const embed = new EmbedBuilder()
          .setTitle('📋 Meus Tickets')
          .setColor('#5865F2');

        recent.forEach((ticket, i) => {
          const status = ticket.status === 'open' ? '🟢 Aberto' :
                         ticket.status === 'claimed' ? '🟡 Em atendimento' : '🔴 Fechado';
          embed.addFields({
            name: `${i + 1}. ${ticket.categoryLabel || 'Sem categoria'}`,
            value: `Status: ${status}\nCriado: ${new Date(ticket.createdAt).toLocaleString('pt-BR')}`,
            inline: false
          });
        });

        return interaction.reply({ embeds: [embed], ephemeral: true });
      } catch (error) {
        console.error('❌ Erro no my_tickets:', error);
        return interaction.reply({
          content: '❌ Erro ao buscar tickets. Tente novamente.',
          ephemeral: true
        });
      }
    }

    // ====== BOTÃO: FECHAR TICKET ======
    if (interaction.customId === 'close_ticket') {
      const ticket = await getTicket(interaction.channelId);
      
      if (!ticket || (ticket.status !== 'open' && ticket.status !== 'claimed')) {
        return interaction.reply({ 
          content: '❌ Ticket inválido!', 
          ephemeral: true 
        });
      }

      const hasPermission = 
        interaction.member.roles.cache.has(config.supportRoleId) ||
        interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!hasPermission && ticket.userId !== interaction.user.id) {
        return interaction.reply({ 
          content: '❌ Apenas a equipe ou o dono do ticket podem fechar.', 
          ephemeral: true 
        });
      }

      await interaction.reply({ 
        embeds: [
          new EmbedBuilder()
            .setTitle('🔒 Fechando...')
            .setDescription('O ticket será fechado em 5 segundos.')
            .setColor('#FF0000')
        ] 
      });

      setTimeout(async () => {
        try {
          const messages = await interaction.channel.messages.fetch({ limit: 100 });
          const transcript = messages
            .reverse()
            .map(msg => `[${msg.createdAt.toLocaleString('pt-BR')}] ${msg.author.tag}: ${msg.content}`)
            .join('\n');

          await updateTicket(interaction.channelId, {
            status: 'closed',
            closedAt: new Date().toISOString(),
            transcript
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
                  attachment: Buffer.from(transcript, 'utf-8'),
                  name: `transcript-${ticket.channelId}.txt`
                }]
              });
            }
          }

          await interaction.channel.delete().catch(() => {});
        } catch (err) {
          console.error('Erro ao fechar ticket:', err);
        }
      }, 5000);
      return;
    }

    // ====== BOTÃO: REIVINDICAR ======
    if (interaction.customId === 'claim_ticket') {
      const ticket = await getTicket(interaction.channelId);
      
      if (!ticket || ticket.status !== 'open') {
        return interaction.reply({ 
          content: '❌ Ticket não disponível!', 
          ephemeral: true 
        });
      }

      const hasPermission = 
        interaction.member.roles.cache.has(config.supportRoleId) ||
        interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

      if (!hasPermission) {
        return interaction.reply({ 
          content: '❌ Apenas a equipe pode reivindicar!', 
          ephemeral: true 
        });
      }

      await updateTicket(interaction.channelId, {
        status: 'claimed',
        claimedBy: interaction.user.id,
        claimedByName: interaction.user.tag
      });

      const embed = new EmbedBuilder()
        .setTitle('👋 Ticket Reivindicado')
        .setDescription(`${interaction.user} está atendendo este ticket!`)
        .setColor('#00FF00');

      return interaction.reply({ embeds: [embed] });
    }

    // ====== SELECT MENU: CATEGORIA ======
    if (interaction.isStringSelectMenu() && interaction.customId === 'ticket_category') {
      try {
        const category = interaction.values[0];
        const selectedCategory = categories.find(c => c.value === category);
        const categoryLabel = selectedCategory ? selectedCategory.label : category;
        const ticketCount = await incrementTicketCounter(interaction.guildId);

        if (!config.categoryId) {
          return interaction.reply({ content: '❌ Categoria de tickets não configurada!', ephemeral: true });
        }
        if (!config.supportRoleId) {
          return interaction.reply({ content: '❌ Cargo de suporte não configurado!', ephemeral: true });
        }

        const channel = await interaction.guild.channels.create({
          name: `ticket-${ticketCount}`,
          type: ChannelType.GuildText,
          parent: config.categoryId,
          permissionOverwrites: [
            { 
              id: interaction.guild.id, 
              deny: [PermissionsBitField.Flags.ViewChannel] 
            },
            { 
              id: interaction.user.id, 
              allow: [
                PermissionsBitField.Flags.ViewChannel, 
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks
              ] 
            },
            { 
              id: config.supportRoleId, 
              allow: [
                PermissionsBitField.Flags.ViewChannel, 
                PermissionsBitField.Flags.SendMessages,
                PermissionsBitField.Flags.AttachFiles,
                PermissionsBitField.Flags.EmbedLinks
              ] 
            }
          ]
        });

        const ticketData = {
          guildId: interaction.guildId,
          channelId: channel.id,
          userId: interaction.user.id,
          userName: interaction.user.username,
          userTag: interaction.user.tag,
          category,
          categoryLabel,
          status: 'open',
          createdAt: new Date().toISOString()
        };

        await createTicket(ticketData);

        const embed = new EmbedBuilder()
          .setTitle('🎫 Ticket Aberto')
          .setDescription(`**Categoria:** ${categoryLabel}\n**Usuário:** ${interaction.user}`)
          .addFields(
            { name: '📝 Instruções', value: 'Descreva seu problema com o máximo de detalhes possível.' },
            { name: '⏱️ Tempo de resposta', value: 'Até 5 minutos (em horário comercial)' }
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
          content: `✅ Ticket criado com sucesso! ${channel}`, 
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
                { name: 'Canal', value: `${channel}`, inline: true }
              )
              .setColor('#00FF00')
              .setTimestamp();
            await logChannel.send({ embeds: [logEmbed] });
          }
        }
      } catch (error) {
        console.error('❌ Erro no select menu:', error);
        if (!interaction.replied && !interaction.deferred) {
          await interaction.reply({
            content: '❌ Erro ao criar ticket. Tente novamente.',
            ephemeral: true
          });
        }
      }
    }
  }
};
