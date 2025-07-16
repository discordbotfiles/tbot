const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('mute')
    .setDescription('Manage mutes in the server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Mute a user')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('User to mute')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for mute')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Unmute a user')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('User to unmute')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for unmute')
            .setRequired(false))),

  async execute(interaction) {
    const isSlash = !!interaction.isChatInputCommand;

    let member, guild, channel, replyFunc;

    if (isSlash) {
      member = interaction.member;
      guild = interaction.guild;
      channel = interaction.channel;
      replyFunc = (msg, opts = { ephemeral: true }) =>
        interaction.reply(typeof msg === 'string' ? { content: msg, ...opts } : msg);
    } else {
      member = interaction.member;
      guild = interaction.guild;
      channel = interaction.channel;
      replyFunc = (msg) => interaction.reply(msg);
    }

    if (!member.permissions.has(PermissionsBitField.Flags.ModerateMembers)) {
      return replyFunc("You don't have permission to mute/unmute members.");
    }

    if (isSlash) {
      const subcommand = interaction.options.getSubcommand();
      const user = interaction.options.getUser('target');
      const reason = interaction.options.getString('reason') || 'No reason provided';

      const targetMember = guild.members.cache.get(user.id);
      if (!targetMember) {
        return replyFunc("User not found in this server.");
      }

      if (subcommand === 'add') {
        if (!targetMember.moderatable) {
          return replyFunc("I can't mute this user.");
        }
        try {
          await targetMember.timeout(10 * 60 * 1000, reason);
          await replyFunc(`${user.tag} has been muted. Reason: ${reason}`, { ephemeral: false });
        } catch (error) {
          console.error(error);
          await replyFunc("Failed to mute the user.");
        }
      } else if (subcommand === 'remove') {
        try {
          await targetMember.timeout(null, reason);
          await replyFunc(`${user.tag} has been unmuted. Reason: ${reason}`, { ephemeral: false });
        } catch (error) {
          console.error(error);
          await replyFunc("Failed to unmute the user.");
        }
      }

    } else {
      // Prefix command
      const args = interaction.content.trim().split(/\s+/);
      args.shift(); // Remove prefix + command, e.g. 't!mute'

      const subcommand = args.shift();
      if (!subcommand) return replyFunc("Please specify a subcommand: add or remove.");

      const userMention = args.shift();
      if (!userMention) return replyFunc("Please mention a user.");

      const userId = getUserIdFromMention(userMention);
      if (!userId) return replyFunc("Invalid user mention.");

      const targetMember = guild.members.cache.get(userId);
      if (!targetMember) return replyFunc("User not found in this server.");

      const reason = args.join(' ') || 'No reason provided';

      if (subcommand === 'add') {
        if (!targetMember.moderatable) return replyFunc("I can't mute this user.");
        try {
          await targetMember.timeout(10 * 60 * 1000, reason);
          replyFunc(`${targetMember.user.tag} has been muted. Reason: ${reason}`);
        } catch (error) {
          console.error(error);
          replyFunc("Failed to mute the user.");
        }
      } else if (subcommand === 'remove') {
        try {
          await targetMember.timeout(null, reason);
          replyFunc(`${targetMember.user.tag} has been unmuted. Reason: ${reason}`);
        } catch (error) {
          console.error(error);
          replyFunc("Failed to unmute the user.");
        }
      } else {
        replyFunc("Unknown subcommand. Use add or remove.");
      }
    }
  }
};

function getUserIdFromMention(mention) {
  if (!mention) return null;
  const matches = mention.match(/^<@!?(\d+)>$/);
  return matches ? matches[1] : null;
}
