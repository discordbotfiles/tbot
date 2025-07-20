const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'miaCoins.json');

const storeItems = {
  'fishingrod': 500,
  'huntingknife': 750,
  'shield': 400,
};

function getUserData(userId) {
  if (!fs.existsSync(dataFile)) return {};
  const data = JSON.parse(fs.readFileSync(dataFile));
  return data[userId] || { balance: 0, inventory: [] };
}

function saveUserData(userId, userData) {
  const data = fs.existsSync(dataFile) ? JSON.parse(fs.readFileSync(dataFile)) : {};
  data[userId] = userData;
  fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: {
    name: 'store',
    description: 'Buy items from the store',
    options: [
      {
        name: 'buy',
        type: 3, // STRING
        description: 'Item to buy',
        required: true,
        choices: Object.keys(storeItems).map(item => ({ name: item, value: item })),
      }
    ]
  },

  async execute(interactionOrMessage, args) {
    let userId, item;

    if (interactionOrMessage.user) {
      userId = interactionOrMessage.user.id;
      item = interactionOrMessage.options.getString('buy').toLowerCase();
    } else {
      userId = interactionOrMessage.author.id;
      if (!args.length) return interactionOrMessage.channel.send('Please specify an item to buy.');
      item = args[0].toLowerCase();
    }

    if (!storeItems[item]) {
      const msg = 'That item is not available in the store.';
      if (interactionOrMessage.user) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    const price = storeItems[item];
    const userData = getUserData(userId);

    if ((userData.balance || 0) < price) {
      const msg = 'You don\'t have enough Mia coins to buy that item.';
      if (interactionOrMessage.user) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    if (!userData.inventory) userData.inventory = [];
    if (userData.inventory.includes(item)) {
      const msg = 'You already own this item.';
      if (interactionOrMessage.user) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    userData.balance -= price;
    userData.inventory.push(item);
    saveUserData(userId, userData);

    const reply = `🛒 You bought **${item}** for **${price}** Mia coins.`;
    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: false });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  }
};
