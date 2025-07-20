const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'miaCoins.json');

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

const fishTypes = ['🐟', '🐠', '🦈', '🐡', '🐬'];

module.exports = {
  data: {
    name: 'fish',
    description: 'Go fishing (requires Fishing Rod)',
  },

  async execute(interactionOrMessage, args) {
    let userId, reply;

    if (interactionOrMessage.user) {
      userId = interactionOrMessage.user.id;
    } else {
      userId = interactionOrMessage.author.id;
    }

    const userData = getUserData(userId);
    if (!userData.inventory || !userData.inventory.includes('fishingrod')) {
      reply = '🎣 You need a Fishing Rod to fish! Buy one from the store.';
      if (interactionOrMessage.user) {
        return interactionOrMessage.reply({ content: reply, ephemeral: true });
      } else {
        return interactionOrMessage.channel.send(reply);
      }
    }

    const caught = fishTypes[Math.floor(Math.random() * fishTypes.length)];
    const earned = Math.floor(Math.random() * 100) + 20;
    userData.balance = (userData.balance || 0) + earned;
    saveUserData(userId, userData);

    reply = `🎣 You caught a ${caught} and earned **${earned}** Mia coins!`;

    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: false });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  }
};
