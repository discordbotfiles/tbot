const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('ban')
    .setDescription('Manage bans in the server')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Ban a user permanently')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('User to ban')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for ban')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('temp')
        .setDescription('Temporarily ban a user')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('User to temporarily ban')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('duration')
            .setDescription('Duration (e.g. 10m, 1h, 1d)')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for ban')
            .setRequired(false)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Unban a user by ID')
        .addStringOption(option =>
          option.setName('userid')
            .setDescription('User ID to unban')
            .setRequired(true))
        .addStringOption(option =>
          option.setName('reason')
            .setDescription('Reason for unban')
            .setRequired(false))),

  async execute(interaction) {
    // Check if this is a slash command or a prefix command
    // prefix commands send a "message" object as interaction
    const isSlash = !!interaction.isChatInputCommand;

    // Permissions check
    let member;
    let guild;
    let channel;
    let replyFunc;

    if (isSlash) {
      // Slash command
      member = interaction.member;
      guild = interaction.guild;
      channel = interaction.channel;
      replyFunc = (msg) => interaction.reply({ content: msg, ephemeral: true });
    } else {
      // Prefix command (interaction is actually message)
      member = interaction.member;
      guild = interaction.guild;
      channel = interaction.channel;
      replyFunc = (msg) => interaction.reply(msg);
    }

    if (!member.permissions.has(PermissionsBitField.Flags.BanMembers)) {
      return replyFunc("You don't have permission to manage bans.");
    }

    if (isSlash) {
      // Slash command logic:
      const subcommand = interaction.options.getSubcommand();

      if (subcommand === 'add') {
        const user = interaction.options.getUser('target');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const targetMember = guild.members.cache.get(user.id);
        if (!targetMember) {
          return replyFunc("User not found in this server.");
        }
        if (!targetMember.bannable) {
          return replyFunc("I can't ban this user.");
        }

        await targetMember.ban({ reason });
        return interaction.reply(`${user.tag} was banned. Reason: ${reason}`);
      } 
      
      else if (subcommand === 'temp') {
        const user = interaction.options.getUser('target');
        const duration = interaction.options.getString('duration');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        const targetMember = guild.members.cache.get(user.id);
        if (!targetMember) {
          return replyFunc("User not found in this server.");
        }
        if (!targetMember.bannable) {
          return replyFunc("I can't ban this user.");
        }

        const ms = parseDuration(duration);
        if (ms === null) {
          return replyFunc("Invalid duration format. Use like 10m, 1h, 2d.");
        }

        await targetMember.ban({ reason });
        interaction.reply(`${user.tag} was temporarily banned for ${duration}. Reason: ${reason}`);

        setTimeout(async () => {
          try {
            await guild.bans.remove(user.id, 'Temporary ban expired');
            if (channel) channel.send(`${user.tag} has been unbanned after temporary ban.`);
          } catch (error) {
            console.error(`Failed to unban user ${user.tag}:`, error);
          }
        }, ms);
      } 
      
      else if (subcommand === 'remove') {
        const userId = interaction.options.getString('userid');
        const reason = interaction.options.getString('reason') || 'No reason provided';

        try {
          const banInfo = await guild.bans.fetch(userId);
          if (!banInfo) {
            return replyFunc("This user is not banned.");
          }
        } catch {
          return replyFunc("This user is not banned.");
        }

        await guild.bans.remove(userId, reason);
        return interaction.reply(`User with ID ${userId} was unbanned. Reason: ${reason}`);
      }
    } else {
      // Prefix command logic:
      const args = interaction.content.trim().split(/\s+/);
      // args example: ["t!ban", "add", "@user", "reason words..."]
      // Remove prefix and command name:
      args.shift(); // removes "t!ban"

      const subcommand = args.shift();
      if (!subcommand) return replyFunc("Please specify a subcommand: add, temp, remove");

      if (subcommand === 'add') {
        const userMention = args.shift();
        if (!userMention) return replyFunc("Please mention a user to ban.");

        const userId = getUserIdFromMention(userMention);
        if (!userId) return replyFunc("Invalid user mention.");

        const targetMember = guild.members.cache.get(userId);
        if (!targetMember) return replyFunc("User not found in this server.");
        if (!targetMember.bannable) return replyFunc("I can't ban this user.");

        const reason = args.join(' ') || 'No reason provided';

        await targetMember.ban({ reason });
        return replyFunc(`${targetMember.user.tag} was banned. Reason: ${reason}`);
      }
      else if (subcommand === 'temp') {
        const userMention = args.shift();
        const duration = args.shift();

        if (!userMention || !duration) return replyFunc("Please provide a user mention and duration (e.g. 10m).");

        const userId = getUserIdFromMention(userMention);
        if (!userId) return replyFunc("Invalid user mention.");

        const targetMember = guild.members.cache.get(userId);
        if (!targetMember) return replyFunc("User not found in this server.");
        if (!targetMember.bannable) return replyFunc("I can't ban this user.");

        const ms = parseDuration(duration);
        if (ms === null) return replyFunc("Invalid duration format. Use like 10m, 1h, 2d.");

        const reason = args.join(' ') || 'No reason provided';

        await targetMember.ban({ reason });
        replyFunc(`${targetMember.user.tag} was temporarily banned for ${duration}. Reason: ${reason}`);

        setTimeout(async () => {
          try {
            await guild.bans.remove(userId, 'Temporary ban expired');
            if (channel) channel.send(`${targetMember.user.tag} has been unbanned after temporary ban.`);
          } catch (error) {
            console.error(`Failed to unban user ${targetMember.user.tag}:`, error);
          }
        }, ms);
      }
      else if (subcommand === 'remove') {
        const userId = args.shift();
        if (!userId) return replyFunc("Please provide the user ID to unban.");

        const reason = args.join(' ') || 'No reason provided';

        try {
          const banInfo = await guild.bans.fetch(userId);
          if (!banInfo) return replyFunc("This user is not banned.");
        } catch {
          return replyFunc("This user is not banned.");
        }

        await guild.bans.remove(userId, reason);
        return replyFunc(`User with ID ${userId} was unbanned. Reason: ${reason}`);
      }
      else {
        return replyFunc("Unknown subcommand. Use add, temp or remove.");
      }
    }
  }
};

function parseDuration(duration) {
  const regex = /^(\d+)(s|m|h|d)$/;
  const match = duration.toLowerCase().match(regex);
  if (!match) return null;

  const amount = parseInt(match[1]);
  const unit = match[2];

  switch (unit) {
    case 's': return amount * 1000;
    case 'm': return amount * 60 * 1000;
    case 'h': return amount * 60 * 60 * 1000;
    case 'd': return amount * 24 * 60 * 60 * 1000;
    default: return null;
  }
}

function getUserIdFromMention(mention) {
  if (!mention) return null;
  // Match <@!userID> or <@userID>
  const matches = mention.match(/^<@!?(\d+)>$/);
  if (!matches) return null;
  return matches[1];
}
