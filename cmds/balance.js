const { getBalance } = require('../utils/currency');

module.exports = {
  name: 'balance',
  async execute(msg) {
    const balance = getBalance(msg.author.id);
    msg.reply(`💰 You have **${balance} mia**.`);
  }
};
