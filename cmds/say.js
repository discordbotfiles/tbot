const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('say')
    .setDescription('Make the bot say a message')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('The message to send')
        .setRequired(true)
    ),

  // For slash commands
  async execute(interactionOrMessage, args) {
    const isInteraction = interactionOrMessage.isChatInputCommand?.();

    if (isInteraction) {
      // Handle slash command
      const interaction = interactionOrMessage;

      if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return interaction.reply({ content: 'You do not have permission to use this command.', ephemeral: true });
      }

      const message = interaction.options.getString('message');
      await interaction.reply({ content: '✅ Message sent.', ephemeral: true });
      await interaction.channel.send(message);
    } else {
      // Handle prefix command
      const message = interactionOrMessage;
      const content = args.join(' ');

      if (!message.member.permissions.has(PermissionsBitField.Flags.ManageMessages)) {
        return message.reply('❌ You do not have permission to use this command.');
      }

      await message.delete(); // delete the command message
      await message.channel.send(content);
    }
  }
};
