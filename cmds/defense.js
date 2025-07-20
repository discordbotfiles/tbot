const fs = require('fs');
const path = require('path');

const defensePath = path.join(__dirname, '..', 'data', 'defense.json');

function readJSON(file) {
  if (!fs.existsSync(file)) return {};
  return JSON.parse(fs.readFileSync(file));
}

function writeJSON(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2));
}

module.exports = {
  data: {
    name: 'defense',
    description: 'Activate robbery defense to block rob attempts for 1 hour.',
  },

  async execute(interactionOrMessage) {
    const isSlash = interactionOrMessage.isCommand?.();
    const userId = isSlash ? interactionOrMessage.user.id : interactionOrMessage.author.id;

    const defense = readJSON(defensePath);

    const now = Date.now();
    const cooldownAmount = 1000 * 60 * 60; // 1 hour defense duration

    if (defense[userId] && now - defense[userId] < cooldownAmount) {
      const timeLeft = cooldownAmount - (now - defense[userId]);
      const minutes = Math.floor(timeLeft / 60000);
      const seconds = Math.floor((timeLeft % 60000) / 1000);
      const msg = `Your robbery defense is still active for ${minutes}m ${seconds}s.`;
      if (isSlash) return interactionOrMessage.reply({ content: msg, ephemeral: true });
      else return interactionOrMessage.channel.send(msg);
    }

    defense[userId] = now;
    writeJSON(defensePath, defense);

    const msg = `Robbery defense activated! You are protected from robbers for 1 hour.`;

    if (isSlash) await interactionOrMessage.reply(msg);
    else {
      await interactionOrMessage.channel.send(msg);
      interactionOrMessage.delete().catch(() => {});
    }
  },
};
