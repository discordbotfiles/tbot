const fs = require('fs');
const path = require('path');

const balancesPath = path.join(__dirname, '..', 'data', 'balances.json');
const investCooldownPath = path.join(__dirname, '..', 'data', 'investCooldowns.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  data: {
    name: 'invest',
    description: 'Invest Mia Coins and get a chance to double or lose your money.',
    options: [
      {
        name: 'amount',
        type: 4, // INTEGER
        description: 'Amount to invest',
        required: true,
      },
    ],
  },

  async execute(interactionOrMessage, args) {
    const isSlash = interactionOrMessage.isCommand?.();
    const userId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;

    const balances = readJSON(balancesPath);
    const investCooldowns = readJSON(investCooldownPath);

    const now = Date.now();
    const cooldownAmount = 1000 * 60 * 60 * 3; // 3 hours cooldown

    if (investCooldowns[userId] && now - investCooldowns[userId] < cooldownAmount) {
      const timeLeft = cooldownAmount - (now - investCooldowns[userId]);
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const msg = `You must wait ${minutes}m ${seconds}s before investing again.`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    const amount = isSlash
      ? interactionOrMessage.options.getInteger('amount')
      : args && args.length > 0
      ? parseInt(args[0], 10)
      : null;

    if (!amount || amount <= 0) {
      const msg = 'Please provide a valid amount to invest.';
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    if (!balances[userId] || balances[userId] < amount) {
      const msg = `You don't have enough Mia Coins. Your balance: ${balances[userId] || 0} -- mia.`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    // Invest result: 50% chance to double, 50% lose half
    const success = Math.random() < 0.5;
    if (success) {
      balances[userId] += amount;
    } else {
      balances[userId] -= Math.floor(amount / 2);
    }

    investCooldowns[userId] = now;

    writeJSON(balancesPath, balances);
    writeJSON(investCooldownPath, investCooldowns);

    const msg = success
      ? `Your investment paid off! You gained **${amount}** Mia Coins.\nNew balance: **${balances[userId]} -- mia**`
      : `Your investment failed. You lost **${Math.floor(amount / 2)}** Mia Coins.\nNew balance: **${balances[userId]} -- mia**`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
