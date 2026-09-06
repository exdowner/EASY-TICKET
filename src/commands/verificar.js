const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { verifyLicenseByCode, verifyLicenseByGuild } = require('../database/licenses');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('verificar')
    .setDescription('Verificar e ativar sua licença')
    .addStringOption(opt => opt
      .setName('codigo')
      .setDescription('Código da licença')
      .setRequired(true)),

  async execute(interaction) {
    try {
      const code = interaction.options.getString('codigo').toUpperCase();
      const guildId = interaction.guildId;

      // Verificar se o servidor já tem licença ativa
      const existingLicense = verifyLicenseByGuild(guildId);
      if (existingLicense) {
        return interaction.reply({
          content: '✅ **Este servidor já está licenciado!**\n\n' +
                   `📝 Código: \`${existingLicense.code}\`\n` +
                   `👤 Comprador: ${existingLicense.buyerName}\n` +
                   `📅 Expira em: <t:${Math.floor(new Date(existingLicense.expiresAt).getTime() / 1000)}:R>`,
          ephemeral: true
        });
      }

      // Verificar se o código é válido
      const license = verifyLicenseByCode(code);
      
      if (!license) {
        return interaction.reply({
          content: '❌ **Código inválido ou expirado!**\n\n' +
                   'Entre em contato com o suporte para adquirir uma licença válida.',
          ephemeral: true
        });
      }

      // Verificar se o código pertence a este servidor
      if (license.guildId !== guildId) {
        return interaction.reply({
          content: '❌ **Este código não pertence a este servidor!**\n\n' +
                   `O código foi gerado para o servidor \`${license.guildId}\``,
          ephemeral: true
        });
      }

      // ====== SUCESSO! LICENÇA ATIVADA ======
      const embed = new EmbedBuilder()
        .setTitle('✅ Licença Ativada com Sucesso!')
        .setDescription('**EASY TICKET** está totalmente liberado neste servidor!')
        .setColor('#00FF00')
        .addFields(
          { name: '📝 Código', value: `\`${license.code}\``, inline: true },
          { name: '👤 Comprador', value: license.buyerName, inline: true },
          { name: '📅 Expira em', value: `<t:${Math.floor(new Date(license.expiresAt).getTime() / 1000)}:R>`, inline: true }
        )
        .setFooter({ text: 'EASY TICKET - Licença Ativa' })
        .setTimestamp();

      await interaction.reply({
        embeds: [embed],
        ephemeral: true
      });

    } catch (error) {
      console.error('❌ Erro no /verificar:', error);
      await interaction.reply({
        content: `❌ Erro ao verificar licença: ${error.message}`,
        ephemeral: true
      });
    }
  }
};
