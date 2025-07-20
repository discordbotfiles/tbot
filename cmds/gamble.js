const { getBalance, addBalance, subtractBalance } = require('../utils/currency');

module.exports = {
  name: 'gamble',
  async execute(msg, args) {
    const amount = parseInt(args[0]);
    if (!amount || amount <= 0) return msg.reply('Enter a valid amount.');
    const balance = getBalance(msg.author.id);
    if (balance < amount) return msg.reply('Not enough mia.');

    const win = Math.random() > 0.5;
    if (win) {
      addBalance(msg.author.id, amount);
      msg.reply(`🎉 You won and now have **${balance + amount} mia**!`);
    } else {
      subtractBalance(msg.author.id, amount);
      msg.reply(`💸 You lost **${amount} mia**.`);
    }
  }
};
