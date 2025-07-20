const { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType } = require('discord.js');

const MAX_HP = 100;

module.exports = {
  data: {
    name: 'fight',
    description: 'Start a fight with another user',
    options: [
      {
        name: 'opponent',
        type: 6, // USER
        description: 'User to fight with',
        required: true,
      }
    ]
  },

  async execute(interaction) {
    const user = interaction.user;
    const opponent = interaction.options.getUser('opponent');

    if (user.id === opponent.id) {
      return interaction.reply({ content: "You can't fight yourself!", ephemeral: true });
    }

    // Initialize health
    let hp = {
      [user.id]: MAX_HP,
      [opponent.id]: MAX_HP,
    };

    // Who attacks first randomly
    let turn = Math.random() < 0.5 ? user.id : opponent.id;

    const attackButton = new ButtonBuilder()
      .setCustomId('attack')
      .setLabel('Attack')
      .setStyle(ButtonStyle.Danger);

    const defendButton = new ButtonBuilder()
      .setCustomId('defend')
      .setLabel('Defend')
      .setStyle(ButtonStyle.Secondary);

    const row = new ActionRowBuilder().addComponents(attackButton, defendButton);

    await interaction.reply({
      content: `👊 Fight started between <@${user.id}> and <@${opponent.id}>!\n\n` +
               `<@${turn}>, it's your turn! Choose your action.`,
      components: [row],
      fetchReply: true
    });

    const message = await interaction.fetchReply();

    const filter = i => 
      (i.user.id === user.id || i.user.id === opponent.id) &&
      i.message.id === message.id;

    const collector = message.createMessageComponentCollector({
      filter,
      time: 60000,
    });

    // Store last defense to reduce damage
    let defending = {};

    collector.on('collect', async i => {
      if (i.user.id !== turn) {
        return i.reply({ content: "It's not your turn!", ephemeral: true });
      }

      const action = i.customId;
      let replyText;

      if (action === 'attack') {
        let damage = Math.floor(Math.random() * 20) + 10;
        if (defending[opponent.id]) {
          damage = Math.floor(damage / 2);
        }

        hp[turn === user.id ? opponent.id : user.id] -= damage;
        defending[turn === user.id ? opponent.id : user.id] = false;

        replyText = `<@${turn}> attacks and deals **${damage}** damage!`;
      } else if (action === 'defend') {
        defending[turn] = true;
        replyText = `<@${turn}> defends and will take half damage next turn.`;
      }

      // Check for winner
      if (hp[user.id] <= 0 || hp[opponent.id] <= 0) {
        collector.stop();

        const winner = hp[user.id] > 0 ? user.id : opponent.id;
        const loser = winner === user.id ? opponent.id : user.id;

        return i.update({
          content: `${replyText}\n\n🏆 <@${winner}> wins the fight! 🎉\n` +
                   `Final HP: <@${user.id}>: ${Math.max(hp[user.id], 0)}, <@${opponent.id}>: ${Math.max(hp[opponent.id], 0)}`,
          components: []
        });
      }

      // Switch turn
      turn = turn === user.id ? opponent.id : user.id;

      await i.update({
        content: `${replyText}\n\n<@${turn}>, it's your turn! Choose your action.\n\n` +
                 `Current HP: <@${user.id}>: ${hp[user.id]}, <@${opponent.id}>: ${hp[opponent.id]}`,
        components: [row]
      });
    });

    collector.on('end', collected => {
      if (collected.size === 0) {
        interaction.editReply({
          content: 'Fight timed out due to inactivity.',
          components: []
        });
      }
    });
  }
};
