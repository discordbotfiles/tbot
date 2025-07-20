const answers = [
  "It is certain.",
  "Without a doubt.",
  "You may rely on it.",
  "Yes, definitely.",
  "It is decidedly so.",
  "As I see it, yes.",
  "Most likely.",
  "Yes.",
  "Signs point to yes.",
  "Reply hazy, try again.",
  "Ask again later.",
  "Better not tell you now.",
  "Cannot predict now.",
  "Concentrate and ask again.",
  "Don't count on it.",
  "My reply is no.",
  "My sources say no.",
  "Outlook not so good.",
  "Very doubtful."
];

module.exports = {
  data: {
    name: '8ball',
    description: 'Ask the magic 8ball',
    options: [
      {
        name: 'question',
        type: 3, // STRING
        description: 'Your question',
        required: true,
      }
    ]
  },

  async execute(interactionOrMessage, args) {
    let question;

    if (interactionOrMessage.user) {
      question = interactionOrMessage.options.getString('question');
    } else {
      if (!args.length) return interactionOrMessage.channel.send('Please ask a question.');
      question = args.join(' ');
    }

    const answer = answers[Math.floor(Math.random() * answers.length)];
    const reply = `🎱 Question: ${question}\nAnswer: ${answer}`;

    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: false });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  }
};
