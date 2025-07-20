const fs = require('fs');
const path = require('path');
const defenseFile = path.join(__dirname, '..', 'data', 'defense.json');

function getDefenseData() {
  if (!fs.existsSync(defenseFile)) return {};
  return JSON.parse(fs.readFileSync(defenseFile));
}

function saveDefenseData(data) {
  fs.writeFileSync(defenseFile, JSON.stringify(data, null, 2));
}

module.exports = {
  data: {
    name: 'defense',
    description: 'Activate robbery defense shield',
  },

  async execute(interactionOrMessage, args) {
    let userId, reply;

    if (interactionOrMessage.user) {
      userId = interactionOrMessage.user.id;
    } else {
      userId = interactionOrMessage.author.id;
    }

    const defenseData = getDefenseData();

    if (defenseData[userId]) {
      reply = '🛡️ Your defense shield is already active.';
    } else {
      defenseData[userId] = { active: true, activatedAt: Date.now() };
      saveDefenseData(defenseData);
      reply = '🛡️ You activated your robbery defense shield for the next 15 minutes.';
    }

    if (interactionOrMessage.user) {
      await interactionOrMessage.reply({ content: reply, ephemeral: true });
    } else {
      await interactionOrMessage.channel.send(reply);
    }
  }
};
