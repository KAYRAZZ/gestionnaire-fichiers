# Gestionnaire de Fichiers Node.js

Ce projet est une API HTTP et une interface web permettant à des utilisateurs authentifiés de gérer leurs fichiers, de partager des dossiers et de recevoir des notifications en temps réel via WebSocket.

## Fonctionnalités

- **Authentification** : Connexion avec identifiants stockés dans [`users.json`](users.json).
- **Gestion de fichiers** : 
  - Lister, uploader, télécharger, supprimer, compresser des fichiers.
  - Créer des dossiers.
- **Partage de dossiers** : Partage de dossiers avec d'autres utilisateurs (lecture seule).
- **Notifications temps réel** : Notification via WebSocket lors d’upload ou de compression.
- **Interface web** : Interface utilisateur simple pour toutes les opérations.

## Structure du projet

```
.
├── src/
│   ├── server.js           # Serveur HTTP principal
│   ├── websocket.js        # Serveur WebSocket
│   ├── auth/
│   │   ├── auth.js         # Logique d'authentification
│   │   └── login.html      # Page de connexion
│   └── public/
│       └── index.html      # Interface principale
│   └── storage/            # Répertoires utilisateurs
├── tests/
│   ├── auth.test.js        # Tests unitaires auth
│   └── server.test.js      # Tests API HTTP
├── users.json              # Utilisateurs et partages
├── package.json
├── pnpm-lock.yaml
├── .gitignore
└── README.md
```

## Installation

1. **Installer les dépendances**  
   ```bash
   npm install
   ```

## Lancement

1. **Démarrer le serveur HTTP**  
   ```bash
   cd src
   node server.js
   ```

2. **Démarrer le serveur WebSocket** (dans un autre terminal)  
   ```bash
   cd src
   node websocket.js
   ```

3. **Accéder à l’interface**  
   Ouvre [http://localhost:3000](http://localhost:3000) dans le navigateur.

## Utilisation

- **Connexion** : Utilise un identifiant et mot de passe du fichier [`users.json`](users.json).
- **Gestion des fichiers** : Depuis l’interface web, tu peux :
  - Uploader, télécharger, supprimer, compresser des fichiers.
  - Créer des dossiers.
  - Partager un dossier avec un autre utilisateur.
- **Notifications** : Les notifications apparaissent lors d’upload ou de compression.

## Tests

- **Tests unitaires et d’intégration**  
  Le serveur doit être démarré avant les tests HTTP.
  ```bash
  node tests/auth.test.js     # Tests sur l'authentification
  node tests/server.test.js   # Tests des routes HTTP (login, users, files, etc.)
  ```

## Comptes de test

Exemples présents dans [`users.json`](users.json) :
- alice / password123
- bob / secret456
- a / a
- b / b

## Remarques

- Les fichiers utilisateurs sont stockés dans `src/storage/`.
- Les partages de dossiers sont gérés dans le champ `sharedFolders` de [`users.json`](users.json).
- Le projet n’utilise pas Express, tout est en HTTP natif Node.js.

---

**Auteurs** : Valentin CHIGOT et Cantin CHAMPY