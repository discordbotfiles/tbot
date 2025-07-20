const { addBalance } = require('../utils/currency');
const cooldown = new Set();

module.exports = {
  name: 'daily',
  async execute(msg) {
    if (cooldown.has(msg.author.id)) {
      return msg.reply('🕒 You already claimed your daily mia. Come back in 24h.');
    }

    const amount = 250;
    addBalance(msg.author.id, amount);
    msg.reply(`✅ You claimed your daily reward: **${amount} mia**`);
    cooldown.add(msg.author.id);
    setTimeout(() => cooldown.delete(msg.author.id), 86400000);
  }
};
