module.exports = {
  data: {
    name: '8ball',
    description: 'Ask the magic 8ball a question.',
    options: [
      {
        name: 'question',
        type: 3, // STRING
        description: 'Your question',
        required: true,
      },
    ],
  },

  async execute(interactionOrMessage, args) {
    const isSlash = interactionOrMessage.isCommand?.();
    const question = isSlash
      ? interactionOrMessage.options.getString('question')
      : args && args.length > 0
      ? args.join(' ')
      : null;

    if (!question) {
      const msg = 'Please ask a question.';
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    const responses = [
      'It is certain.',
      'Without a doubt.',
      'You may rely on it.',
      'Ask again later.',
      'Better not tell you now.',
      'Don’t count on it.',
      'My reply is no.',
      'Very doubtful.',
      'Signs point to yes.',
    ];

    const answer = responses[Math.floor(Math.random() * responses.length)];

    const msg = `🎱 Question: ${question}\nAnswer: **${answer}**`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
