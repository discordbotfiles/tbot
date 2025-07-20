const fs = require('fs');
const path = require('path');

const balancesPath = path.join(__dirname, '..', 'data', 'balances.json');
const storePath = path.join(__dirname, '..', 'data', 'store.json');
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
    name: 'store',
    description: 'View or buy items from the store.',
    options: [
      {
        name: 'buy',
        type: 3, // STRING
        description: 'Item to buy',
        required: false,
        choices: [
          { name: 'Fishing Rod', value: 'fishingrod' },
          { name: 'Hunting Knife', value: 'huntingknife' },
          { name: 'Robbery Shield', value: 'shield' },
        ],
      },
    ],
  },

  async execute(interactionOrMessage, args) {
    const isSlash = interactionOrMessage.isCommand?.();
    const userId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;

    const balances = readJSON(balancesPath);
    const store = readJSON(storePath);
    const inventory = readJSON(inventoryPath);

    if (Object.keys(store).length === 0) {
      // Default store items if empty
      store['fishingrod'] = { name: 'Fishing Rod', price: 100 };
      store['huntingknife'] = { name: 'Hunting Knife', price: 150 };
      store['shield'] = { name: 'Robbery Shield', price: 200 };
      writeJSON(storePath, store);
    }

    let itemToBuy = null;
    if (isSlash) {
      itemToBuy = interactionOrMessage.options.getString('buy');
    } else {
      itemToBuy = args && args.length > 0 ? args[0].toLowerCase() : null;
    }

    if (!itemToBuy) {
      // Show store items
      let msg = 'Store Items:\n';
      for (const key in store) {
        msg += `**${store[key].name}** - ${store[key].price} Mia Coins\n`;
      }
      if (isSlash) {
        return interactionOrMessage.reply(msg);
      } else {
        return interactionOrMessage.channel.send(msg);
      }
    }

    if (!store[itemToBuy]) {
      const msg = 'Item not found in the store.';
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    const price = store[itemToBuy].price;
    if (!balances[userId] || balances[userId] < price) {
      const msg = `You don't have enough Mia Coins to buy **${store[itemToBuy].name}**.`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    balances[userId] -= price;
    inventory[userId] = inventory[userId] || [];
    if (!inventory[userId].includes(itemToBuy)) {
      inventory[userId].push(itemToBuy);
    }

    writeJSON(balancesPath, balances);
    writeJSON(inventoryPath, inventory);

    const msg = `You bought **${store[itemToBuy].name}** for ${price} Mia Coins!`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
