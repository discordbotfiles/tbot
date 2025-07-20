const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'miaCoins.json');
const cooldownFile = path.join(__dirname, '..', 'data', 'robCooldowns.json');

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

const COOLDOWN = 1000 * 60 * 15; // 15 minutes cooldown

module.exports = {
  data: {
    name: 'rob',
    description: 'Try to rob another user',
    options: [
      {
        name: 'target',
        type: 6, // USER
        description: 'User to rob',
        required: true,
      }
    ]
  },

  async execute(interactionOrMessage, args) {
    let userId, targetId, reply;

    if (interactionOrMessage.user) {
      userId = interactionOrMessage.user.id;
      targetId = interactionOrMessage.options.getUser('target').id;
    } else {
      userId = interactionOrMessage.author.id;
      if (!args.length) {
        return interactionOrMessage.channel.send('Please mention a user to rob.');
      }
      const mentioned = interactionOrMessage.mentions.users.first();
      if (!mentioned) return interactionOrMessage.channel.send('Please mention a valid user.');
      targetId = mentioned.id;
    }

    if (targetId === userId) {
      reply = "You can't rob yourself!";
      if (interactionOrMessage.user) {
        return interactionOrMessage.reply({ content: reply, ephemeral: true });
      } else {
        return interactionOrMessage.channel.send(reply);
      }
    }

    const cooldowns = getCooldowns();
    const now = Date.now();

    if (cooldowns[userId] && now - cooldowns[userId] < COOLDOWN) {
      const remaining = Math.ceil((COOLDOWN - (now - cooldowns[userId])) / 1000);
      reply = `⏳ You need to wait ${remaining} more seconds before trying to rob again.`;
      if (interactionOrMessage.user) {
        return interactionOrMessage.reply({ content: reply, ephemeral: true });
      } else {
        return interactionOrMessage.channel.send(reply);
      }
    }

    const userData = getUserData(userId);
    const targetData = getUserData(targetId);

    if ((targetData.balance || 0) < 50) {
      reply = 'That user doesn\'t have enough Mia coins to rob!';
      if (interactionOrMessage.user) {
        return interactionOrMessage.reply({ content: reply, ephemeral: true });
      } else {
        return interactionOrMessage.channel.send(reply);
      }
    }

    const success = Math.random() < 0.5; // 50% chance success
    if (success) {
      const amountStolen = Math.floor(Math.random() * (targetData.balance / 2)) + 1;
      targetData.balance -= amountStolen;
      userData.balance += amountStolen;
      reply = `💰 You successfully robbed **${amountStolen}** Mia coins from <@${targetId}>!`;
    } else {
      const penalty = Math.floor(Math.random() * (userData.balance / 4)) + 1;
      userData.balance = Math.max(0, userData.balance - penalty);
      reply = `❌ Robbery failed! You lost **${penalty}** Mia coins as penalty.`;
    }

    saveUserData(userId, userData);
    saveUserData(targetId, targetData);

    cooldowns[userId] = now;
    saveCooldowns(cooldowns);

    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: false });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  }
};
