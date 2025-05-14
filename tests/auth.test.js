const assert = require('assert');
const { test } = require('node:test');
const { authenticate, getUserIdFromToken } = require('../src/auth/auth');

test('Authentification réussie', () => {
  const token = authenticate('alice', 'password123');
  assert(token, 'Le token doit être généré pour un utilisateur valide');
});

test('Authentification échouée', () => {
  const badToken = authenticate('alice', 'wrongpassword');
  assert.strictEqual(badToken, null, 'Le token doit être null pour un mauvais mot de passe');
});

test('Récupération de l’ID utilisateur depuis le token', () => {
  const token = authenticate('alice', 'password123');
  if (token) {
    const userId = getUserIdFromToken(token);
    assert.strictEqual(userId, 'user-001', 'L\'ID utilisateur doit correspondre à alice');
  }
});

test('Récupération d’un token inconnu', () => {
  const unknown = getUserIdFromToken('invalide');
  assert.strictEqual(unknown, null, 'Doit retourner null pour un token inconnu');
});