const { SlashCommandBuilder, PermissionsBitField, EmbedBuilder } = require('discord.js');
const { updateConfig, getConfig } = require('../database/database');

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
        
        if (!category) {
          return interaction.reply({
            content: '❌ Categoria não encontrada!',
            ephemeral: true
          });
        }
        
        if (category.type !== 4) {
          return interaction.reply({
            content: '❌ Isso não é uma categoria! Selecione uma **categoria** (as que ficam agrupando canais).',
            ephemeral: true
          });
        }
        
        await updateConfig(guildId, { categoryId: category.id });
        const savedConfig = await getConfig(guildId);
        
        embed.setTitle('✅ Categoria Definida')
          .setDescription(`📁 **${category.name}** (ID: \`${category.id}\`)`)
          .addFields(
            { name: '📊 Status', value: savedConfig?.categoryId === category.id ? '✅ Salvo' : '❌ Erro ao salvar', inline: true }
          );
      } 
      else if (sub === 'support') {
        const role = interaction.options.getRole('cargo');
        
        if (!role) {
          return interaction.reply({
            content: '❌ Cargo não encontrado!',
            ephemeral: true
          });
        }
        
        await updateConfig(guildId, { supportRoleId: role.id });
        const savedConfig = await getConfig(guildId);
        
        embed.setTitle('✅ Cargo de Suporte Definido')
          .setDescription(`👤 **${role.name}** (ID: \`${role.id}\`)`)
          .addFields(
            { name: '📊 Status', value: savedConfig?.supportRoleId === role.id ? '✅ Salvo' : '❌ Erro ao salvar', inline: true }
          );
      } 
      else if (sub === 'logs') {
        const channel = interaction.options.getChannel('canal');
        
        if (!channel) {
          return interaction.reply({
            content: '❌ Canal não encontrado!',
            ephemeral: true
          });
        }
        
        if (channel.type !== 0) {
          return interaction.reply({
            content: '❌ Isso não é um canal de texto! Selecione um canal de texto normal.',
            ephemeral: true
          });
        }
        
        await updateConfig(guildId, { logChannelId: channel.id });
        const savedConfig = await getConfig(guildId);
        
        embed.setTitle('✅ Canal de Logs Definido')
          .setDescription(`📝 **${channel.name}** (ID: \`${channel.id}\`)`)
          .addFields(
            { name: '📊 Status', value: savedConfig?.logChannelId === channel.id ? '✅ Salvo' : '❌ Erro ao salvar', inline: true }
          );
      }

      const finalConfig = await getConfig(guildId);
      embed.addFields(
        { name: '📁 Categoria', value: finalConfig?.categoryId ? `✅ \`${finalConfig.categoryId}\`` : '❌ Não definida', inline: true },
        { name: '👤 Suporte', value: finalConfig?.supportRoleId ? `✅ \`${finalConfig.supportRoleId}\`` : '❌ Não definido', inline: true },
        { name: '📝 Logs', value: finalConfig?.logChannelId ? `✅ \`${finalConfig.logChannelId}\`` : '❌ Não definido', inline: true }
      );

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
