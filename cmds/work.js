const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'miaCoins.json');
const cooldownFile = path.join(__dirname, '..', 'data', 'workCooldowns.json');

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

function getCooldowns() {
  if (!fs.existsSync(cooldownFile)) return {};
  return JSON.parse(fs.readFileSync(cooldownFile));
}

function saveCooldowns(cooldowns) {
  fs.writeFileSync(cooldownFile, JSON.stringify(cooldowns, null, 2));
}

const COOLDOWN = 60 * 5 * 1000; // 5 minutes

module.exports = {
  data: {
    name: 'work',
    description: 'Earn Mia Coins by working',
  },

  async execute(interactionOrMessage, args) {
    let userId, reply;
    if (interactionOrMessage.user) {
      userId = interactionOrMessage.user.id;
    } else {
      userId = interactionOrMessage.author.id;
    }

    const cooldowns = getCooldowns();
    const now = Date.now();

    if (cooldowns[userId] && now - cooldowns[userId] < COOLDOWN) {
      const remaining = Math.ceil((COOLDOWN - (now - cooldowns[userId])) / 1000);
      reply = `⏳ You need to wait ${remaining} more seconds before working again.`;
      if (interactionOrMessage.user) {
        return await interactionOrMessage.reply({ content: reply, ephemeral: true });
      } else {
        return await interactionOrMessage.channel.send(reply);
      }
    }

    const earnings = Math.floor(Math.random() * 100) + 50;
    const userData = getUserData(userId);
    userData.balance = (userData.balance || 0) + earnings;
    saveUserData(userId, userData);

    cooldowns[userId] = now;
    saveCooldowns(cooldowns);

    reply = `💼 You worked hard and earned **${earnings}** -- mia coins!`;

    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: true });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  },
};
