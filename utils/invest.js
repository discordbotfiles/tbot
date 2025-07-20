// utils/invest.js
const fs = require('fs');
const path = './data/investments.json';
const { getBalance, subtractBalance, addBalance } = require('./currency');

function load() {
  if (!fs.existsSync(path)) fs.writeFileSync(path, '{}');
  return JSON.parse(fs.readFileSync(path));
}

function save(data) {
  fs.writeFileSync(path, JSON.stringify(data, null, 2));
}

function invest(id, amount) {
  let data = load();
  const bal = getBalance(id);
  if (bal < amount) return 'Not enough mia.';
  subtractBalance(id, amount);
  const gain = Math.floor(amount * (Math.random() * 0.5 + 0.5));
  addBalance(id, gain);
  return `📈 Investment returned **${gain} mia**!`;
}

module.exports = { invest };
