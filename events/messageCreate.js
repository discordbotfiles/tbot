const { Events } = require('discord.js');
const OpenAI = require('openai');
const { userConversations } = require('../cmds/chat');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  name: Events.MessageCreate,
  async execute(message) {
    if (message.author.bot) return;
    if (!message.reference) return;

    try {
      const repliedMessage = await message.channel.messages.fetch(message.reference.messageId);
      if (repliedMessage.author.id !== message.client.user.id) return;

      const userId = message.author.id;
      const history = userConversations.get(userId);
      if (!history) return;

      history.push({ role: 'user', content: message.content });

      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: history,
      });

      const aiResponse = completion.choices[0].message.content;

      history.push({ role: 'assistant', content: aiResponse });

      await message.reply(aiResponse);
    } catch (err) {
      console.error(err);
    }
  }
};
