const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ticket')
    .setDescription('Send the ticket creation button'),

  async execute(interaction) {
    const row = new ActionRowBuilder()
      .addComponents(
        new ButtonBuilder()
          .setCustomId('create_ticket')
          .setLabel('Create Ticket')
          .setStyle(ButtonStyle.Primary)
      );

    const channelId = '1343930714898563103';
    const guild = interaction.guild;

    // For slash command:
    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        return interaction.reply({ content: 'Ticket channel not found. Please check the channel ID.', ephemeral: true });
      }

      await channel.send({ content: 'Click the button below to create a ticket!', components: [row] });
      return interaction.reply({ content: `Ticket button sent in ${channel}.`, ephemeral: true });
    }

    // For prefix command:
    if (interaction.content.startsWith('t!ticket')) {
      const channel = guild.channels.cache.get(channelId);
      if (!channel) {
        return interaction.reply('Ticket channel not found. Please check the channel ID.');
      }

      await channel.send({ content: 'Click the button below to create a ticket!', components: [row] });
      return interaction.reply(`Ticket button sent in ${channel}.`);
    }
  }
};
