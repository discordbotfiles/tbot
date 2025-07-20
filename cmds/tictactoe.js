const { SlashCommandBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');
const fs = require('fs');
const path = require('path');

const balancesFile = path.join(__dirname, '..', 'data', 'balances.json');
let balances = {};

// Load balances on start
if (fs.existsSync(balancesFile)) {
  balances = JSON.parse(fs.readFileSync(balancesFile));
}

function saveBalances() {
  fs.writeFileSync(balancesFile, JSON.stringify(balances, null, 2));
}

module.exports = {
  data: new SlashCommandBuilder()
    .setName('fight')
    .setDescription('Fight another user in a turn-based battle!')
    .addUserOption(option => option
      .setName('opponent')
      .setDescription('User to fight')
      .setRequired(true))
    .addIntegerOption(option => option
      .setName('bet')
      .setDescription('Amount of Mia Coins to bet')
      .setRequired(false)),

  async execute(interaction) {
    const player1 = interaction.user;
    const player2 = interaction.options.getUser('opponent');
    const bet = interaction.options.getInteger('bet') ?? 0;

    if (player2.bot) return interaction.reply({ content: 'You cannot fight bots!', ephemeral: true });
    if (player2.id === player1.id) return interaction.reply({ content: 'You cannot fight yourself!', ephemeral: true });

    // Check balances if betting
    if (bet > 0) {
      const bal1 = balances[player1.id]?.mia ?? 0;
      const bal2 = balances[player2.id]?.mia ?? 0;
      if (bal1 < bet) return interaction.reply({ content: `You don't have enough Mia Coins to bet ${bet}.`, ephemeral: true });
      if (bal2 < bet) return interaction.reply({ content: `Your opponent doesn't have enough Mia Coins to bet ${bet}.`, ephemeral: true });
    }

    // Initialize health
    let hp = {
      [player1.id]: 100,
      [player2.id]: 100
    };

    let turn = player1.id; // player1 starts

    // Action buttons
    const createActionRow = () => new ActionRowBuilder().addComponents(
      new ButtonBuilder().setCustomId('defend').setLabel('Defend').setStyle(ButtonStyle.Primary),
      new ButtonBuilder().setCustomId('kick').setLabel('Kick').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('punch').setLabel('Punch').setStyle(ButtonStyle.Danger),
      new ButtonBuilder().setCustomId('kiss').setLabel('Kiss').setStyle(ButtonStyle.Success)
    );

    // Initial message
    const fightMessage = await interaction.reply({
      content: `Fight started between ${player1} and ${player2}!\n${player1} goes first.\n${player1} HP: 100 | ${player2} HP: 100\nBet: ${bet} Mia Coins`,
      components: [createActionRow()],
      fetchReply: true
    });

    // Create collector for buttons
    const collector = fightMessage.createMessageComponentCollector({
      componentType: ComponentType.Button,
      time: 5 * 60 * 1000
    });

    let lastAction = null; // To handle defend

    collector.on('collect', async i => {
      if (![player1.id, player2.id].includes(i.user.id)) {
        return i.reply({ content: 'You are not part of this fight.', ephemeral: true });
      }
      if (i.user.id !== turn) {
        return i.reply({ content: "It's not your turn!", ephemeral: true });
      }

      const opponent = turn === player1.id ? player2.id : player1.id;
      const opponentUser = turn === player1.id ? player2 : player1;

      let damage = 0;
      let actionText = '';

      switch (i.customId) {
        case 'defend':
          lastAction = 'defend';
          actionText = `${i.user} is defending and will take less damage next turn.`;
          break;
        case 'kick':
          damage = Math.floor(Math.random() * 15) + 5; // 5-19 damage
          if (lastAction === 'defend' && opponent === i.user.id) {
            damage = Math.floor(damage / 2);
          }
          actionText = `${i.user} kicked ${opponentUser}, dealing ${damage} damage!`;
          break;
        case 'punch':
          damage = Math.floor(Math.random() * 10) + 5; // 5-14 damage
          if (lastAction === 'defend' && opponent === i.user.id) {
            damage = Math.floor(damage / 2);
          }
          actionText = `${i.user} punched ${opponentUser}, dealing ${damage} damage!`;
          break;
        case 'kiss':
          damage = 0;
          actionText = `${i.user} kissed ${opponentUser}. How cute! No damage done.`;
          break;
      }

      if (damage > 0) {
        hp[opponent] -= damage;
        if (hp[opponent] < 0) hp[opponent] = 0;
      }

      lastAction = i.customId === 'defend' ? 'defend' : null;

      // Check for win
      if (hp[opponent] <= 0) {
        collector.stop('win');

        // Adjust balances for bets
        if (bet > 0) {
          if (!balances[player1.id]) balances[player1.id] = { mia: 0 };
          if (!balances[player2.id]) balances[player2.id] = { mia: 0 };

          balances[turn].mia += bet;
          balances[opponent].mia -= bet;
          saveBalances();
        }

        return i.update({
          content: `${actionText}\n\n${i.user} won the fight! ${bet > 0 ? `They won ${bet} Mia Coins!` : ''}\n\nFinal HP: ${player1}: ${hp[player1.id]} | ${player2}: ${hp[player2.id]}`,
          components: []
        });
      }

      // Switch turns
      turn = opponent;

      await i.update({
        content: `${actionText}\n\nIt's <@${turn}>'s turn!\n\n${player1}: ${hp[player1.id]} HP | ${player2}: ${hp[player2.id]} HP\nBet: ${bet} Mia Coins`,
        components: [createActionRow()]
      });
    });

    collector.on('end', async (_, reason) => {
      if (reason === 'time') {
        await fightMessage.edit({
          content: 'Fight ended due to inactivity.',
          components: []
        });
      }
    });
  }
};
