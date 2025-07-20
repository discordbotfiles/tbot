const fs = require('fs');
const path = require('path');

const balancesPath = path.join(__dirname, '..', 'data', 'balances.json');
const inventoryPath = path.join(__dirname, '..', 'data', 'inventory.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  data: {
    name: 'hunt',
    description: 'Go hunting to earn Mia Coins. Requires a Hunting Knife.',
  },

  async execute(interactionOrMessage) {
    const isSlash = interactionOrMessage.isCommand?.();
    const userId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;

    const balances = readJSON(balancesPath);
    const inventory = readJSON(inventoryPath);

    if (!inventory[userId] || !inventory[userId].includes('huntingknife')) {
      const msg = 'You need a Hunting Knife to hunt. Buy one from the store!';
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    const animals = [
      { name: 'Rabbit', value: 30 },
      { name: 'Deer', value: 70 },
      { name: 'Boar', value: 120 },
      { name: 'Bear', value: 300 },
    ];

    const caught = animals[Math.floor(Math.random() * animals.length)];

    balances[userId] = (balances[userId] || 0) + caught.value;

    writeJSON(balancesPath, balances);

    const msg = `You hunted a **${caught.name}** and earned **${caught.value}** Mia Coins!\nYour new balance: **${balances[userId]} -- mia**`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
