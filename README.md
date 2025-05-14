# Projet Node.js - Gestionnaire de Fichiers

## Le projet
Développer une API HTTP en Node.js permettant à un utilisateur authentifié :
- de se connecter avec des identifiants prédéfinis (stockés dans un fichier JSON)
- de consulter, ajouter, supprimer des fichiers dans son espace personnel
- de partager un répertoire avec d’autres utilisateurs
- d’être notifié en temps réel via WebSocket des changements sur les fichiers et dossiers
- d'utiliser des commandes système (via `spawn` ou `exec`) pour compresser ou analyser des fichiers


## Démarrage
```bash
npm install
npm start
```

## Tester  l'application
```bash
node tests/auth.test.js     # Tests sur l'authentification
node tests/server.test.js   # Tests des routes HTTP (login, users, files, etc.)
```

**Remarque :**
Le serveur doit être démarré avant de lancer les tests HTTP (server.test.js).
