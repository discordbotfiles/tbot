require('dotenv').config();
const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');

const TOKEN = process.env.BOT_TOKEN;  // Loaded from .env
const CHANNEL_ID = '1380591883172188220'; // Replace with your actual channel ID

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages],
});

client.once('ready', async () => {
  console.log(`Logged in as ${client.user.tag}`);

  try {
    const channel = await client.channels.fetch(CHANNEL_ID);
    if (!channel) {
      console.error('Channel not found!');
      process.exit(1);
    }

    const embed = new EmbedBuilder()
      .setTitle('📢 Update Log')
      .setColor(0x0099ff)
      .setDescription(`**New Features Added!**
- Currency system (Mia Coins)
- Mini-games: slots, fishing, hunting, tic tac toe, fight, 8ball, and more
- Store with items you can buy and use
- Work and invest commands with cooldowns
- Robbery and defense mechanics
- And much more fun stuff!

*Thanks for playing and supporting the bot!*`)
      .setTimestamp();

    await channel.send({ embeds: [embed] });
    console.log('Update log sent!');
  } catch (error) {
    console.error('Error sending update log:', error);
  } finally {
    client.destroy();
    process.exit(0);
  }
});

client.login(TOKEN);
