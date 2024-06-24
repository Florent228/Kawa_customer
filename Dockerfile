# Version officielle de Node.js
FROM node:20

# Définir le répertoire de travail dans le conteneur
WORKDIR /usr/src/app

# Copie du package.json et package-lock.json
COPY package*.json ./

# Installation des dépendances
RUN npm install

# Copie du reste du code de l'application
COPY . .

# Exposer le port sur lequel l'application écoute
EXPOSE 3000

# commande à exécuter pour démarrer l'application
CMD ["start"]
