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
    name: 'fish',
    description: 'Go fishing to earn Mia Coins. Requires a Fishing Rod.',
  },

  async execute(interactionOrMessage) {
    const isSlash = interactionOrMessage.isCommand?.();
    const userId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;

    const balances = readJSON(balancesPath);
    const inventory = readJSON(inventoryPath);

    if (!inventory[userId] || !inventory[userId].includes('fishingrod')) {
      const msg = 'You need a Fishing Rod to fish. Buy one from the store!';
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    const catchTypes = [
      { name: 'Small Fish', value: 20 },
      { name: 'Medium Fish', value: 50 },
      { name: 'Big Fish', value: 100 },
      { name: 'Golden Fish', value: 500 },
    ];

    const caught = catchTypes[Math.floor(Math.random() * catchTypes.length)];

    balances[userId] = (balances[userId] || 0) + caught.value;

    writeJSON(balancesPath, balances);

    const msg = `You caught a **${caught.name}** and earned **${caught.value}** Mia Coins!\nYour new balance: **${balances[userId]} -- mia**`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
