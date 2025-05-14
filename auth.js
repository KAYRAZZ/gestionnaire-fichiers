const fs = require('fs');
const path = require('path');
const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));
const tokens = {};

function authenticate(username, password) {
  const user = users.find(u => u.username === username && u.password === password);
  if (!user) return null;
  const token = `${user.id}|${Date.now()}`;
  tokens[token] = user.id;
  return token;
}

function getUserIdFromToken(token) {
  return tokens[token] || null;
}

module.exports = { authenticate, getUserIdFromToken };