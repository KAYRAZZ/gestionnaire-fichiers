const assert = require('assert');
const http = require('http');

function postLogin(username, password, cb) {
  const data = JSON.stringify({ username, password });
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/login',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(data)
    }
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => cb(res, body));
  });
  req.write(data);
  req.end();
}

const { test } = require('node:test');

test('POST /login succès', (t, done) => {
  postLogin('alice', 'password123', (res, body) => {
    assert.strictEqual(res.statusCode, 200);
    const json = JSON.parse(body);
    assert(json.token, 'Token doit être présent');
    done();
  });
});

test('POST /login failure', (t, done) => {
  postLogin('alice', 'abc', (res, body) => {
    assert.strictEqual(res.statusCode, 401);
    done();
  });
});

// Ajoute ceci à la suite de tests/server.test.js

function getUsers(token, cb) {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/users',
    method: 'GET',
    headers: {
      'Authorization': token
    }
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => cb(res, body));
  });
  req.end();
}

test('GET /users retourne un tableau', (t, done) => {
  postLogin('alice', 'password123', (res, body) => {
    const json = JSON.parse(body);
    getUsers(json.token, (res2, body2) => {
      assert.strictEqual(res2.statusCode, 200);
      const users = JSON.parse(body2);
      assert(Array.isArray(users), 'Doit retourner un tableau');
      assert(users.some(u => u.username === 'alice'), 'Doit contenir alice');
      done();
    });
  });
});

function getFiles(token, cb) {
  const req = http.request({
    hostname: 'localhost',
    port: 3000,
    path: '/files',
    method: 'GET',
    headers: {
      'Authorization': token
    }
  }, res => {
    let body = '';
    res.on('data', chunk => body += chunk);
    res.on('end', () => cb(res, body));
  });
  req.end();
}

test('GET /files retourne un tableau de fichier', (t, done) => {
  postLogin('alice', 'password123', (res, body) => {
    const json = JSON.parse(body);
    getFiles(json.token, (res2, body2) => {
      assert.strictEqual(res2.statusCode, 200);
      const files = JSON.parse(body2);
      assert(Array.isArray(files), 'Doit retourner un tableau');
      done();
    });
  });
});