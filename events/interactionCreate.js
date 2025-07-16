require('dotenv').config();
const {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle,
  InteractionType,
  PermissionsBitField,
  EmbedBuilder,
  ChannelType
} = require('discord.js');

module.exports = {
  name: 'interactionCreate',
  async execute(interaction) {
    try {
      if (interaction.isButton()) {
        if (interaction.customId === 'create_ticket') {
          // Show modal for ticket creation
          const modal = new ModalBuilder()
            .setCustomId('ticket_modal')
            .setTitle('Create a Ticket');

          const reportedUserInput = new TextInputBuilder()
            .setCustomId('reported_user')
            .setLabel("Who are you reporting or need help with?")
            .setStyle(TextInputStyle.Short)
            .setPlaceholder('@username or description')
            .setRequired(true);

          const issueInput = new TextInputBuilder()
            .setCustomId('issue_description')
            .setLabel("Describe your issue or request")
            .setStyle(TextInputStyle.Paragraph)
            .setRequired(true);

          modal.addComponents(
            new ActionRowBuilder().addComponents(reportedUserInput),
            new ActionRowBuilder().addComponents(issueInput)
          );

          await interaction.showModal(modal);

        } else if (interaction.customId === 'close_ticket') {
          // Ticket close logic
          const logChannel = interaction.guild.channels.cache.get(process.env.LOG_CHANNEL_ID);
          if (!logChannel) {
            console.warn('⚠️ Log channel not found. Check LOG_CHANNEL_ID in .env.');
          } else {
            const messages = await interaction.channel.messages.fetch({ limit: 100 });
            const logContent = messages
              .reverse()
              .map(m => `${m.author.tag}: ${m.content}`)
              .join('\n');

            const embed = new EmbedBuilder()
              .setTitle(`🎫 Ticket Closed: ${interaction.channel.name}`)
              .setDescription(`Closed by: ${interaction.user.tag}\n\n**Transcript:**\n\`\`\`\n${logContent}\n\`\`\``)
              .setColor(0xff0000)
              .setTimestamp();

            await logChannel.send({ embeds: [embed] });
          }

          await interaction.reply({ content: 'Ticket closed. This channel will be deleted in 10 seconds.', flags: 64 });

          setTimeout(() => interaction.channel.delete(), 10000);
        }
      } else if (interaction.type === InteractionType.ModalSubmit) {
        if (interaction.customId === 'ticket_modal') {
          // Get inputs
          const reportedUser = interaction.fields.getTextInputValue('reported_user');
          const issueDescription = interaction.fields.getTextInputValue('issue_description');

          // Find roles & category
          const guild = interaction.guild;
          const everyoneRole = guild.roles.everyone;
          const staffRole = guild.roles.cache.find(r => r.name.toLowerCase() === 'staff');

          // Get category ID from env variable
          const categoryId = process.env.TICKET_CATEGORY_ID;
          if (!categoryId) {
            return interaction.reply({ content: 'Ticket category ID is not set in .env.', flags: 64 });
          }
          const category = guild.channels.cache.get(categoryId);
          if (!category || category.type !== ChannelType.GuildCategory) {
            return interaction.reply({ content: 'Ticket category not found or is not a category.', flags: 64 });
          }

          // Set permissions for ticket channel
          const permissionOverwrites = [
            {
              id: everyoneRole.id,
              deny: [PermissionsBitField.Flags.ViewChannel],
            },
            {
              id: interaction.user.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
            }
          ];

          if (staffRole) {
            permissionOverwrites.push({
              id: staffRole.id,
              allow: [PermissionsBitField.Flags.ViewChannel, PermissionsBitField.Flags.SendMessages, PermissionsBitField.Flags.ReadMessageHistory],
            });
          }

          // Create the ticket channel in the category
          const channel = await guild.channels.create({
            name: `ticket-${interaction.user.username.toLowerCase()}`,
            type: ChannelType.GuildText,
            parent: category.id,
            permissionOverwrites,
            reason: 'Ticket created',
          });

          await channel.send({
            content: `Ticket created by ${interaction.user}.\n**Reported User:** ${reportedUser}\n**Issue:** ${issueDescription}`,
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId('close_ticket')
                  .setLabel('Close Ticket')
                  .setStyle(ButtonStyle.Danger)
              )
            ]
          });

          await interaction.reply({ content: `Ticket created: ${channel}`, flags: 64 });
        }
      }
    } catch (error) {
      console.error('Error handling interaction:', error);
      if (!interaction.replied && !interaction.deferred) {
        await interaction.reply({ content: 'There was an error while processing this interaction.', flags: 64 });
      }
    }
  }
};
