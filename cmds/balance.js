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

module.exports = {
  data: {
    name: 'balance',
    description: 'Show your Mia Coin balance',
  },

  async execute(interactionOrMessage, args) {
    let userId, reply;
    if (interactionOrMessage.user) {
      // Slash command
      userId = interactionOrMessage.user.id;
      const userData = getUserData(userId);
      reply = `You have **${userData.balance || 0}** -- mia coins.`;
      await interactionOrMessage.reply({ content: reply, ephemeral: true });
    } else {
      // Prefix command
      userId = interactionOrMessage.author.id;
      const userData = getUserData(userId);
      reply = `You have **${userData.balance || 0}** -- mia coins.`;
      await interactionOrMessage.channel.send(reply);
    }
  },
};
