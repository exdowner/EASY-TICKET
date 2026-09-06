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
      // ====== VERIFICAR SE É UM SERVIDOR ======
      if (!interaction.guild) {
        return interaction.reply({
          content: '❌ Este comando só pode ser usado em um servidor!',
          ephemeral: true
        });
      }

      const tipo = interaction.options.getString('tipo');
      const guildId = interaction.guildId;
      const guildName = interaction.guild.name;

      let dias;
      let tipoLabel;
      
      if (tipo === 'vitalicio') {
        dias = 99999;
        tipoLabel = '♾️ Vitalício';
      } else {
        dias = parseInt(tipo);
        tipoLabel = `📅 ${dias} Dias`;
      }

      // ====== GERAR LICENÇA ======
      const license = generateLicense(guildId, interaction.user.username, dias);

      // ====== TENTAR PEGAR O DONO DO SERVIDOR ======
      let ownerName = 'Desconhecido';
      try {
        const guildOwner = await interaction.guild.fetchOwner();
        if (guildOwner && guildOwner.user) {
          ownerName = guildOwner.user.username;
        }
      } catch (error) {
        console.log('⚠️ Não foi possível buscar o dono do servidor:', error.message);
        // Se não conseguir pegar o dono, usa um nome genérico
        ownerName = 'Dono do Servidor';
      }

      // ====== EMBED ======
      const embed = new EmbedBuilder()
        .setTitle('🔑 Licença Gerada!')
        .setColor(tipo === 'vitalicio' ? '#FFD700' : '#00FF00')
        .setDescription(`**Código:** \`${license.code}\``)
        .addFields(
          { name: '📅 Validade', value: tipoLabel, inline: true },
          { name: '👑 Servidor', value: guildName, inline: true },
          { name: '👤 Dono', value: ownerName, inline: true }
        )
        .setFooter({ text: `Gerado por ${interaction.user.username}` })
        .setTimestamp();

      await interaction.reply({ embeds: [embed] });

      // ====== MENSAGEM COM O CÓDIGO ======
      await interaction.followUp({
        content: `📝 **Mande este código para o dono do servidor:**\n\`\`\`${license.code}\`\`\`\nEle deve usar \`/verificar ${license.code}\` para ativar.`
      });

    } catch (error) {
      console.error('❌ Erro no /gerar:', error);
      await interaction.reply({
        content: '❌ Erro ao gerar licença. Verifique os logs.',
        ephemeral: true
      });
    }
  }
};
