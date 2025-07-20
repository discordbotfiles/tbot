const { addBalance, subtractBalance, getBalance } = require('../utils/currency');

module.exports = {
  name: 'give',
  async execute(msg, args) {
    const target = msg.mentions.users.first();
    const amount = parseInt(args[1]);

    if (!target || target.bot) return msg.reply('Invalid user.');
    if (!amount || amount <= 0) return msg.reply('Invalid amount.');
    const bal = getBalance(msg.author.id);
    if (bal < amount) return msg.reply('Not enough mia.');

    subtractBalance(msg.author.id, amount);
    addBalance(target.id, amount);
    msg.reply(`✅ You gave ${amount} mia to ${target.username}`);
  }
};
