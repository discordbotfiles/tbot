const { Events, ActivityType } = require('discord.js');

module.exports = {
  name: Events.ClientReady,
  once: true,
  execute(client) {
    console.log(`Bot is online! Logged in as ${client.user.tag}`);

   
    client.user.setActivity("Toastezz's lounge", { type: ActivityType.Watching });
    
  }
};
