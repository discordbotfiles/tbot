const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('cmds')
    .setDescription('Lists all available commands'),

  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setTitle('📜 Commands')
      .setColor(0x00AE86)
      .setDescription([
        '**Moderation Commands**',
        '`/ban add @user [reason]` | `t!ban add @user [reason]`',
        '`/ban temp @user [duration]` | `t!ban temp @user [duration]`',
        '`/ban remove @user` | `t!ban remove @user`',
        '`/mute add @user [reason]` | `t!mute add @user [reason]`',
        '`/mute remove @user` | `t!mute remove @user`',
        '`/role add @user [role]` | `t!role add @user [role]`',
        '`/role remove @user [role]` | `t!role remove @user [role]`',
        '',
        '**Utility Commands**',
        '`/chat [message]` | `t!chat [message]`',
        '`/lmao` | `t!lmao`',
        '`/cmds` | `t!cmds`'
      ].join('\n'))
      .setFooter({ text: 'Use each command in a server where the bot has permission.' });

    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      // Slash command reply (ephemeral)
      await interaction.reply({ embeds: [embed], ephemeral: true });
    } else {
      // Prefix command reply in the channel
      await interaction.channel.send({ embeds: [embed] });
    }
  }
};
