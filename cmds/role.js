const { SlashCommandBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('role')
    .setDescription('Manage roles for users')
    .addSubcommand(subcommand =>
      subcommand
        .setName('add')
        .setDescription('Add a role to a user')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('User to add role to')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Role to add')
            .setRequired(true)))
    .addSubcommand(subcommand =>
      subcommand
        .setName('remove')
        .setDescription('Remove a role from a user')
        .addUserOption(option =>
          option.setName('target')
            .setDescription('User to remove role from')
            .setRequired(true))
        .addRoleOption(option =>
          option.setName('role')
            .setDescription('Role to remove')
            .setRequired(true))),

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ManageRoles)) {
      return interaction.reply({ content: "You don't have permission to manage roles.", ephemeral: true });
    }

    const subcommand = interaction.options.getSubcommand();
    const user = interaction.options.getUser('target');
    const role = interaction.options.getRole('role');

    const member = interaction.guild.members.cache.get(user.id);
    if (!member) {
      return interaction.reply({ content: "User not found in this server.", ephemeral: true });
    }

    if (!member.manageable) {
      return interaction.reply({ content: "I cannot manage roles for this user.", ephemeral: true });
    }

    if (subcommand === 'add') {
      if (member.roles.cache.has(role.id)) {
        return interaction.reply({ content: "User already has this role.", ephemeral: true });
      }
      await member.roles.add(role);
      await interaction.reply(`Added role ${role.name} to ${user.tag}.`);
    } 
    
    else if (subcommand === 'remove') {
      if (!member.roles.cache.has(role.id)) {
        return interaction.reply({ content: "User does not have this role.", ephemeral: true });
      }
      await member.roles.remove(role);
      await interaction.reply(`Removed role ${role.name} from ${user.tag}.`);
    }
  }
};
