# API de Gestion des Clients : Kawa_customer

Cette API permet la gestion des clients, incluant la création, la lecture, la mise à jour et la suppression de clients. L'API utilise JWT pour la sécurisation des routes sensibles.

## Base URL

`http://localhost:3000/api`

## Endpoints

### 1. Authentification

**POST** `/login`

Authentifie un client et renvoie un token JWT.

- **Corps de la requête :**
  ```json
  {
    "email": "string",
    "mot_de_passe": "string"
  }
  ```

- **Réponse :**
  ```json
  {
    "id": "int",
    "email": "string",
    "accessToken": "string"
  }
  ```

- **Codes d'erreur :**
  - `404 Not Found` : Client non trouvé.
  - `401 Unauthorized` : Mot de passe invalide.

### 2. Créer un client

**POST** `/customers`

Crée un nouveau client dans la base de données.

- **Corps de la requête :**
  ```json
  {
    "nom": "string",
    "prenom": "string",
    "date_naissance": "date",
    "email": "string",
    "mot_de_passe": "string",
    "adresse": "string"
  }
  ```

- **Réponse :**
  ```json
  {
    "id": "int",
    "nom": "string",
    "prenom": "string",
    "date_naissance": "date",
    "email": "string",
    "adresse": "string"
  }
  ```

- **Codes d'erreur :**
  - `400 Bad Request` : Requête mal formée ou données manquantes.
  - `500 Internal Server Error` : Erreur lors de la création du client.

### 3. Récupérer tous les clients

**GET** `/customers`

Récupère la liste de tous les clients.

- **Headers :**
  - `x-access-token` : Token JWT pour l'authentification.

- **Réponse :**
  ```json
  [
    {
      "id": "int",
      "nom": "string",
      "prenom": "string",
      "date_naissance": "date",
      "email": "string",
      "adresse": "string"
    },
  ]
  ```

- **Codes d'erreur :**
  - `401 Unauthorized` : Token JWT manquant ou invalide.
  - `500 Internal Server Error` : Erreur lors de la récupération des clients.

### 4. Récupérer un client par ID

**GET** `/customers/:clientId`

Récupère un client spécifique en utilisant son ID.

- **Paramètres d'URL :**
  - `clientId` : ID du client (int)

- **Réponse :**
  ```json
  {
    "id": "int",
    "nom": "string",
    "prenom": "string",
    "date_naissance": "date",
    "email": "string",
    "adresse": "string"
  }
  ```

- **Codes d'erreur :**
  - `404 Not Found` : Client non trouvé.
  - `500 Internal Server Error` : Erreur lors de la récupération du client.

### 5. Mettre à jour un client

**PUT** `/customers/:clientId`

Met à jour les informations d'un client existant.

- **Paramètres d'URL :**
  - `clientId` : ID du client (int)

- **Headers :**
  - `x-access-token` : Token JWT pour l'authentification.

- **Corps de la requête :**
  ```json
  {
    "nom": "string",
    "prenom": "string",
    "date_naissance": "date",
    "email": "string",
    "mot_de_passe": "string",
    "adresse": "string"
  }
  ```

- **Réponse :**
  ```json
  {
    "id": "int",
    "nom": "string",
    "prenom": "string",
    "date_naissance": "date",
    "email": "string",
    "adresse": "string"
  }
  ```

- **Codes d'erreur :**
  - `400 Bad Request` : Requête mal formée ou données manquantes.
  - `404 Not Found` : Client non trouvé.
  - `500 Internal Server Error` : Erreur lors de la mise à jour du client.

### 6. Supprimer un client

**DELETE** `/customers/:clientId`

Supprime un client de la base de données.

- **Paramètres d'URL :**
  - `clientId` : ID du client (int)

- **Headers :**
  - `x-access-token` : Token JWT pour l'authentification.

- **Réponse :**
  ```json
  {
    "message": "Le client a été supprimé avec succès !"
  }
  ```

- **Codes d'erreur :**
  - `404 Not Found` : Client non trouvé.
  - `500 Internal Server Error` : Erreur lors de la suppression du client.

## Sécurité

Certaines routes de l'API (comme la récupération, la mise à jour, et la suppression des clients) sont protégées par des tokens JWT. Assurez-vous d'inclure le token d'accès dans les en-têtes de requête sous `x-access-token` pour ces routes.

## Installation et Utilisation

1. Clonez ce dépôt : `git clone <URL du dépôt>`
2. Naviguez dans le répertoire du projet : `cd <nom du projet>`
3. Installez les dépendances : `npm install`
4. Démarrez le serveur : `npm run start` ou  `npm run dev`

Le serveur sera disponible sur `http://localhost:3000/api`.

## Tests

Pour exécuter les tests, utilisez la commande :

```bash
npm run test
```

## Scipt de la table

   CREATE TABLE `clients` (
   `id` int(11) NOT NULL,
   `nom` varchar(50) DEFAULT NULL,
   `prenom` varchar(150) DEFAULT NULL,
   `date_naissance` date DEFAULT NULL,
   `adresse` varchar(150) NOT NULL,
   `email` varchar(50) DEFAULT NULL,
   `mot_de_passe` varchar(150) DEFAULT NULL
   ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

   ALTER TABLE `clients`
   ADD PRIMARY KEY (`id`);

   ALTER TABLE `clients`
   MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=147;
   COMMIT;

## License

Ce projet est sous licence MIT.

## Auteur

Florent ATCHEAKOU