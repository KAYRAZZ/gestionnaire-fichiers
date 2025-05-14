// Serveur HTTP simple sans Express
const http = require('http');
const fs = require('fs');
const url = require('url');
const { authenticate, getUserIdFromToken } = require('./auth');
const path = require('path');
const { notifyUser } = require('./websocket');

const server = http.createServer((req, res) => {
  if (req.method === 'POST' && req.url === '/login') {
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const { username, password } = JSON.parse(body);
      const token = authenticate(username, password);
      if (token) {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ token }));
      } else {
        res.writeHead(401);
        res.end('Unauthorized');
      }
    });

    // Page d'accueil
  } else if (req.method === 'GET' && (req.url === '/' || req.url === '/index.html')) {
    const filePath = path.join(__dirname, 'index.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erreur serveur');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });

    // Page de connexion
  } else if (req.method === 'GET' && req.url === '/login') {
    const filePath = path.join(__dirname, 'src/auth/login.html');
    fs.readFile(filePath, (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end('Erreur serveur');
      } else {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(data);
      }
    });

    // Page pour lister les fichiers
  } else if (req.method === 'GET' && req.url === '/files') {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res.writeHead(401);
      console.log('Unauthorized /files');
      return res.end('Unauthorized');
    }
    const userDir = path.join(__dirname, 'storage', userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });

    // Fonction récursive pour lister tous les fichiers avec leur chemin relatif
    function listFilesAndDirsRecursive(dir, relPath = '') {
      let results = [];
      const list = fs.readdirSync(dir, { withFileTypes: true });
      let hasFile = false;
      for (const entry of list) {
        const entryPath = path.join(dir, entry.name);
        const entryRelPath = relPath ? path.join(relPath, entry.name) : entry.name;
        if (entry.isDirectory()) {
          // Ajoute le dossier (même s'il est vide)
          results.push(entryRelPath.replace(/\\/g, '/') + '/');
          // Récursif pour le contenu
          results = results.concat(listFilesAndDirsRecursive(entryPath, entryRelPath));
        } else {
          hasFile = true;
          results.push(entryRelPath.replace(/\\/g, '/'));
        }
      }
      return results;
    }

    let files = [];
    try {
      files = listFilesAndDirsRecursive(userDir);
    } catch (err) {
      res.writeHead(500);
      console.log(err);
      return res.end('Erreur serveur');
    }
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(files));


    // Route pour upload un fichier
  } else if (req.method === 'POST' && req.url === '/files/upload') {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);
    if (!userId) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }
    const userDir = path.join(__dirname, 'storage', userId);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    const filename = req.headers['x-filename'];
    // Ajout : récupérer le dossier cible depuis l'en-tête x-dir
    const targetDir = req.headers['x-dir'] ? req.headers['x-dir'].replace(/(\.\.[/\\])/g, '') : '';
    const uploadDir = targetDir ? path.join(userDir, targetDir) : userDir;
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    const filePath = path.join(uploadDir, filename);
    const writeStream = fs.createWriteStream(filePath);
    req.pipe(writeStream);
    req.on('end', () => {
      res.writeHead(200);
      res.end('Upload terminé');

      notifyUser(userId, {
        type: 'upload',
        filename: (targetDir ? targetDir + '/' : '') + filename,
        message: `Upload terminé pour ${(targetDir ? targetDir + '/' : '') + filename}`
      });
    });

    // Route pour télécharger un fichier
  } else if (req.method === 'GET' && req.url.startsWith('/files/download')) {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res.writeHead(401);
      console.log('Unauthorized /files');
      return res.end('Unauthorized');
    }
    const query = url.parse(req.url, true).query;
    const dir = query.dir || '';
    if (dir.includes('..')) {
      res.writeHead(400);
      return res.end('Nom de dossier invalide');
    }
    const userDir = path.join(__dirname, 'storage', userId, dir);
    if (!fs.existsSync(userDir)) fs.mkdirSync(userDir, { recursive: true });
    fs.readdir(userDir, (err, files) => {
      if (err) {
        res.writeHead(500);
        console.log(err);
        return res.end('Erreur serveur');
      }
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(files));
    });

    // Route pour supprimer un fichier
  } else if (req.method === 'DELETE' && req.url.startsWith('/files')) {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);
    if (!userId) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }
    const query = url.parse(req.url, true).query;
    const filename = query.name;
    const filePath = path.join(__dirname, 'storage', userId, filename);
    if (!fs.existsSync(filePath)) {
      res.writeHead(404);
      return res.end('Fichier non trouvé');
    }
    fs.unlinkSync(filePath);
    res.writeHead(200);
    res.end('Fichier supprimé');


    // Route pour compresser
  } else if (req.method === 'POST' && req.url.startsWith('/files/compress')) {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);

    if (!userId) {
      res.writeHead(401);
      console.log('Unauthorized /files/compress');
      return res.end('Unauthorized');
    }
    const query = url.parse(req.url, true).query;
    const filename = query.name;
    const filePath = path.join(__dirname, 'storage', userId, filename);
    const { exec } = require('child_process');
    const zipName = path.basename(filename, path.extname(filename)) + '.zip';
    const zipPath = path.join(__dirname, 'storage', userId, zipName);
    exec(`tar -a -c -f "${zipPath}" -C "${path.dirname(filePath)}" "${path.basename(filePath)}"`, (err) => {
      if (err) {
        res.writeHead(500);
        console.log('Erreur compression', err);
        return res.end('Erreur compression');
      }
      res.writeHead(200);
      res.end('Compression lancée');
      // Notifier l'utilisateur via WebSocket
      notifyUser(userId, {
        type: 'compression',
        filename,
        zipName,
        message: `Compression terminée pour ${filename} → ${zipName}`
      });
    });


    // Route pour créer un répertoire
  } else if (req.method === 'POST' && req.url.startsWith('/files/mkdir')) {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);
    if (!userId) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const { dirname, parent = '' } = JSON.parse(body);
      if (!dirname) {
        res.writeHead(400);
        return res.end('Nom de dossier manquant');
      }
      // Empêche la traversée de répertoire
      if (dirname.includes('..') || parent.includes('..')) {
        res.writeHead(400);
        return res.end('Nom de dossier invalide');
      }
      const dirPath = path.join(__dirname, 'storage', userId, parent, dirname);
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
        res.writeHead(200);
        res.end('Dossier créé');
      } else {
        res.writeHead(409);
        res.end('Dossier déjà existant');
      }
    });


    // Liste des utilisateurs
  } else if (req.method === 'GET' && req.url === '/users') {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);
    if (!userId) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));
    const usersNoPwd = users.map(u => ({ id: u.id, username: u.username }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(usersNoPwd));

    // Partage d'un dossier
  } else if (req.method === 'POST' && req.url === '/share') {
    const token = req.headers.authorization;
    const fromUserId = getUserIdFromToken(token);
    if (!fromUserId) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }
    let body = '';
    req.on('data', chunk => (body += chunk));
    req.on('end', () => {
      const { userId, folder } = JSON.parse(body);
      if (!userId || !folder) {
        res.writeHead(400);
        return res.end('Paramètres manquants');
      }
      const usersPath = path.join(__dirname, 'users.json');
      const users = JSON.parse(fs.readFileSync(usersPath));
      const user = users.find(u => u.id === userId);
      if (!user) {
        res.writeHead(404);
        return res.end('Utilisateur non trouvé');
      }
      if (!user.sharedFolders) user.sharedFolders = [];
      // Ajoute le partage si pas déjà présent
      if (!user.sharedFolders.find(sf => sf.from === fromUserId && sf.folder === folder)) {
        user.sharedFolders.push({ from: fromUserId, folder });
        fs.writeFileSync(usersPath, JSON.stringify(users, null, 2));
      }
      res.writeHead(200);
      res.end('Partage enregistré');
    });


    // Route pour lister les dossiers partagés
  } else if (req.method === 'GET' && req.url === '/shared-folders') {
    const token = req.headers.authorization;
    const userId = getUserIdFromToken(token);
    if (!userId) {
      res.writeHead(401);
      return res.end('Unauthorized');
    }
    const users = JSON.parse(fs.readFileSync(path.join(__dirname, 'users.json')));
    const me = users.find(u => u.id === userId);
    if (!me || !me.sharedFolders) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify([]));
    }
    // Ajoute le nom du propriétaire et les fichiers pour chaque dossier partagé
    const folders = me.sharedFolders.map(sf => {
      const owner = users.find(u => u.id === sf.from);
      const ownerDir = path.join(__dirname, 'storage', sf.from, sf.folder);
      let files = [];
      if (fs.existsSync(ownerDir)) {
        files = fs.readdirSync(ownerDir).filter(f => fs.statSync(path.join(ownerDir, f)).isFile());
      }
      return {
        ownerId: sf.from,
        ownerName: owner ? owner.username : sf.from,
        folder: sf.folder,
        files
      };
    });
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify(folders));

  } else {
    res.writeHead(200, { 'Content-Type': 'text/plain' });
    res.end('Bienvenue dans le gestionnaire de fichiers !');
  }
});

server.listen(3000, () => {
  console.log('Serveur démarré sur http://localhost:3000');
});
