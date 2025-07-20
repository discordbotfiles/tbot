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
    name: 'invest',
    description: 'Invest Mia Coins',
    options: [
      {
        name: 'amount',
        type: 4, // INTEGER
        description: 'Amount of Mia coins to invest',
        required: true,
      }
    ]
  },

  async execute(interactionOrMessage, args) {
    let userId, amount;

    if (interactionOrMessage.user) {
      userId = interactionOrMessage.user.id;
      amount = interactionOrMessage.options.getInteger('amount');
    } else {
      userId = interactionOrMessage.author.id;
      if (!args.length) return interactionOrMessage.channel.send('Please specify an amount to invest.');
      amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) {
        return interactionOrMessage.channel.send('Please provide a valid positive number as amount.');
      }
    }

    const userData = getUserData(userId);
    if ((userData.balance || 0) < amount) {
      const msg = "You don't have enough Mia coins to invest that amount.";
      if (interactionOrMessage.user) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    // Simplified random investment return: 50% chance double, 50% lose half invested
    const success = Math.random() < 0.5;
    let reply;
    if (success) {
      const gain = amount * 2;
      userData.balance += gain;
      reply = `💹 Your investment succeeded! You gained **${gain}** Mia coins.`;
    } else {
      const loss = Math.floor(amount / 2);
      userData.balance -= loss;
      reply = `📉 Your investment failed! You lost **${loss}** Mia coins.`;
    }

    saveUserData(userId, userData);

    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: false });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  }
};
