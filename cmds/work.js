const fs = require('fs');
const path = require('path');

const balancesPath = path.join(__dirname, '..', 'data', 'balances.json');
const cooldownsPath = path.join(__dirname, '..', 'data', 'workCooldowns.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  data: {
    name: 'work',
    description: 'Work to earn Mia Coins (cooldown applies).',
  },

  async execute(interactionOrMessage) {
    const isSlash = interactionOrMessage.isCommand?.();
    const userId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;

    const balances = readJSON(balancesPath);
    const cooldowns = readJSON(cooldownsPath);

    const now = Date.now();
    const cooldownAmount = 1000 * 60 * 60; // 1 hour cooldown

    if (cooldowns[userId] && now - cooldowns[userId] < cooldownAmount) {
      const timeLeft = cooldownAmount - (now - cooldowns[userId]);
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const msg = `You are tired! Work again in ${minutes}m ${seconds}s.`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    const earnings = Math.floor(Math.random() * 100) + 50; // Earn 50-149 coins

    balances[userId] = (balances[userId] || 0) + earnings;
    cooldowns[userId] = now;

    writeJSON(balancesPath, balances);
    writeJSON(cooldownsPath, cooldowns);

    const msg = `You worked hard and earned **${earnings}** Mia Coins!\nYour new balance: **${balances[userId]} -- mia**`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
