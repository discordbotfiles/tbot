const { addBalance } = require('../utils/currency');

module.exports = {
  name: 'beg',
  async execute(msg) {
    const amount = Math.floor(Math.random() * 50) + 1;
    addBalance(msg.author.id, amount);
    msg.reply(`Someone gave you **${amount} mia** 🥺`);
  }
};
