const { addBalance } = require('../utils/currency');

module.exports = {
  name: 'guess',
  async execute(msg, args) {
    const guess = parseInt(args[0]);
    const number = Math.floor(Math.random() * 10) + 1;
    if (guess === number) {
      const reward = 100;
      addBalance(msg.author.id, reward);
      msg.reply(`🎯 Correct! You win ${reward} mia.`);
    } else {
      msg.reply(`❌ Wrong! The number was ${number}.`);
    }
  }
};
