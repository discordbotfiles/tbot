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

const emojis = ['🍒', '🍋', '🍊', '🍉', '⭐', '7️⃣'];

function spinSlots() {
  return [emojis[Math.floor(Math.random() * emojis.length)],
          emojis[Math.floor(Math.random() * emojis.length)],
          emojis[Math.floor(Math.random() * emojis.length)]];
}

function calculateWin(spin, bet) {
  if (spin[0] === spin[1] && spin[1] === spin[2]) {
    // Jackpot triple match: 5x bet
    return bet * 5;
  } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
    // Double match: 2x bet
    return bet * 2;
  } else {
    return 0;
  }
}

module.exports = {
  data: {
    name: 'slots',
    description: 'Play slot machine',
    options: [
      {
        name: 'bet',
        type: 4, // INTEGER
        description: 'Amount of Mia coins to bet',
        required: true,
      }
    ]
  },

  async execute(interactionOrMessage, args) {
    let userId, reply;
    let bet;

    if (interactionOrMessage.user) {
      userId = interactionOrMessage.user.id;
      bet = interactionOrMessage.options.getInteger('bet');
    } else {
      userId = interactionOrMessage.author.id;
      if (!args.length) return interactionOrMessage.channel.send('Please specify an amount to bet.');
      bet = parseInt(args[0]);
      if (isNaN(bet) || bet <= 0) {
        return interactionOrMessage.channel.send('Please provide a valid positive number as your bet.');
      }
    }

    const userData = getUserData(userId);

    if ((userData.balance || 0) < bet) {
      reply = "You don't have enough Mia coins to make that bet!";
      if (interactionOrMessage.user) {
        return interactionOrMessage.reply({ content: reply, ephemeral: true });
      } else {
        return interactionOrMessage.channel.send(reply);
      }
    }

    const spin = spinSlots();
    const winAmount = calculateWin(spin, bet);
    userData.balance -= bet;
    if (winAmount > 0) {
      userData.balance += winAmount;
    }
    saveUserData(userId, userData);

    reply = `🎰 ${spin.join(' ')}\nYou ${winAmount > 0 ? `won **${winAmount}** -- mia coins!` : 'lost your bet.'}\nYour balance is now **${userData.balance}** -- mia coins.`;

    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: true });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  }
};
