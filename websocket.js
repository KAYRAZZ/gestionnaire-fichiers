// WebSocket de base avec ws
const WebSocket = require('ws');
const { getUserIdFromToken } = require('./auth');

const wss = new WebSocket.Server({ port: 8081 });
const clients = new Map();

wss.on('connection', ws => {
  // On attend que le client s'identifie
  ws.on('message', message => {

    try {
      const data = JSON.parse(message);
      if (data.userId) {
        const userId = getUserIdFromToken(data.userId);
        clients.set(userId, ws);
      }
    } catch (e) {
      ws.send(JSON.stringify({ error: 'Format de message invalide' }));
    }
  });

  ws.on('close', () => {
    // Nettoyage : retirer le ws de la map
    for (const [userId, clientWs] of clients.entries()) {
      if (clientWs === ws) {
        clients.delete(userId);
        break;
      }
    }
  });
});

// Fonction pour notifier un utilisateur spécifique
function notifyUser(userId, data) {
  const ws = clients.get(userId);
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(data));
  }
}

module.exports = { wss, notifyUser };