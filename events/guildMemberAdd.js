const path = require('path');
const { AttachmentBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
  name: 'guildMemberAdd',
  once: false,
  async execute(member) {
    const channel = member.guild.channels.cache.get('1343930373154930751');
    if (!channel) {
      console.log('Welcome channel not found.');
      return;
    }

    try {
      const imagePath = path.join(__dirname, '..', 'assets', 'cat.jpg'); 
      // __dirname = folder where this file is
      // .. = go up one folder, adjust depending on your file structure
      
      const attachment = new AttachmentBuilder(imagePath);

      const embed = new EmbedBuilder()
        .setTitle("้ ° ：welcome to Toastezz's Lounge  ╮")
        .setDescription(`It's nice to see you here, ${member.user}!
1 • check out https://discord.com/channels/1343926495168561255/1343929806114259015
2 • get some https://discord.com/channels/1343926495168561255/1343930454394536047
3・chat in https://discord.com/channels/1343926495168561255/1380589677295304890`)
        .setColor('#000000')
        .setImage('attachment://cat.jpg');

      await channel.send({
        content: `welcome, ${member.user}!`,
        embeds: [embed],
        files: [attachment]
      });

      console.log('Welcome message sent successfully.');
    } catch (error) {
      console.error('Error sending welcome message:', error);
    }
  }
};
