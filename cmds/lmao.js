const { SlashCommandBuilder } = require('discord.js');
const OpenAI = require('openai');

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

module.exports = {
  data: new SlashCommandBuilder()
    .setName('lmao')
    .setDescription('Roast Toasty with a brutal but funny AI insult'),

  async execute(interactionOrMessage) {
    // Determine if this is a slash command interaction or a prefix message
    const isInteraction = typeof interactionOrMessage.deferReply === 'function';

    // Defer reply for slash command, send typing for prefix command
    if (isInteraction) {
      await interactionOrMessage.deferReply();
    } else {
      await interactionOrMessage.channel.sendTyping();
    }

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are a savage, funny AI. Come up with a brutal but hilarious roast about the owner, named Toasty. Keep it lighthearted, clever, and not genuinely offensive. Try not to make them toast themed.'
          },
          {
            role: 'user',
            content: 'Roast Toasty.'
          }
        ],
        temperature: 1.2
      });

      const roast = completion.choices[0].message.content;

      if (isInteraction) {
        await interactionOrMessage.editReply(roast);
      } else {
        await interactionOrMessage.channel.send(roast);
      }
    } catch (error) {
      console.error(error);
      if (isInteraction) {
        await interactionOrMessage.editReply('Toasty dodged the roast this time. Try again later.');
      } else {
        await interactionOrMessage.channel.send('Toasty dodged the roast this time. Try again later.');
      }
    }
  }
};
