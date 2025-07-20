const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const WINNING_COMBOS = [
  [0,1,2],[3,4,5],[6,7,8], // rows
  [0,3,6],[1,4,7],[2,5,8], // cols
  [0,4,8],[2,4,6]          // diagonals
];

function checkWin(board, symbol) {
  return WINNING_COMBOS.some(combo => combo.every(index => board[index] === symbol));
}

function isDraw(board) {
  return board.every(cell => cell !== null);
}

module.exports = {
  data: {
    name: 'tictactoe',
    description: 'Play Tic Tac Toe with another user',
    options: [
      {
        name: 'opponent',
        type: 6, // USER
        description: 'User to play with',
        required: true,
      },
      {
        name: 'bet',
        type: 4, // INTEGER
        description: 'Mia coins to bet',
        required: false,
      }
    ]
  },

  async execute(interaction) {
    const player1 = interaction.user;
    const player2 = interaction.options.getUser('opponent');

    if (player1.id === player2.id) {
      return interaction.reply({ content: "You can't play Tic Tac Toe against yourself!", ephemeral: true });
    }

    let board = Array(9).fill(null); // empty board
    let currentPlayer = player1.id;
    const symbols = {
      [player1.id]: '❌',
      [player2.id]: '⭕'
    };

    const bet = interaction.options.getInteger('bet') || 0;

    // Create buttons for board
    const makeRow = (start) => {
      const row = new ActionRowBuilder();
      for (let i = start; i < start + 3; i++) {
        row.addComponents(
          new ButtonBuilder()
            .setCustomId(i.toString())
            .setLabel(board[i] || ' ')
            .setStyle(ButtonStyle.Secondary)
            .setDisabled(false)
        );
      }
      return row;
    };

    const rows = [makeRow(0), makeRow(3), makeRow(6)];

    await interaction.reply({
      content: `🎮 Tic Tac Toe: <@${player1.id}> (❌) vs <@${player2.id}> (⭕) ${bet > 0 ? `| Bet: ${bet} Mia coins` : ''}\n` +
               `It's <@${currentPlayer}>'s turn!`,
      components: rows
    });

    const message = await interaction.fetchReply();

    const collector = message.createMessageComponentCollector({
      filter: i => (i.user.id === player1.id || i.user.id === player2.id),
      time: 600000 // 10 minutes
    });

    collector.on('collect', async i => {
      if (i.user.id !== currentPlayer) {
        return i.reply({ content: "It's not your turn!", ephemeral: true });
      }

      const idx = parseInt(i.customId);

      if (board[idx] !== null) {
        return i.reply({ content: "That spot is already taken!", ephemeral: true });
      }

      board[idx] = symbols[currentPlayer];

      // Check win or draw
      if (checkWin(board, symbols[currentPlayer])) {
        collector.stop('win');
        return i.update({
          content: `🎉 <@${currentPlayer}> wins Tic Tac Toe!`,
          components: []
        });
      } else if (isDraw(board)) {
        collector.stop('draw');
        return i.update({
          content: "It's a draw!",
          components: []
        });
      }

      // Switch turn
      currentPlayer = currentPlayer === player1.id ? player2.id : player1.id;

      // Update buttons
      const updateRow = (start) => {
        const row = new ActionRowBuilder();
        for (let i = start; i < start + 3; i++) {
          row.addComponents(
            new ButtonBuilder()
              .setCustomId(i.toString())
              .setLabel(board[i] || ' ')
              .setStyle(ButtonStyle.Secondary)
              .setDisabled(board[i] !== null)
          );
        }
        return row;
      };

      const updatedRows = [updateRow(0), updateRow(3), updateRow(6)];

      await i.update({
        content: `🎮 Tic Tac Toe: <@${player1.id}> (❌) vs <@${player2.id}> (⭕) ${bet > 0 ? `| Bet: ${bet} Mia coins` : ''}\n` +
                 `It's <@${currentPlayer}>'s turn!`,
        components: updatedRows
      });
    });

    collector.on('end', (collected, reason) => {
      if (reason !== 'win' && reason !== 'draw') {
        interaction.editReply({
          content: 'Game ended due to inactivity.',
          components: []
        });
      }
    });
  }
};
