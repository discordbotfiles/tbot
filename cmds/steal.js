const fs = require('fs');
const path = require('path');

const balancesPath = path.join(__dirname, '..', 'data', 'balances.json');
const robCooldownPath = path.join(__dirname, '..', 'data', 'robCooldowns.json');
const defensePath = path.join(__dirname, '..', 'data', 'defense.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  data: {
    name: 'rob',
    description: 'Try to rob another user\'s Mia Coins.',
    options: [
      {
        name: 'user',
        type: 6, // USER type
        description: 'User to rob',
        required: true,
      },
    ],
  },

  async execute(interactionOrMessage, args) {
    const isSlash = interactionOrMessage.isCommand?.();
    const authorId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;

    const balances = readJSON(balancesPath);
    const robCooldowns = readJSON(robCooldownPath);
    const defense = readJSON(defensePath);

    let targetId;
    if (isSlash) {
      targetId = interactionOrMessage.options.getUser('user').id;
    } else {
      if (!args || args.length === 0) {
        return interactionOrMessage.channel.send('Please specify a user to rob.');
      }
      targetId = args[0].replace(/[<@!>]/g, ''); // Clean mention
    }

    if (targetId === authorId) {
      const msg = `You can't rob yourself!`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    // Check cooldown
    const now = Date.now();
    const cooldownAmount = 1000 * 60 * 30; // 30 min cooldown
    if (robCooldowns[authorId] && now - robCooldowns[authorId] < cooldownAmount) {
      const timeLeft = cooldownAmount - (now - robCooldowns[authorId]);
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const msg = `You need to wait ${minutes}m ${seconds}s before robbing again.`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    // Check target balance and defense
    const targetBalance = balances[targetId] || 0;
    if (targetBalance < 50) {
      const msg = `The target doesn't have enough Mia Coins to rob.`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    if (defense[targetId] && defense[targetId] > 0) {
      const msg = `The target has robbery defense active. You failed to rob them!`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    // Rob amount (random 10-50% of target's balance)
    const robAmount = Math.floor(targetBalance * (Math.random() * 0.4 + 0.1));

    balances[authorId] = (balances[authorId] || 0) + robAmount;
    balances[targetId] = balances[targetId] - robAmount;

    robCooldowns[authorId] = now;

    writeJSON(balancesPath, balances);
    writeJSON(robCooldownPath, robCooldowns);

    const msg = `You successfully robbed **${robAmount}** Mia Coins from <@${targetId}>!\nYour new balance: **${balances[authorId]} -- mia**`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
