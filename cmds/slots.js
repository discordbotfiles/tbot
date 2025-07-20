const fs = require('fs');
const path = require('path');

const balancesPath = path.join(__dirname, '..', 'data', 'balances.json');

function readBalances() {
  if (!fs.existsSync(balancesPath)) return {};
  return JSON.parse(fs.readFileSync(balancesPath));
}

function writeBalances(balances) {
  fs.writeFileSync(balancesPath, JSON.stringify(balances, null, 2));
}

const symbols = ['🍒', '🍋', '🍊', '🍉', '⭐', '7️⃣'];

module.exports = {
  data: {
    name: 'slots',
    description: 'Play the slots and try to win Mia Coins!',
    options: [
      {
        name: 'bet',
        type: 4, // INTEGER type
        description: 'Amount of Mia Coins to bet',
        required: true,
      },
    ],
  },

  async execute(interactionOrMessage, args) {
    // Determine if slash or prefix
    const isSlash = interactionOrMessage.isCommand?.();
    const userId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;
    const bet = isSlash
      ? interactionOrMessage.options.getInteger('bet')
      : args && args.length > 0 ? parseInt(args[0], 10) : null;

    if (!bet || bet <= 0) {
      if (isSlash) {
        return interactionOrMessage.reply({ content: 'Please enter a valid bet amount.', ephemeral: true });
      } else {
        return interactionOrMessage.channel.send('Please enter a valid bet amount.');
      }
    }

    const balances = readBalances();

    if (!balances[userId] || balances[userId] < bet) {
      const msg = `You don't have enough Mia Coins. Your balance: ${balances[userId] || 0} -- mia.`;
      if (isSlash) {
        return interactionOrMessage.reply({ content: msg, ephemeral: true });
      } else {
        return interactionOrMessage.channel.send(msg);
      }
    }

    // Spin the slots
    const spin = [];
    for (let i = 0; i < 3; i++) {
      spin.push(symbols[Math.floor(Math.random() * symbols.length)]);
    }

    let winnings = 0;
    if (spin[0] === spin[1] && spin[1] === spin[2]) {
      winnings = bet * 5;
    } else if (spin[0] === spin[1] || spin[1] === spin[2] || spin[0] === spin[2]) {
      winnings = bet * 2;
    } else {
      winnings = -bet;
    }

    balances[userId] += winnings;
    writeBalances(balances);

    let resultMessage = `🎰 | ${spin.join(' ')}\n`;

    if (winnings > 0) {
      resultMessage += `You won **${winnings}** Mia Coins! 🎉\n`;
    } else {
      resultMessage += `You lost **${bet}** Mia Coins. Better luck next time! 😢\n`;
    }

    resultMessage += `Your new balance is: **${balances[userId]} -- mia**`;

    if (isSlash) {
      await interactionOrMessage.reply(resultMessage);
    } else {
      await interactionOrMessage.channel.send(resultMessage);
      // Delete user's message for prefix commands (optional)
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
