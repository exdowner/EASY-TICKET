const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const { unlockGuild, isUnlocked } = require('../database/database');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('unlock')
    .setDescription('Liberar um servidor para usar o bot (SÓ O DONO)'),

  async execute(interaction) {
    const OWNER_ID = '1320305759120134174';
    
    if (interaction.user.id !== OWNER_ID) {
      return interaction.reply({
        content: '❌ **Acesso Negado!** Apenas o dono do bot pode usar este comando.',
        ephemeral: true
      });
    }

    const guildId = interaction.guildId;
    const guildName = interaction.guild.name;

    await unlockGuild(guildId);
    const unlocked = await isUnlocked(guildId);

    const embed = new EmbedBuilder()
      .setTitle('🔓 Servidor Liberado!')
      .setDescription(`**${guildName}** agora está liberado para usar o EASY TICKET!`)
      .setColor('#00FF00')
      .addFields(
        { name: '🆔 ID do Servidor', value: `\`${guildId}\``, inline: true },
        { name: '📊 Status', value: unlocked ? '✅ Liberado' : '❌ Erro ao liberar', inline: true }
      )
      .setTimestamp();

    await interaction.reply({ embeds: [embed], ephemeral: true });
  }
};
