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
    const publicCommands = ['comprar'];
    
    if (interaction.isCommand() && !publicCommands.includes(interaction.commandName)) {
      const license = await verifyLicenseByGuild(interaction.guildId);
      if (!license) {
        if (!interaction.replied && !interaction.deferred) {
          return interaction.reply({
            content: '🔐 **Servidor não licenciado!**\n\n' +
                     'Para solicitar uma licença, use:\n' +
                     '`/comprar`\n\n' +
                     'Entre em contato com o suporte para mais informações.',
            ephemeral: true
          });
        }
        return;
      }
    }

    // ====== BOTÕES E SELECT MENU ======
    if (!interaction.isButton() && !interaction.isStringSelectMenu()) return;

    const config = await getConfig(interaction.guildId);
    if (!config) {
      if (!interaction.replied && !interaction.deferred) {
        return interaction.reply({ 
          content: '❌ Servidor não configurado! Use /config', 
          ephemeral: true 
        });
      }
      return;
    }

    // ====== BOTÃO: EDIT TÍTULO ======
    if (interaction.customId === 'edit_title') {
      await interaction.reply({
        content: '📝 **Digite o novo título:**\n(Envie uma mensagem com o título)',
        ephemeral: true
      });
      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });
      collector.on('collect', async (message) => {
        const content = message.content.trim();
        const cfg = await getConfig(interaction.guildId) || { embedConfig: {} };
        if (!cfg.embedConfig) cfg.embedConfig = {};
        cfg.embedConfig.title = content;
        await updateConfig(interaction.guildId, { embedConfig: cfg.embedConfig });
        await interaction.followUp({ content: `✅ Título atualizado para: **${content}**`, ephemeral: true });
      });
      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true });
        }
      });
      return;
    }

    // ====== BOTÃO: EDIT DESCRIÇÃO ======
    if (interaction.customId === 'edit_description') {
      await interaction.reply({
        content: '📄 **Digite a nova descrição:**\n(Envie uma mensagem com a descrição)',
        ephemeral: true
      });
      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });
      collector.on('collect', async (message) => {
        const content = message.content.trim();
        const cfg = await getConfig(interaction.guildId) || { embedConfig: {} };
        if (!cfg.embedConfig) cfg.embedConfig = {};
        cfg.embedConfig.description = content;
        await updateConfig(interaction.guildId, { embedConfig: cfg.embedConfig });
        await interaction.followUp({ content: `✅ Descrição atualizada para:\n${content}`, ephemeral: true });
      });
      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true });
        }
      });
      return;
    }

    // ====== BOTÃO: EDIT COR ======
    if (interaction.customId === 'edit_color') {
      await interaction.reply({
        content: '🎨 **Digite a nova cor:**\n(Ex: #5865F2 ou #FF0000)',
        ephemeral: true
      });
      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });
      collector.on('collect', async (message) => {
        const content = message.content.trim();
        if (!/^#?[0-9A-Fa-f]{6}$/.test(content)) {
          return interaction.followUp({ content: '❌ Cor inválida! Use #RRGGBB', ephemeral: true });
        }
        const cfg = await getConfig(interaction.guildId) || { embedConfig: {} };
        if (!cfg.embedConfig) cfg.embedConfig = {};
        cfg.embedConfig.color = content.startsWith('#') ? content : `#${content}`;
        await updateConfig(interaction.guildId, { embedConfig: cfg.embedConfig });
        await interaction.followUp({ content: `✅ Cor atualizada para: ${content}`, ephemeral: true });
      });
      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true });
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
        const content = message.content.trim();
        const parts = content.split('|').map(s => s.trim());
        if (parts.length < 2) {
          return interaction.followUp({ content: '❌ Formato inválido! Use: `Nome | identificador`', ephemeral: true });
        }
        const [label, value] = parts;
        const cfg = await getConfig(interaction.guildId) || { categories: [] };
        if (!cfg.categories) cfg.categories = [];
        cfg.categories.push({ label, value: value.toLowerCase().replace(/\s/g, '_') });
        await updateConfig(interaction.guildId, { categories: cfg.categories });
        await interaction.followUp({ content: `✅ Categoria adicionada: **${label}** (ID: \`${value}\`)`, ephemeral: true });
      });
      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true });
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
        content: `📋 **Categorias disponíveis:**\n${categories.map((cat, i) => `${i+1}. ${cat.label} (\`${cat.value}\`)`).join('\n')}\n\n**Digite o ID da categoria que deseja remover:**`,
        ephemeral: true
      });
      const filter = m => m.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, max: 1, time: 60000 });
      collector.on('collect', async (message) => {
        const categoryId = message.content.trim();
        const cfg = await getConfig(interaction.guildId);
        const filtered = (cfg?.categories || []).filter(c => c.value !== categoryId);
        if (filtered.length === (cfg?.categories || []).length) {
          return interaction.followUp({ content: `❌ Categoria \`${categoryId}\` não encontrada!`, ephemeral: true });
        }
        cfg.categories = filtered;
        await updateConfig(interaction.guildId, { categories: cfg.categories });
        await interaction.followUp({ content: `✅ Categoria \`${categoryId}\` removida!`, ephemeral: true });
      });
      collector.on('end', async (collected) => {
        if (collected.size === 0) {
          await interaction.followUp({ content: '⏰ Tempo esgotado!', ephemeral: true });
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
      const embed = new EmbedBuilder().setTitle('📋 Categorias').setColor('#5865F2');
      categories.forEach((cat, i) => {
        embed.addFields({ name: `${i+1}. ${cat.label}`, value: `ID: \`${cat.value}\``, inline: false });
      });
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // ====== BOTÃO: SOLICITAR LICENÇA ======
    if (interaction.customId === 'solicitar_licenca') {
      const Request = require('../models/Request');
      const License = require('../models/License');
      
      const existingLicense = await verifyLicenseByGuild(interaction.guildId);
      if (existingLicense) {
        return interaction.reply({
          content: '✅ **Este servidor já está licenciado!**',
          ephemeral: true
        });
      }

      const existingRequest = await Request.findOne({ 
        guildId: interaction.guildId,
        status: 'pending'
      });
      
      if (existingRequest) {
        return interaction.reply({
          content: '⏳ **Você já tem uma solicitação pendente!**\nAguardando aprovação do dono.',
          ephemeral: true
        });
      }

      const request = new Request({
        guildId: interaction.guildId,
        guildName: interaction.guild.name,
        userId: interaction.user.id,
        userName: interaction.user.username,
        userTag: interaction.user.tag,
        status: 'pending'
      });
      await request.save();

      const CHANNEL_ID = '1546579248020459654';
      const channel = await interaction.client.channels.fetch(CHANNEL_ID);
      
      if (!channel) {
        return interaction.reply({
          content: '❌ Erro ao enviar solicitação. Contate o suporte.',
          ephemeral: true
        });
      }

      const embed = new EmbedBuilder()
        .setTitle('📋 Nova Solicitação de Licença')
        .setDescription('Alguém solicitou uma licença do **EASY TICKET**!')
        .setColor('#FFA500')
        .addFields(
          { name: '🆔 Servidor', value: `**${interaction.guild.name}**`, inline: true },
          { name: '📌 ID do Servidor', value: `\`${interaction.guildId}\``, inline: true },
          { name: '👤 Solicitante', value: `${interaction.user.tag} (${interaction.user.id})`, inline: false },
          { name: '📅 Data', value: `<t:${Math.floor(Date.now()/1000)}:F>`, inline: true },
          { name: '👥 Membros', value: `${interaction.guild.memberCount} membros`, inline: true }
        )
        .setFooter({ text: 'EASY TICKET - Sistema de Licenças' })
        .setTimestamp();

      const row = new ActionRowBuilder()
        .addComponents(
          new ButtonBuilder()
            .setCustomId(`aprovar_${interaction.guildId}`)
            .setLabel('✅ Aprovar')
            .setStyle(ButtonStyle.Success),
          new ButtonBuilder()
            .setCustomId(`recusar_${interaction.guildId}`)
            .setLabel('❌ Recusar')
            .setStyle(ButtonStyle.Danger)
        );

      await channel.send({
        content: `<@1320305759120134174> Nova solicitação!`,
        embeds: [embed],
        components: [row]
      });

      await interaction.reply({
        content: '✅ **Solicitação enviada!**\nAguarde a aprovação do dono.',
        ephemeral: true
      });
      return;
    }

    // ====== BOTÃO: APROVAR LICENÇA ======
    if (interaction.customId && interaction.customId.startsWith('aprovar_')) {
      const ownerId = '1320305759120134174';
      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: '❌ Apenas o dono do bot pode aprovar licenças.',
          ephemeral: true
        });
      }

      const guildId = interaction.customId.replace('aprovar_', '');
      const Request = require('../models/Request');
      const License = require('../models/License');
      
      const request = await Request.findOne({ guildId, status: 'pending' });
      if (!request) {
        return interaction.reply({
          content: '❌ Solicitação não encontrada.',
          ephemeral: true
        });
      }

      request.status = 'approved';
      request.approvedAt = new Date();
      request.approvedBy = interaction.user.id;
      await request.save();

      const code = Math.random().toString(36).substring(2, 10).toUpperCase();
      const license = new License({
        code,
        guildId: request.guildId,
        buyerName: request.userName,
        expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000),
        status: 'active'
      });
      await license.save();

      const client = await interaction.client.users.fetch(request.userId);
      if (client) {
        await client.send({
          content: `✅ **Licença aprovada!**\n\n` +
                   `📝 Código: \`${code}\`\n` +
                   `🆔 Servidor: **${request.guildName}**\n` +
                   `📅 Válida por 1 ano.\n\n` +
                   `Agora você pode usar os comandos:\n` +
                   `\`/config category\`\n` +
                   `\`/config support\`\n` +
                   `\`/config logs\`\n` +
                   `\`/panel\``
        });
      }

      await interaction.reply({
        content: `✅ **Licença aprovada!**\nCódigo: \`${code}\`\nServidor: ${request.guildName}\nUsuário notificado.`,
        ephemeral: true
      });

      await interaction.message.edit({
        embeds: [interaction.message.embeds[0].setColor('#00FF00').setTitle('✅ Licença Aprovada')],
        components: []
      });
      return;
    }

    // ====== BOTÃO: RECUSAR LICENÇA ======
    if (interaction.customId && interaction.customId.startsWith('recusar_')) {
      const ownerId = '1320305759120134174';
      if (interaction.user.id !== ownerId) {
        return interaction.reply({
          content: '❌ Apenas o dono do bot pode recusar licenças.',
          ephemeral: true
        });
      }

      const guildId = interaction.customId.replace('recusar_', '');
      const Request = require('../models/Request');
      
      const request = await Request.findOne({ guildId, status: 'pending' });
      if (!request) {
        return interaction.reply({
          content: '❌ Solicitação não encontrada.',
          ephemeral: true
        });
      }

      request.status = 'rejected';
      await request.save();

      const client = await interaction.client.users.fetch(request.userId);
      if (client) {
        await client.send({
          content: `❌ **Solicitação de licença recusada.**\n\n` +
                   `Entre em contato com o suporte para mais informações.`
        });
      }

      await interaction.reply({
        content: `❌ **Licença recusada!**\nServidor: ${request.guildName}`,
        ephemeral: true
      });

      await interaction.message.edit({
        embeds: [interaction.message.embeds[0].setColor('#FF0000').setTitle('❌ Licença Recusada')],
        components: []
      });
      return;
    }    // ====== PEGAR CATEGORIAS PERSONALIZADAS ======
    const categories = config.categories || [
      { label: '🛒 Venda de Bot', value: 'venda', description: 'Comprar um bot' },
      { label: '🔧 Suporte Técnico', value: 'suporte', description: 'Ajuda com bots' },
      { label: '❓ Dúvidas', value: 'duvida', description: 'Tirar dúvidas' },
      { label: '⚠️ Reclamação', value: 'reclamacao', description: 'Reportar problema' }
    ];

    // ====== BOTÃO: ABRIR TICKET ======
    if (interaction.customId === 'open_ticket') {
      const maxTickets = config.maxTicketsPerUser || 3;
      const userTickets = await getTickets(interaction.guildId, interaction.user.id)
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
      const tickets = await getTickets(interaction.guildId, interaction.user.id)
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
      const ticket = await getTicket(interaction.channelId);
      
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

        await updateTicket(interaction.channelId, {
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
      const ticket = await getTicket(interaction.channelId);
      
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

      await updateTicket(interaction.channelId, {
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
      
      const selectedCategory = categories.find(c => c.value === category);
      const categoryLabel = selectedCategory ? selectedCategory.label : category;

      const ticketCount = await incrementTicketCounter(interaction.guildId);

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
      await createTicket(ticketData);

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
