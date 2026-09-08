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

    // Filtra categorias inválidas
    const validCategories = categories
      .filter(cat => cat.label && cat.value)
      .map(cat => {
        const option = {
          label: String(cat.label).slice(0, 100),
          value: String(cat.value).slice(0, 100)
        };
        if (cat.description && String(cat.description).trim().length > 0) {
          option.description = String(cat.description).slice(0, 100);
        }
        return option;
      })
      .slice(0, 25); // Discord só aceita no máximo 25 opções

    if (validCategories.length === 0) {
      return interaction.reply({
        content: '❌ Nenhuma categoria válida configurada. Use o painel de configuração para adicionar categorias.',
        ephemeral: true
      });
    }    const embed = new EmbedBuilder()
      .setTitle('🎫 Selecionar Categoria')
      .setDescription('Escolha a categoria do seu ticket:')
      .setColor('#5865F2');

    const select = new StringSelectMenuBuilder()
      .setCustomId('ticket_category')
      .setPlaceholder('Selecione uma categoria...')
      .addOptions(validCategories);

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
