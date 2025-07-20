const { getBalance, subtractBalance, addBalance } = require('../utils/currency');

module.exports = {
  name: 'mines',
  async execute(msg, args) {
    const bet = parseInt(args[0]);
    if (!bet || bet <= 0) return msg.reply('Enter a valid amount.');
    const bal = getBalance(msg.author.id);
    if (bal < bet) return msg.reply('Not enough mia.');

    const bomb = Math.random() < 0.3;
    subtractBalance(msg.author.id, bet);

    if (bomb) {
      return msg.reply('💥 You hit a mine! You lost your bet.');
    }

    const reward = bet * 2;
    addBalance(msg.author.id, reward);
    msg.reply(`💎 Safe! You won **${reward} mia**`);
  }
};
