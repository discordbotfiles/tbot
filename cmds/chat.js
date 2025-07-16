const { SlashCommandBuilder } = require('discord.js');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const userConversations = new Map();

module.exports = {
  data: new SlashCommandBuilder()
    .setName('chat')
    .setDescription('Chat with the AI bot')
    .addStringOption(option =>
      option.setName('message')
        .setDescription('Your message to the bot')
        .setRequired(true)
    ),

  async execute(interaction) {
    // Detect if it's a slash command or prefix command:
    let userMessage;
    let userId;
    let replyFunc;

    if (interaction.isChatInputCommand && interaction.isChatInputCommand()) {
      userMessage = interaction.options.getString('message');
      userId = interaction.user.id;
      replyFunc = async (msg) => {
        if (interaction.deferred || interaction.replied) {
          await interaction.editReply(msg);
        } else {
          await interaction.reply(msg);
        }
      };
      await interaction.deferReply();
    } else {
      // prefix command
      const args = interaction.content.split(' ').slice(1);
      userMessage = args.join(' ');
      userId = interaction.author.id;
      replyFunc = (msg) => interaction.channel.send(msg);
    }

    // Save user message
    if (!userConversations.has(userId)) userConversations.set(userId, []);
    userConversations.get(userId).push({ role: 'user', content: userMessage });

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: userConversations.get(userId),
      });

      const aiResponse = completion.choices[0].message.content;

      userConversations.get(userId).push({ role: 'assistant', content: aiResponse });

      await replyFunc(aiResponse);
    } catch (error) {
      console.error(error);
      await replyFunc('Error generating response.');
    }
  },

  userConversations
};
