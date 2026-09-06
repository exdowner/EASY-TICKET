const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { generateLicense } = require('../database/licenses');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('gerar')
    .setDescription('Gerar uma licença (SÓ O DONO)')
    .addStringOption(opt => opt
      .setName('tipo')
      .setDescription('Tipo de licença')
      .setRequired(true)
      .addChoices(
        { name: '📅 30 Dias', value: '30' },
        { name: '📅 60 Dias', value: '60' },
        { name: '📅 90 Dias', value: '90' },
        { name: '♾️ Vitalício', value: 'vitalicio' }
      )),

  async execute(interaction) {
    // ====== SÓ VOCÊ PODE USAR ======
    const OWNER_ID = '1320305759120134174';
    
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '❌ **Acesso Negado!** Apenas o dono do bot pode usar este comando.',
        ephemeral: true
      });
    }

    try {
      const tipo = interaction.options.getString('tipo');
      const guildId = interaction.guildId;

      let dias;
      let tipoLabel;
      
      if (tipo === 'vitalicio') {
        dias = 99999;
        tipoLabel = '♾️ Vitalício';
      } else {
        dias = parseInt(tipo);
        tipoLabel = `📅 ${dias} Dias`;
      }

      const license = generateLicense(guildId, interaction.user.username, dias);
      const guildOwner = await interaction.guild.fetchOwner();

      const embed = new EmbedBuilder()
        .setTitle('🔑 Licença Gerada!')
        .setColor(tipo === 'vitalicio' ? '#FFD700' : '#00FF00')
        .setDescription(`**Código:** \`${license.code}\``)
        .addFields(
          { name: '📅 Validade', value: tipoLabel, inline: true },
          { name: '👑 Servidor', value: interaction.guild.name, inline: true },
          { name: '👤 Dono', value: guildOwner.user.username, inline: true }
        )
        .setFooter({ text: `Gerado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      await interaction.followUp({
        content: `📝 **Mande este código para o dono do servidor:**\n\`\`\`${license.code}\`\`\`\nEle deve usar \`/verificar ${license.code}\` para ativar.`,
        ephemeral: false
      });
    } catch (error) {
      console.error('Erro no /gerar:', error);
      await interaction.reply({
        content: '❌ Erro ao gerar licença. Verifique os logs.',
        ephemeral: true
      });
    }
  }
};
